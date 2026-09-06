"""Request/response shapes for the SAMAADHAN API.

These mirror the shapes the frontends already parse from the demo API, so the
production backend stays a drop-in replacement (see BACKEND_PLAN.md §5).
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str


class ErrorDetail(BaseModel):
    code: str
    message: str


class HTTPError(BaseModel):
    detail: ErrorDetail


# Generic helpers for routes that still need an arbitrary JSON envelope.
class JSONEnvelope(BaseModel):
    data: Any | None = None
    error: ErrorDetail | None = None
