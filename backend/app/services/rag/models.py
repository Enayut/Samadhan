"""SQLAlchemy ORM models for the SAMAADHAN advisory (RAG) layer.

Tables are portable (vectors stored as JSON lists) so the whole feature runs on
any SQLAlchemy-backed database — SQLite in dev/tests, PostgreSQL in production.
An optional pgvector side-table is managed by ``store.py`` when the operator opts
in via ``RAG_VECTOR_BACKEND=pgvector``.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

RAG_MODEL_TABLES = ["rag_documents", "rag_chunks", "rag_memory"]


class RagDocument(Base):
    __tablename__ = "rag_documents"

    doc_id: Mapped[str] = mapped_column(String(120), primary_key=True)
    tier: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    source_class: Mapped[str] = mapped_column(String(40), nullable=False)  # REAL OFFICIAL | REAL PUBLIC
    origin: Mapped[str] = mapped_column(Text, nullable=False, default="")
    bundled_rel: Mapped[str | None] = mapped_column(Text, nullable=True)
    why_relevant: Mapped[str] = mapped_column(Text, nullable=False, default="")
    domain: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    mine_relevance: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    concepts: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="registered")
    # registered | indexed | no_text (URL-only / extraction failure / missing binary)
    char_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    indexed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RagChunk(Base):
    __tablename__ = "rag_chunks"

    chunk_key: Mapped[str] = mapped_column(String(160), primary_key=True)  # <doc_id>:<seq>
    doc_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    seq: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)  # heading, char_range
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=True)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class RagMemory(Base):
    __tablename__ = "rag_memory"

    memory_key: Mapped[str] = mapped_column(String(120), primary_key=True)
    mine_id: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    mine_name: Mapped[str] = mapped_column(Text, nullable=False, default="")
    label: Mapped[str] = mapped_column(Text, nullable=False)  # e.g. FY2023 weekly slope monitoring
    pattern_codes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    outcome: Mapped[str] = mapped_column(String(40), nullable=False, default="closed_on_time")
    # closed_late | closed_on_time | still_open | rejected_once
    delay_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    evidence_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    source_ref: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
