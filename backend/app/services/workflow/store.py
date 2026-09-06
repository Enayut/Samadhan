"""Database-backed workflow store — the FastAPI source of truth.

This mirrors the deterministic in-memory demo store (shared/demo/store.ts)
transition-for-transition so both backends return identical shapes. The demo
store remains the always-available fallback; when PostgreSQL is configured this
store serves /api/* from the database.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Database
from app.models.workflow import (
    AuditEvent,
    ComplianceDocument,
    Evidence,
    Mine,
    Notification,
    Obligation,
    RecurringSchedule,
    Task,
    User,
)

logger = logging.getLogger(__name__)

SHARED_DATA_DIR = Path(__file__).resolve().parents[4] / "shared" / "data"

MOBILE_USER_ID = "u-ram"
MOBILE_MINE_ID = "MINE-001"

HERO_REJECTION_REASON = (
    "Crest photo timestamp inconsistent with the recorded visit window and berm markers are not "
    "clearly visible — re-capture at the bench crest showing the berm and crack gauge."
)

VALID_STATUSES = {
    "PROPOSED", "ASSIGNED", "IN_PROGRESS", "AWAITING_VERIFICATION",
    "REJECTED", "VERIFIED", "OVERDUE", "ESCALATED",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _sha256(input: str) -> str:
    return hashlib.sha256(input.encode()).hexdigest()


def _load_json(name: str) -> Any:
    with (SHARED_DATA_DIR / name).open(encoding="utf-8") as fh:
        return json.load(fh)


class WorkflowStore:
    """State machine over the workflow tables (same transitions as the demo store)."""

    def __init__(self, db: Database) -> None:
        self._db = db

    # ------------------------------------------------------------------ schema

    async def ensure_schema(self) -> None:
        """Create workflow tables if missing (idempotent; RAG tables untouched)."""
        from app.database import Base

        async with self._db.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    # -------------------------------------------------------------------- seed

    async def reset(self) -> dict:
        """Deterministic demo reset: wipe + reseed from shared/data, return state."""
        async for session in self._db.session():
            async with session.begin():
                for model in (Evidence, Task, AuditEvent, ComplianceDocument, Notification, RecurringSchedule, Obligation, User, Mine):
                    await session.execute(delete(model))
                await self._seed(session)
        return await self.get_state()

    async def seed_if_empty(self) -> None:
        async for session in self._db.session():
            count = (await session.execute(select(func.count()).select_from(Mine))).scalar_one()
        if count == 0:
            logger.info("workflow: empty database — seeding five-mine demo data")
            await self.reset()

    async def _seed(self, session: AsyncSession) -> None:
        now = _now()
        mines = _load_json("mines.json")
        users = _load_json("users.json")
        tasks = _load_json("tasks.json")
        alerts = _load_json("alerts.json")
        notifications = _load_json("notifications.json")
        obligations = _load_json("obligations.json")

        for m in mines:
            session.add(Mine(id=m["id"], name=m["name"], data=m))
        for u in users:
            session.add(User(id=u["id"], name=u["name"], role=u["role"], mine_id=u.get("mineId"), data=u))
        for rule in obligations.get("rules", []):
            session.add(Obligation(id=rule["id"], title=rule.get("title", rule["id"]), domain=rule.get("domain", "SAFETY"), statutory_basis=rule.get("statutoryBasis", ""), data=rule))

        # Documents: one pipeline row per actionable compliance document.
        for a in alerts:
            if not a.get("ref") or a.get("kind") == "operational":
                continue
            session.add(ComplianceDocument(id=a["id"], ref=a.get("ref"), status="received", data={"alert": a, "extraction": None, "recurrence": None, "applicability": None}))

        for n in notifications:
            session.add(Notification(id=str(n.get("id", f"notif-{abs(hash(json.dumps(n, sort_keys=True))) % 100000}")), data=n))

        for raw in tasks:
            created_at = now + timedelta(days=raw.get("createdOffsetDays", -2))
            deadline = now + timedelta(days=raw["deadlineOffsetDays"])
            t = Task(
                id=raw["id"],
                title=raw["title"],
                status=raw["status"],
                mine_id=raw["mineId"],
                owner_id=raw["owner"]["id"],
                verifier_id=raw["verifier"]["id"],
                obligation_ref=raw.get("obligationRef"),
                period_label=raw.get("periodLabel"),
                deadline=deadline,
                generated_by=raw.get("generatedBy", "RULE_DERIVED"),
                verified_at=None,
                created_at=created_at,
                data=self._task_payload(raw, now),
            )
            session.add(t)
            for ev in raw.get("evidenceItems", []):
                session.add(Evidence(
                    id=f"{raw['id']}:{ev['id']}",
                    task_id=raw["id"],
                    title=ev["title"],
                    type=ev.get("type", "photo"),
                    status=ev.get("status", "pending"),
                    optional=ev.get("optional", False),
                    rejection_reason=ev.get("rejectionReason"),
                    metadata_json=ev.get("metadata"),
                    data=ev,
                ))

        # Recurring schedule rows per rule×mine with a cadence.
        cadence_by_rule: dict[str, str] = {}
        for rule in obligations.get("rules", []):
            cad = rule.get("cadence")
            if cad:
                cadence_by_rule[rule["id"]] = cad["kind"]
        for rule_id, kind in cadence_by_rule.items():
            for m in mines:
                # Only seed schedules for mines the rule actually applies to
                # (heuristic: an instance already exists in the task seed).
                if any(t.get("obligationRef") == rule_id and t["mineId"] == m["id"] for t in tasks):
                    session.add(RecurringSchedule(
                        id=f"{rule_id}:{m['id']}", rule_id=rule_id, mine_id=m["id"],
                        cadence=kind, last_period_label=None,
                    ))

        session.add(AuditEvent(actor="SYSTEM", action="DEMO_RESET", entity="area", detail="Reseeded five-mine demo state"))

    def _task_payload(self, raw: dict, now: datetime) -> dict:
        """Build the canonical task payload exactly like shared/demo/store.ts buildTask."""
        raw = json.loads(json.dumps(raw))  # deep copy
        deadline = now + timedelta(days=raw["deadlineOffsetDays"])
        created_at = now + timedelta(days=raw.get("createdOffsetDays", -2))
        raw.setdefault("sourceCitation", raw.get("sourceRef") or raw.get("source") or "—")
        raw.setdefault("source", raw.get("sourceRef") or "—")
        raw["deadlineDate"] = raw.get("deadlineDate") or f"Due {_iso(deadline)[5:10]}"
        raw.setdefault("ownerLabel", f"{raw['owner']['name']} ({raw['owner']['role']})")
        raw.setdefault("verifierLabel", f"{raw['verifier']['role']} — ≠ owner")
        raw["createdAt"] = _iso(created_at)
        raw["deadline"] = _iso(deadline)
        if raw["status"] != "PROPOSED":
            raw.setdefault("publishedAt", _iso(created_at))
        if raw.get("submittedOffsetDays") is not None:
            raw["submittedAt"] = _iso(now + timedelta(days=raw["submittedOffsetDays"]))
        for ev in raw.get("escalationEvents", []):
            ev["timestamp"] = _iso(now + timedelta(days=ev["timestampOffsetDays"]))
        # Evidence artifacts (SVG data-URIs) resolved like the demo store.
        artifacts = {a["id"]: a for a in _load_json("evidence.json")}
        for ev in raw.get("evidenceItems", []):
            if ev.get("artifactId") and not ev.get("photoUrl"):
                art = artifacts.get(ev["artifactId"])
                if art:
                    ev["photoUrl"] = f"data:image/svg+xml;utf8,{art['svg']}"
        return raw

    # ------------------------------------------------------------------ reads

    async def get_state(self) -> dict:
        async for session in self._db.session():
            mines = (await session.execute(select(Mine))).scalars().all()
            tasks = (await session.execute(select(Task))).scalars().all()
            docs = (await session.execute(select(ComplianceDocument))).scalars().all()
            notifications = (await session.execute(select(Notification))).scalars().all()
            obligations = (await session.execute(select(Obligation))).scalars().all()
            audit = (await session.execute(select(AuditEvent).order_by(AuditEvent.id))).scalars().all()
            evid = (await session.execute(select(Evidence))).scalars().all()
            scheds = (await session.execute(select(RecurringSchedule))).scalars().all()

        evidence_by_task: dict[str, list[dict]] = {}
        for e in evid:
            item = dict(e.data or {})
            item.update({
                "id": e.id.split(":", 1)[1] if ":" in e.id else e.id,
                "title": e.title,
                "type": e.type,
                "status": e.status,
                "optional": e.optional,
                "rejectionReason": e.rejection_reason,
                "metadata": e.metadata_json,
            })
            evidence_by_task.setdefault(e.task_id, []).append(item)

        task_payloads = []
        for t in tasks:
            payload = dict(t.data or {})
            payload["evidenceItems"] = evidence_by_task.get(t.id, [])
            payload["status"] = t.status
            payload["deadline"] = _iso(t.deadline)
            payload["verifiedAt"] = _iso(t.verified_at) if t.verified_at else payload.get("verifiedAt")
            task_payloads.append(payload)

        doc_payloads = []
        for d in docs:
            payload = dict(d.data or {})
            payload["status"] = d.status
            alert = payload.get("alert") or {}
            alert["status"] = d.status
            payload["alert"] = alert
            doc_payloads.append({"alert": alert, "extraction": payload.get("extraction"), "recurrence": payload.get("recurrence"), "applicability": payload.get("applicability")})

        return {
            "sites": [m.data for m in sorted(mines, key=lambda m: m.id)],
            "tasks": task_payloads,
            "alerts": [d.data.get("alert", {}) for d in docs],
            "rules": [o.data for o in sorted(obligations, key=lambda o: o.id)],
            "notifications": [n.data for n in notifications],
            "pipeline": {"documents": doc_payloads},
            "audit": [
                {"timestamp": _iso(a.timestamp), "actor": a.actor, "action": a.action, "entity": a.entity, "detail": a.detail}
                for a in audit
            ],
            "schedules": [
                {"id": s.id, "ruleId": s.rule_id, "mineId": s.mine_id, "cadence": s.cadence, "lastPeriodLabel": s.last_period_label}
                for s in scheds
            ],
            "updatedAt": _iso(_now()),
        }

    async def get_mobile_state(self) -> dict:
        state = await self.get_state()
        mine = next((m for m in state["sites"] if m["id"] == MOBILE_MINE_ID), None)
        user = next(
            (t["owner"] for t in state["tasks"] if t.get("owner", {}).get("id") == MOBILE_USER_ID),
            {"id": MOBILE_USER_ID, "name": "Ram Singh", "role": "Mine Safety Officer"},
        )
        tasks = [
            t for t in state["tasks"]
            if t["mineId"] == MOBILE_MINE_ID and t["status"] != "PROPOSED" and t.get("owner", {}).get("id") == MOBILE_USER_ID
        ]
        return {"mine": mine, "user": user, "tasks": tasks, "updatedAt": state["updatedAt"]}

    # --------------------------------------------------------------- mutations

    def _log(self, session: AsyncSession, actor: str, action: str, entity: str, detail: str | None = None) -> None:
        session.add(AuditEvent(actor=actor, action=action, entity=entity, detail=detail))

    async def _load_task(self, session: AsyncSession, task_id: str) -> Task | None:
        return (await session.execute(select(Task).where(Task.id == task_id))).scalar_one_or_none()

    def _seal_evidence(self, task_id: str, items: list[dict]) -> list[dict]:
        """Authoritative per-artifact hash (matches demo store sealEvidence)."""
        sealed = []
        for item in items:
            item = json.loads(json.dumps(item))
            meta = item.get("metadata")
            if meta and item.get("status") in ("uploaded", "verified"):
                h = _sha256(f"{task_id}:{item['id']}:{meta.get('sha256', '')}:{_iso(_now())}")
                meta = {**meta, "sha256": f"{h[:24]}…{h[-8:]}"}
                item["metadata"] = meta
            sealed.append(item)
        return sealed

    def _can_submit(self, task: Task, payload: dict, notes: str) -> bool:
        required = [e for e in payload.get("evidenceItems", []) if not e.get("optional")]
        all_complete = all(e.get("status") in ("uploaded", "verified") for e in required)
        return all_complete and len((notes or "").strip()) >= 15

    async def process_document(self, document_id: str | None = None) -> dict:
        async for session in self._db.session():
            async with session.begin():
                q = select(ComplianceDocument)
                if document_id:
                    q = q.where((ComplianceDocument.id == document_id) | (ComplianceDocument.ref == document_id))
                else:
                    q = q.where(ComplianceDocument.status == "received")
                doc = (await session.execute(q.limit(1))).scalar_one_or_none()
                if not doc or doc.data.get("extraction"):
                    return await self.get_state()
                ref = doc.ref or doc.id
                extraction = _load_json("aiExtractionByAlert.json").get(ref)
                payload = dict(doc.data)
                payload["extraction"] = extraction
                payload["recurrence"] = (extraction or {}).get("recurrence") or _load_json("recurrence.json")
                doc.status = "processed"
                doc.data = payload
                self._log(session, "AI-EXTRACTION", "DOCUMENT_PROCESSED", ref, "advisory — rules decide next")
        return await self.get_state()

    async def determine_applicability(self, document_id: str | None = None) -> dict:
        async for session in self._db.session():
            async with session.begin():
                q = select(ComplianceDocument).where(ComplianceDocument.status == "processed")
                if document_id:
                    q = q.where((ComplianceDocument.id == document_id) | (ComplianceDocument.ref == document_id))
                doc = (await session.execute(q.limit(1))).scalar_one_or_none()
                if not doc or doc.data.get("applicability") or not doc.data.get("extraction"):
                    return await self.get_state()
                ref = doc.ref or doc.id
                payload = dict(doc.data)
                payload["applicability"] = _load_json("applicabilityByDoc.json").get(ref)
                doc.status = "determined"
                doc.data = payload
                self._log(session, "RULES-ENGINE", "APPLICABILITY_DETERMINED", ref, "deterministic — not AI")
        return await self.get_state()

    async def publish_task(self, task_id: str, adjustments: dict | None = None) -> dict:
        adjustments = adjustments or {}
        async for session in self._db.session():
            async with session.begin():
                task = await self._load_task(session, task_id)
                if not task or task.status != "PROPOSED":
                    return await self.get_state()
                now = _now()
                offset = adjustments.get("deadlineOffsetDays") or max(1, (task.deadline - now).days)
                deadline = now + timedelta(days=offset)
                payload = dict(task.data or {})
                payload.update({
                    "status": "ASSIGNED",
                    "urgencyGroup": "DUE_SOON",
                    "deadline": _iso(deadline),
                    "deadlineDate": f"Due {_iso(deadline)[5:10]}",
                    "deadlineDisplay": adjustments.get("deadlineDisplay", payload.get("deadlineDisplay")),
                    "hoursRemaining": adjustments.get("hoursRemaining", max(1, offset * 24)),
                    "publishedAt": _iso(now),
                })
                if adjustments.get("title"):
                    payload["title"] = adjustments["title"]
                task.status = "ASSIGNED"
                task.deadline = deadline
                task.data = payload
                self._log(session, "AREA-MANAGER", "TASK_PUBLISHED", task_id, f"→ ASSIGNED · owner {payload.get('ownerLabel')}")
        return await self.get_state()

    async def create_task(self, payload_in: dict) -> dict:
        async for session in self._db.session():
            async with session.begin():
                mine_id = payload_in.get("mineId")
                mine = (await session.execute(select(Mine).where(Mine.id == mine_id))).scalar_one_or_none()
                if not mine:
                    return {"state": await self.get_state(), "task": None}
                now = _now()
                offset = payload_in.get("deadlineOffsetDays", 7)
                title = payload_in.get("title", "Manual obligation")
                task_id = f"TASK-MANUAL-{_sha256(title + mine_id)[:6].upper()}"
                deadline = now + timedelta(days=offset)
                owner = (await session.execute(select(User).where(User.id == MOBILE_USER_ID))).scalar_one()
                verifier = (await session.execute(select(User).where(User.id == "u-regulator"))).scalar_one()
                payload = {
                    "id": task_id, "title": title, "domain": payload_in.get("domain", "SAFETY"),
                    "status": "PROPOSED", "urgencyGroup": "DUE_SOON",
                    "deadlineDate": f"Due {_iso(deadline)[5:10]}", "deadlineDisplay": f"Due in {offset}d",
                    "shiftInfo": "General Shift", "hoursRemaining": offset * 24,
                    "sourceCitation": payload_in.get("notes") or "Manual obligation — Area Manager",
                    "source": "MANUAL", "severity": payload_in.get("severity", "Medium"),
                    "mineId": mine_id,
                    "owner": {"id": owner.id, "name": owner.name, "role": owner.role},
                    "verifier": {"id": verifier.id, "name": verifier.name, "role": verifier.role},
                    "ownerLabel": f"{owner.name} ({owner.role})", "verifierLabel": f"{verifier.name} ({verifier.role}) — ≠ owner",
                    "escalationRule": "Auto-escalates at deadline to Area General Manager",
                    "isCriticalDoThisNext": False, "generatedBy": "MANUAL",
                    "evidenceItems": [{
                        "id": "ev-manual-1", "title": "Completion evidence (photo/document)",
                        "type": "photo", "status": "pending",
                        "guidance": "Geo-tagged photo or document proving the obligation was completed",
                    }],
                    "remediationNotes": payload_in.get("notes", ""),
                    "createdAt": _iso(now), "deadline": _iso(deadline), "escalationEvents": [],
                }
                task = Task(id=task_id, title=title, status="PROPOSED", mine_id=mine_id,
                            owner_id=owner.id, verifier_id=verifier.id, deadline=deadline,
                            generated_by="MANUAL", data=payload)
                session.add(task)
                session.add(Evidence(id=f"{task_id}:ev-manual-1", task_id=task_id, title="Completion evidence (photo/document)",
                                     type="photo", status="pending",
                                     data=payload["evidenceItems"][0]))
                self._log(session, "AREA-MANAGER", "TASK_CREATED_MANUAL", task_id, f"{title} @ {mine_id}")
                state = await self.get_state()
                return {"state": state, "task": payload}
        return {"state": await self.get_state(), "task": None}

    async def start_task(self, task_id: str) -> dict:
        async for session in self._db.session():
            async with session.begin():
                task = await self._load_task(session, task_id)
                if not task or task.status != "ASSIGNED":
                    return await self.get_state()
                payload = dict(task.data or {})
                payload["status"] = "IN_PROGRESS"
                task.status = "IN_PROGRESS"
                task.data = payload
                self._log(session, "MINE-OFFICIAL", "TASK_STARTED", task_id, "field execution started")
        return await self.get_state()

    def _evidence_row(self, task_id: str, e: dict) -> Evidence:
        """Build an Evidence ORM row (merge-able upsert) for one checklist item."""
        return Evidence(
            id=f"{task_id}:{e['id']}",
            task_id=task_id,
            title=e.get("title", ""),
            type=e.get("type", "photo"),
            status=e.get("status", "pending"),
            optional=e.get("optional", False),
            rejection_reason=e.get("rejectionReason"),
            metadata_json=e.get("metadata"),
            data=e,
        )

    async def _apply_submission(self, task_id: str, evidence_items: list[dict], notes: str | None, form_values: dict | None, from_status: set[str], resubmit: bool) -> None:
        async for session in self._db.session():
            async with session.begin():
                task = await self._load_task(session, task_id)
                if not task or task.status not in from_status:
                    return
                sealed = self._seal_evidence(task_id, evidence_items)
                notes = notes if notes else (task.data or {}).get("remediationNotes", "")
                payload = dict(task.data or {})
                payload["evidenceItems"] = sealed
                payload["remediationNotes"] = notes
                if form_values:
                    payload["formValues"] = form_values
                action = "EVIDENCE_RESUBMITTED" if resubmit else "EVIDENCE_SUBMITTED"
                if self._can_submit(task, payload, notes):
                    payload.update({
                        "status": "AWAITING_VERIFICATION",
                        "urgencyGroup": "AWAITING_VERIFICATION",
                        "isCriticalDoThisNext": False,
                        "rejectionReason": None,
                        "submittedTimestamp": "Just now (Shift I)",
                        "submittedAt": _iso(_now()),
                        "submissionCount": (payload.get("submissionCount") or 0) + 1,
                    })
                    task.status = "AWAITING_VERIFICATION"
                    for e in sealed:
                        await session.merge(self._evidence_row(task_id, e))
                    self._log(session, "MINE-OFFICIAL", action, task_id, "→ AWAITING_VERIFICATION")
                else:
                    # draft only
                    for e in sealed:
                        await session.merge(self._evidence_row(task_id, e))
                    self._log(session, "MINE-OFFICIAL", "EVIDENCE_DRAFT", task_id, f"{len(sealed)} item(s)")
                task.data = payload

    async def save_draft(self, task_id: str, evidence_items: list[dict], notes: str | None, form_values: dict | None = None) -> dict:
        await self._apply_submission(task_id, evidence_items, notes, form_values, from_status=set(VALID_STATUSES), resubmit=False)
        return await self.get_state()

    async def submit_task(self, task_id: str, evidence_items: list[dict], notes: str | None, form_values: dict | None = None) -> dict:
        await self._apply_submission(task_id, evidence_items, notes, form_values,
                                     from_status={"IN_PROGRESS", "ASSIGNED", "REJECTED", "OVERDUE", "ESCALATED"}, resubmit=False)
        return await self.get_state()

    async def resubmit_task(self, task_id: str, evidence_items: list[dict], notes: str | None, form_values: dict | None = None) -> dict:
        await self._apply_submission(task_id, evidence_items, notes, form_values, from_status={"REJECTED"}, resubmit=True)
        return await self.get_state()

    async def reject_evidence(self, task_id: str, evidence_id: str, reason: str) -> dict:
        async for session in self._db.session():
            async with session.begin():
                task = await self._load_task(session, task_id)
                if not task or task.status != "AWAITING_VERIFICATION":
                    return await self.get_state()
                payload = dict(task.data or {})
                payload["status"] = "REJECTED"
                payload["urgencyGroup"] = "DUE_SOON"
                payload["rejectionReason"] = reason
                payload["isCriticalDoThisNext"] = True
                payload["submittedAt"] = None
                for ev in payload.get("evidenceItems", []):
                    if ev["id"] == evidence_id:
                        ev["status"] = "rejected"
                        ev["rejectionReason"] = reason
                task.status = "REJECTED"
                task.data = payload
                # Persist the rejected evidence row
                for ev in payload.get("evidenceItems", []):
                    if ev["id"] == evidence_id:
                        row = await session.get(Evidence, f"{task_id}:{evidence_id}")
                        if row:
                            row.status = "rejected"
                            row.rejection_reason = reason
                self._log(session, "REGULATORY-OFFICIAL", "EVIDENCE_REJECTED", task_id, reason)
        return await self.get_state()

    async def approve_task(self, task_id: str) -> dict:
        async for session in self._db.session():
            async with session.begin():
                task = await self._load_task(session, task_id)
                if not task or task.status != "AWAITING_VERIFICATION":
                    return await self.get_state()
                now = _now()
                payload = dict(task.data or {})
                evidence_hashes = [e["metadata"]["sha256"] for e in payload.get("evidenceItems", []) if e.get("metadata")]
                cert_payload = json.dumps({
                    "taskId": task_id, "source": payload.get("sourceCitation"),
                    "owner": payload.get("ownerLabel"), "verifier": payload.get("verifierLabel"),
                    "submitted": payload.get("submittedAt"), "verified": _iso(now), "evidenceHashes": evidence_hashes,
                }, sort_keys=True)
                payload.update({
                    "status": "VERIFIED",
                    "urgencyGroup": "RECENTLY_CLOSED",
                    "closedDate": "Verified & closed",
                    "isCriticalDoThisNext": False,
                    "closedAt": _iso(now),
                    "verifiedAt": _iso(now),
                    "closureCertificate": {
                        "taskId": task_id,
                        "source": payload.get("sourceCitation"),
                        "ownerName": payload["owner"]["name"], "ownerRole": payload["owner"]["role"],
                        "verifierName": payload["verifier"]["name"], "verifierRole": payload["verifier"]["role"],
                        "created": payload.get("createdAt"), "submitted": payload.get("submittedAt") or "",
                        "verified": _iso(now), "evidenceCount": len(evidence_hashes),
                        "evidenceHashes": evidence_hashes,
                        "hash": f"{_sha256(cert_payload)[:16]}…{_sha256(cert_payload)[-8:]}",
                        "auditHash": f"{_sha256(json.dumps([a for a in payload.get('audit', [])], default=str))[:16]}…",
                        "closedAt": _iso(now),
                    },
                    "evidenceItems": [
                        {**e, "status": "verified"} if e.get("status") in ("uploaded", "rejected") else e
                        for e in payload.get("evidenceItems", [])
                    ],
                })
                task.status = "VERIFIED"
                task.verified_at = now
                task.data = payload
                for e in payload["evidenceItems"]:
                    row = await session.get(Evidence, f"{task_id}:{e['id']}")
                    if row:
                        row.status = e["status"]
                self._log(session, "REGULATORY-OFFICIAL", "CLOSURE_VERIFIED", task_id, "→ VERIFIED")
        return await self.get_state()

    async def scheduler_tick(self) -> dict:
        """Generate next-period instances for fully-verified recurring rules."""
        created: list[dict] = []
        async for session in self._db.session():
            async with session.begin():
                tasks = (await session.execute(select(Task))).scalars().all()
                obligations = (await session.execute(select(Obligation))).scalars().all()
                cadence_by_rule = {}
                for o in obligations:
                    cad = (o.data or {}).get("cadence")
                    if cad:
                        cadence_by_rule[o.id] = cad
                now = _now()
                by_rule: dict[str, list[Task]] = {}
                for t in tasks:
                    if t.obligation_ref:
                        by_rule.setdefault(t.obligation_ref, []).append(t)
                for rule_id, cad in cadence_by_rule.items():
                    instances = by_rule.get(rule_id, [])
                    if not instances or not all(t.status == "VERIFIED" for t in instances):
                        continue
                    kind = cad.get("kind", "WEEKLY")
                    next_offset = 7 if kind == "WEEKLY" else 30
                    week = ((now.timestamp() // 86400) + 4) % 52
                    period_label = f"Week {int(week) + 1} · {now.year}" if kind == "WEEKLY" else f"Month {now.month + 1} · {now.year}"
                    for template in instances:
                        exists = any(
                            t.obligation_ref == rule_id and t.mine_id == template.mine_id and (t.data or {}).get("periodLabel") == period_label
                            for t in tasks
                        )
                        if exists:
                            continue
                        next_id = f"{template.id}-N{len(created)}"
                        deadline = now + timedelta(days=next_offset)
                        payload = json.loads(json.dumps(template.data or {}))
                        payload.update({
                            "id": next_id, "status": "PROPOSED", "urgencyGroup": "DUE_SOON",
                            "periodLabel": period_label, "createdAt": _iso(now),
                            "deadline": _iso(deadline), "deadlineDate": f"Due {_iso(deadline)[5:10]}",
                            "hoursRemaining": next_offset * 24, "isCriticalDoThisNext": False,
                            "remediationNotes": "", "submittedAt": None, "verifiedAt": None,
                            "closedAt": None, "closureCertificate": None,
                        })
                        payload["evidenceItems"] = [
                            {**e, "status": "pending", "metadata": None, "photoUrl": None, "rejectionReason": None}
                            for e in payload.get("evidenceItems", [])
                        ]
                        next_task = Task(id=next_id, title=template.title, status="PROPOSED",
                                         mine_id=template.mine_id, owner_id=template.owner_id,
                                         verifier_id=template.verifier_id, obligation_ref=rule_id,
                                         period_label=period_label, deadline=deadline,
                                         generated_by="RULE_DERIVED", data=payload)
                        session.add(next_task)
                        for e in payload["evidenceItems"]:
                            session.add(Evidence(id=f"{next_id}:{e['id']}", task_id=next_id, title=e.get("title", ""),
                                                 type=e.get("type", "photo"), status="pending", data=e))
                        # Update schedule pointer
                        sched = (await session.execute(select(RecurringSchedule).where(RecurringSchedule.id == f"{rule_id}:{template.mine_id}"))).scalar_one_or_none()
                        if sched:
                            sched.last_period_label = period_label
                        created.append(payload)
                        self._log(session, "SCHEDULER", "RECURRING_INSTANCE_GENERATED", next_id, f"{rule_id} · {period_label}")
        state = await self.get_state()
        return {"state": state, "created": created}
