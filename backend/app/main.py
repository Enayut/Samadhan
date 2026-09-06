"""FastAPI application factory for the SAMAADHAN backend."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, get_settings
from app.database import init_database

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    if settings.debug:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    db = init_database(settings)

    # Workflow store (mines/tasks/evidence/verification/audit) — the DB-backed
    # source of truth for the five-mine demo. Mirrors shared/demo/store.ts.
    from app.services.workflow.store import WorkflowStore

    workflow = WorkflowStore(db)

    # Advisory retrieval (RAG) service — one shared instance per app, mounted on
    # app.state so routers and the lifespan can use it (see app/services/rag/README.md).
    from app.services.rag.service import RagService

    rag = RagService(db, settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> None:
        logger.info(
            "starting SAMAADHAN backend (environment=%s, db=%s)",
            settings.environment,
            settings.database_url,
        )
        try:
            await rag.ensure_ready()
        except Exception:  # noqa: BLE001 — a down DB must not prevent app boot
            logger.warning("rag: schema init deferred (database unavailable at startup?)", exc_info=True)
        try:
            await workflow.ensure_schema()
            await workflow.seed_if_empty()
        except Exception:  # noqa: BLE001 — demo must still boot without a DB
            logger.warning("workflow: schema/seed deferred (database unavailable at startup?)", exc_info=True)
        yield
        await db.dispose()
        logger.info("stopped SAMAADHAN backend")

    app = FastAPI(
        title=settings.app_name,
        description="SAMAADHAN backend — replaces the demo JSON layer with a real FastAPI API. See BACKEND_PLAN.md.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.state.rag = rag
    app.state.workflow = workflow

    # CORS: wide open in development so the existing Vite desktop + mobile app
    # keeps working without a separate proxy. Tighten before shipping.
    origins = settings.cors_allowed_origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # Routes — health + rag + the five-mine workflow API.
    from app.api.routes.health import health_router_builder
    from app.api.routes.rag import rag_router_builder
    from app.api.routes.workflow import workflow_router

    app.include_router(health_router_builder(db))
    app.include_router(rag_router_builder)
    app.include_router(workflow_router)

    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "name": settings.app_name,
            "environment": settings.environment,
            "api": "/docs",
            "health": "/api/health",
            "state": "/api/state",
            "reset": "POST /api/reset",
            "rag": "/api/rag/status",
        }

    return app


def create_app_with_settings(settings: Settings) -> FastAPI:
    return create_app(settings)
