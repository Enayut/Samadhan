"""Workflow ORM models — the minimum schema for the SAMAADHAN demo.

Design notes:
- The canonical task/evidence/document payloads are stored as JSONB (`data`)
  so the API returns the exact same shapes the desktop/mobile frontends and
  the deterministic demo store use. Queryable columns (status, mine, owner,
  deadline, obligation ref) are extracted for filtering and joins.
- Evidence is a real child table (per-task checklist items) rather than a blob,
  so rejection/verification state is first-class and auditable.
- Verification state lives on the task (verifier ≠ owner, verified_at,
  closure certificate) and in audit_events — a separate table would duplicate
  the state machine without adding information.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Mine(Base):
    __tablename__ = "mines"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(80))
    mine_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("mines.id"), nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class Obligation(Base):
    """Deterministic rule registry entry (authoritative policy, not AI)."""

    __tablename__ = "obligations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(240))
    domain: Mapped[str] = mapped_column(String(24))
    statutory_basis: Mapped[str] = mapped_column(Text, default="")
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(400))
    status: Mapped[str] = mapped_column(String(32), index=True)
    mine_id: Mapped[str] = mapped_column(String(32), ForeignKey("mines.id"), index=True)
    owner_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    verifier_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    obligation_ref: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    period_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    generated_by: Mapped[str] = mapped_column(String(16), default="RULE_DERIVED")
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    # Canonical demo-API payload (evidenceItems excluded — see Evidence).
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    task_id: Mapped[str] = mapped_column(String(64), ForeignKey("tasks.id"), index=True)
    title: Mapped[str] = mapped_column(String(240))
    type: Mapped[str] = mapped_column(String(16), default="photo")
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    optional: Mapped[bool] = mapped_column(Boolean, default=False)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class ComplianceDocument(Base):
    """An incoming compliance document in the ingest pipeline."""

    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    ref: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(16), default="received")
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    actor: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(64))
    entity: Mapped[str] = mapped_column(String(120))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class RecurringSchedule(Base):
    """Recurring-compliance state: one row per cadence rule (+ mine)."""

    __tablename__ = "recurring_schedules"

    id: Mapped[str] = mapped_column(String(96), primary_key=True)  # rule:mine
    rule_id: Mapped[str] = mapped_column(String(64), ForeignKey("obligations.id"))
    mine_id: Mapped[str] = mapped_column(String(32), ForeignKey("mines.id"))
    cadence: Mapped[str] = mapped_column(String(16))  # WEEKLY | MONTHLY
    last_period_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
