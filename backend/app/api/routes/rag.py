"""RAG / advisory-retrieval endpoints for the SAMAADHAN backend.

All responses are advisory: nothing here creates, modifies or closes a compliance
obligation. See app/services/rag/README.md for the design and honesty rules.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, Request

from app.schemas.rag import AskRequest, IngestRequest, MemoryRequest
from app.services.rag.service import RagService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rag", tags=["rag"])


def get_rag(request: Request) -> RagService:
    return request.app.state.rag


RagDep = Depends(get_rag)


async def _ready(rag: RagService) -> None:
    await rag.ensure_ready()


@router.get("/status")
async def rag_status(rag: RagService = RagDep) -> dict:
    await _ready(rag)
    return await rag.status()


@router.get("/documents")
async def rag_documents(rag: RagService = RagDep) -> dict:
    await _ready(rag)
    docs = await rag.list_documents()
    return {"total": len(docs), "documents": docs}


@router.post("/ingest")
async def rag_ingest(payload: IngestRequest, rag: RagService = RagDep) -> dict:
    await _ready(rag)
    if payload.doc_ids:
        from app.services.rag.corpus import DOC_BY_ID

        result = {"mode": "subset", "indexed": [], "skipped": [], "counts": {}}
        for doc_id in payload.doc_ids:
            doc = DOC_BY_ID.get(doc_id)
            if doc is None:
                result["skipped"].append({"doc_id": doc_id, "status": "unknown_doc_id"})
                continue
            entry = await rag.ingest_document(doc)
            (result["indexed"] if entry["status"] == "indexed" else result["skipped"]).append(entry)
        result["counts"] = await rag.store.counts()
        return result
    return await rag.ingest_corpus(rebuild=payload.rebuild)


@router.get("/search")
async def rag_search(
    q: str = Query(min_length=1),
    top_k: int = Query(default=8, ge=1, le=20),
    mine_id: str | None = None,
    domain: str | None = None,
    concepts: str | None = None,
    rag: RagService = RagDep,
) -> dict:
    await _ready(rag)
    concept_list = [c.strip() for c in concepts.split(",") if c.strip()] if concepts else None
    return await rag.search(query=q, top_k=top_k, mine_id=mine_id, domain=domain, concepts=concept_list)


@router.post("/ask")
async def rag_ask(payload: AskRequest, rag: RagService = RagDep) -> dict:
    await _ready(rag)
    return await rag.ask(
        query=payload.query,
        top_k=payload.top_k,
        mine_id=payload.mine_id,
        domain=payload.domain,
    )


@router.post("/memory")
async def rag_memory(payload: MemoryRequest, rag: RagService = RagDep) -> dict:
    await _ready(rag)
    return await rag.memory_lookup(
        pattern=payload.pattern,
        codes=payload.codes,
        mine_id=payload.mine_id,
        top_k=payload.top_k,
    )


rag_router_builder = router
