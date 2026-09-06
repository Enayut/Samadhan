"""Health endpoint — app + database responsiveness."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import db_session_dependency, init_database
from app.types import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


def build_health_router(db: init_database) -> APIRouter:
    """Factory so the router can access the live DB instance for probes."""

    @router.get("/health", response_model=HealthResponse)
    async def health(db_session: Annotated[AsyncSession, Depends(db_session_dependency)]) -> HealthResponse:
        db_responsive = await db.is_responsive()
        return HealthResponse(
            status="ok" if db_responsive else "degraded",
            database="ok" if db_responsive else "unavailable",
        )

    return router


# Exported for wiring in main.py; the actual router is built after DB init.
health_router_builder = build_health_router
