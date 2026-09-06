"""Workflow API routes — mirrors the demo API (client/server.ts) 1:1.

Both frontends hit these paths via the demo-server proxy when the FastAPI
backend is running; the in-memory demo store remains the fallback.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Request

from app.services.workflow.store import WorkflowStore, HERO_REJECTION_REASON

logger = logging.getLogger(__name__)


def get_workflow_store(request: Request) -> WorkflowStore:
    return request.app.state.workflow


workflow_router = APIRouter(prefix="/api", tags=["workflow"])


@workflow_router.get("/state")
async def get_state(store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.get_state()


@workflow_router.get("/mobile/state")
async def get_mobile_state(store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.get_mobile_state()


@workflow_router.post("/reset")
async def reset(store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.reset()


@workflow_router.post("/documents/{document_id}/process")
async def process_document(document_id: str, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.process_document(document_id)


@workflow_router.post("/documents/{document_id}/determine")
async def determine_document(document_id: str, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.determine_applicability(document_id)


@workflow_router.post("/tasks/{task_id}/publish")
async def publish_task(task_id: str, request: Request, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001 — empty body is fine
        body = {}
    return await store.publish_task(task_id, body or {})


@workflow_router.post("/tasks")
async def create_task(request: Request, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001
        body = {}
    return await store.create_task(body or {})


@workflow_router.post("/tasks/{task_id}/start")
async def start_task(task_id: str, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.start_task(task_id)


@workflow_router.post("/tasks/{task_id}/draft")
async def save_draft(task_id: str, request: Request, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    body = await request.json()
    return await store.save_draft(
        task_id, body.get("evidenceItems", []), body.get("remediationNotes", ""), body.get("formValues"),
    )


@workflow_router.post("/tasks/{task_id}/submit")
async def submit_task(task_id: str, request: Request, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    body = await request.json()
    return await store.submit_task(
        task_id, body.get("evidenceItems", []), body.get("remediationNotes", ""), body.get("formValues"),
    )


@workflow_router.post("/tasks/{task_id}/reject")
async def reject_evidence(task_id: str, request: Request, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    body = await request.json()
    return await store.reject_evidence(task_id, body.get("evidenceId"), body.get("reason") or HERO_REJECTION_REASON)


@workflow_router.post("/tasks/{task_id}/resubmit")
async def resubmit_task(task_id: str, request: Request, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    body = await request.json()
    return await store.resubmit_task(
        task_id, body.get("evidenceItems"), body.get("remediationNotes", ""), body.get("formValues"),
    )


@workflow_router.post("/tasks/{task_id}/approve")
async def approve_task(task_id: str, store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.approve_task(task_id)


@workflow_router.post("/scheduler/tick")
async def scheduler_tick(store: WorkflowStore = Depends(get_workflow_store)) -> dict:
    return await store.scheduler_tick()
