"""Async database connection abstraction for the SAMAADHAN backend.

The abstraction keeps business logic decoupled from PostgreSQL at the service
layer. The production target is asyncpg + PostgreSQL; a non-PostgreSQL backend
is accepted only for smoke/health tests where a real DB isn't available.
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from typing import Annotated

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.config import Settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


class Database:
    """Owned database lifecycle: engine, session factory, and disposal."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._engine = create_async_engine(
            self._settings.database_url,
            echo=settings.debug,
            pool_pre_ping=True,
        )
        self._session_factory = async_sessionmaker(
            bind=self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

    @property
    def engine(self):
        return self._engine

    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Yield an async session for dependency injection."""
        async with self._session_factory() as session:
            try:
                yield session
            finally:
                await session.close()

    async def dispose(self) -> None:
        await self._engine.dispose()

    async def is_responsive(self) -> bool:
        """Lightweight connectivity probe — used by health checks."""
        try:
            async with self._session_factory() as session:
                await session.execute(text("SELECT 1"))
                return True
        except Exception:
            logger.debug("database health probe failed", exc_info=True)
            return False


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in backend_db.session():
        yield session


def db_session_dependency() -> Annotated[AsyncSession, "db-session"]:
    return Annotated[AsyncSession, "db-session"]


# Module-level singleton wired during app startup (see main.py).
backend_db = Database


def init_database(settings: Settings) -> Database:
    global backend_db
    backend_db = Database(settings)
    return backend_db


# Lightweight table for smoke tests that don't have a real DB.
class HealthCheckTable(Base):
    __tablename__ = "health_check_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    ok: Mapped[bool] = mapped_column(default=True)
