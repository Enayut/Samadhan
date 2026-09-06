"""End-to-end smoke test for the DB-backed workflow store.

Runs the full demo story against SQLite (aiosqlite): reset → publish → mobile
start → submit → reject → resubmit → approve, plus the scheduler tick. This is
the state-machine parity check between shared/demo/store.ts and the
PostgreSQL-targeted WorkflowStore.

Run: cd backend && python3 tests/test_workflow_smoke.py
"""
from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import Settings  # noqa: E402
from app.database import Database  # noqa: E402
from app.services.workflow.store import WorkflowStore  # noqa: E402


async def main() -> int:
    settings = Settings(database_url="sqlite+aiosqlite:///./_workflow_smoke.db")
    db = Database(settings)
    store = WorkflowStore(db)

    await store.ensure_schema()
    state = await store.reset()
    assert len(state["sites"]) == 5, f"expected 5 mines, got {len(state['sites'])}"
    print(f"reset: {len(state['sites'])} mines, {len(state['tasks'])} tasks, "
          f"{len(state['pipeline']['documents'])} documents, {len(state['rules'])} rules")

    hero = next(t for t in state["tasks"] if t["id"] == "TASK-SLOPE-WK-2026-W36")
    assert hero["status"] == "PROPOSED"

    # 1. publish
    state = await store.publish_task(hero["id"], {"deadlineOffsetDays": 4})
    hero = next(t for t in state["tasks"] if t["id"] == hero["id"])
    assert hero["status"] == "ASSIGNED", hero["status"]
    print("publish → ASSIGNED")

    # 2. mobile scoping: published task visible, PROPOSED never
    mobile = await store.get_mobile_state()
    ids = [t["id"] for t in mobile["tasks"]]
    assert hero["id"] in ids, "published task must appear on mobile"
    assert all(t["status"] != "PROPOSED" for t in mobile["tasks"])
    assert all(t["mineId"] == "MINE-001" for t in mobile["tasks"])
    print(f"mobile state: {len(mobile['tasks'])} scoped tasks")

    # 3. start
    state = await store.start_task(hero["id"])
    hero = next(t for t in state["tasks"] if t["id"] == hero["id"])
    assert hero["status"] == "IN_PROGRESS", hero["status"]
    print("start → IN_PROGRESS")

    # 4. submit with evidence + notes
    evidence = [
        {**e, "status": "uploaded", "metadata": {"timestamp": "now", "gps": "23.69", "sha256": "abc", "user": "Ram Singh"}}
        for e in hero["evidenceItems"] if not e.get("optional")
    ]
    state = await store.submit_task(hero["id"], evidence, "Weekly monitoring completed; readings within limit.")
    hero = next(t for t in state["tasks"] if t["id"] == hero["id"])
    assert hero["status"] == "AWAITING_VERIFICATION", hero["status"]
    print("submit → AWAITING_VERIFICATION")

    # 5. reject one evidence item
    state = await store.reject_evidence(hero["id"], evidence[0]["id"], "Crest photo unclear — recapture with berm markers.")
    hero = next(t for t in state["tasks"] if t["id"] == hero["id"])
    assert hero["status"] == "REJECTED", hero["status"]
    rejected = [e for e in hero["evidenceItems"] if e["status"] == "rejected"]
    assert rejected and rejected[0]["rejectionReason"]
    print("reject → REJECTED with per-item reason")

    # 6. resubmit corrected evidence
    corrected = [
        {**e, "status": "uploaded"} if e["status"] == "rejected" else e
        for e in hero["evidenceItems"]
    ]
    corrected = [
        {**e, "metadata": e.get("metadata") or {"timestamp": "now", "gps": "23.69", "sha256": "def", "user": "Ram Singh"}}
        for e in corrected if not e.get("optional")
    ]
    state = await store.resubmit_task(hero["id"], corrected, "Corrected crest photo with visible berm markers and crack gauge.")
    hero = next(t for t in state["tasks"] if t["id"] == hero["id"])
    assert hero["status"] == "AWAITING_VERIFICATION", hero["status"]
    print("resubmit → AWAITING_VERIFICATION")

    # 7. approve
    state = await store.approve_task(hero["id"])
    hero = next(t for t in state["tasks"] if t["id"] == hero["id"])
    assert hero["status"] == "VERIFIED", hero["status"]
    assert hero.get("closureCertificate"), "closure certificate must be generated"
    assert hero.get("verifiedAt")
    print("approve → VERIFIED (closure record generated)")

    # 8. scheduler: verified weekly instances regenerate next period
    tick = await store.scheduler_tick()
    state = tick["state"]
    assert tick["created"], "scheduler should regenerate the verified weekly rule"
    assert all(t["status"] == "PROPOSED" for t in tick["created"])
    print(f"scheduler tick → {len(tick['created'])} new PROPOSED instance(s), "
          f"{len(state['tasks'])} tasks total")

    # 9. audit trail captured the whole story
    actions = [a["action"] for a in state["audit"]]
    for expected in ("DEMO_RESET", "TASK_PUBLISHED", "TASK_STARTED", "EVIDENCE_SUBMITTED",
                     "EVIDENCE_REJECTED", "EVIDENCE_RESUBMITTED", "CLOSURE_VERIFIED"):
        assert expected in actions, f"missing audit event {expected}"
    print(f"audit trail: {len(actions)} events — full story recorded")

    await db.dispose()
    os.remove("./_workflow_smoke.db")
    print("\nALL WORKFLOW SMOKE CHECKS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
