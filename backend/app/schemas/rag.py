"""Request bodies for the SAMAADHAN advisory (RAG) API."""
from __future__ import annotations

from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    rebuild: bool = False
    """True wipes the current index before ingesting (idempotent full rebuild)."""

    doc_ids: list[str] | None = None
    """Optional subset of corpus doc_ids to (re)index; None indexes the whole corpus."""


class AskRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=6, ge=1, le=20)
    mine_id: str | None = Field(default=None, description="Restrict retrieval to documents relevant to this mine")
    domain: str | None = Field(default=None, description="Restrict retrieval to a domain, e.g. SAFETY")


class MemoryRequest(BaseModel):
    pattern: str = Field(
        min_length=1,
        max_length=1000,
        description="Obligation/task description whose historical pattern to look up",
    )
    codes: list[str] = Field(default_factory=list, description="Deterministic pattern codes, e.g. SLOPE, WEEKLY")
    mine_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=10)
