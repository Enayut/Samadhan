"""Offline tests for the SAMAADHAN RAG layer.

Runs fully offline: SQLite file database + deterministic local embedder, so it is
reproducible in CI without Postgres, pgvector, or any model API.
"""
from __future__ import annotations

import asyncio
import tempfile
from pathlib import Path

import httpx
import pytest

from app.config import Settings
from app.database import Database
from app.main import create_app
from app.services.rag.chunking import chunk_text
from app.services.rag.corpus import CorpusDocument, text_cache_dir
from app.services.rag.embeddings import LocalEmbedder
from app.services.rag.service import DEFAULT_MEMORY, RagService


def _run(coro):
    return asyncio.run(coro)


def _settings(tmp: Path, *, vector_backend: str = "embedded") -> Settings:
    return Settings(
        database_url=f"sqlite+aiosqlite:///{tmp / 'rag_test.db'}",
        rag_data_dir=str(tmp / "data"),
        rag_embedding_backend="local",
        rag_vector_backend=vector_backend,
        gemini_api_key="",
        ai_enabled=True,
        debug=False,
    )


def _fake_doc(doc_id: str = "test-circular") -> CorpusDocument:
    return CorpusDocument(
        doc_id=doc_id,
        tier=1,
        title="Test DGMS circular — weekly slope monitoring",
        source_class="REAL OFFICIAL",
        origin="https://example.test/circular.pdf",
        bundled_rel=None,
        why_relevant="Weekly extensometer readings on highwall benches above 30 m.",
        domain="Safety",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003"],
        concepts=["slope monitoring", "extensometer", "highwall"],
    )


DEMO_TEXT = (
    "Systematic monitoring of slopes in opencast mines.\n\n"
    "All opencast mines with highwall benches above 30 metres shall carry out weekly "
    "slope-displacement monitoring using in-situ extensometer or MPBX arrays, periodic prism "
    "surveys, and slope-stability radar where available.\n\n"
    "An alarm shall be raised when recorded displacement reaches 2.5 millimetres per day. The "
    "weekly displacement report shall be submitted to the Regional Inspector of Mines. "
    "Monitoring records shall include bench number, instrument id, reading date, and the "
    "responsible surveyor.\n\n"
    "Dump slopes and spoil banks shall be inspected for tension cracks and berm integrity on "
    "the same weekly cycle."
)


def test_local_embedder_deterministic_and_normalised():
    embedder = LocalEmbedder()

    async def check():
        a = await embedder.embed(DEMO_TEXT)
        b = await embedder.embed(DEMO_TEXT)
        c = await embedder.embed("Annual accounts of the company for the financial year")
        assert a == b  # deterministic
        assert len(a) == LocalEmbedder.dim
        norm = (sum(v * v for v in a)) ** 0.5
        assert abs(norm - 1.0) < 1e-3  # L2 normalised
        # lexical similarity: identical text matches itself better than the accounts text
        score_self = sum(x * y for x, y in zip(a, b, strict=True))
        score_other = sum(x * y for x, y in zip(a, c, strict=True))
        assert score_self > score_other

    _run(check())


def test_chunking_splits_and_keeps_order():
    text = "\n\n".join(f"Paragraph number {i}. " + "words " * 40 for i in range(50))
    chunks = chunk_text(text, chunk_size=400)
    assert len(chunks) > 1
    assert all(len(c) <= 400 + 200 for c in chunks)
    assert chunks[0].startswith("Paragraph number 0.")
    assert chunks[-1].endswith(".") or "words" in chunks[-1]


def test_document_text_cache_takes_precedence(tmp_path):
    # URL-only document indexed from a text cache — no pdftotext needed.
    doc = _fake_doc()
    cache = text_cache_dir(tmp_path / "data") / f"{doc.doc_id}.txt"
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(DEMO_TEXT, encoding="utf-8")
    settings = _settings(tmp_path)
    db = Database(settings)

    async def flow():
        rag = RagService(db, settings)
        await rag.ensure_ready()
        out = await rag.ingest_document(doc)
        assert out["status"] == "indexed"
        assert out["chunks"] >= 1

        search = await rag.search("extensometer threshold 2.5 mm displacement", top_k=3)
        assert search["results"], "expected retrieval hit"
        top = search["results"][0]
        assert top["doc_id"] == "test-circular"
        assert "2.5" in top["snippet"] or "extensometer" in top["snippet"]

        ask = await rag.ask("What is the slope displacement alarm threshold?")
        assert ask["mode"] == "extractive-fallback"
        assert ask["citations"], "fallback answer must carry citations"
        assert "disclaimer" in ask

        mem = await rag.memory_lookup(
            pattern="weekly slope displacement monitoring on a highwall bench",
            codes=["SLOPE", "WEEKLY", "HIGHWALL", "EXTENSOMETER", "DISPLACEMENT"],
        )
        keys = [m["memory_key"] for m in mem["matches"]]
        # Near-identical pattern embeddings tie on score; the slope cluster must rank top.
        assert "MEM-ASHOKA-SLOPE-FY2023" in keys
        assert "MEM-MAGADH-SLOPE-FY2024" in keys
        assert "MEM-PIPARWAR-SLOPE-FY2024" in keys
        assert keys[0].startswith("MEM-")
        assert "closed late" in mem["advisory"].lower()

        status = await rag.status()
        assert status["counts"]["documents_indexed"] == 1
        assert status["counts"]["memory_entries"] == len(DEFAULT_MEMORY)

    try:
        _run(flow())
    finally:
        _run(db.dispose())


def test_rag_api_endpoints(tmp_path):
    settings = _settings(tmp_path)
    doc = _fake_doc()
    cache = text_cache_dir(tmp_path / "data") / f"{doc.doc_id}.txt"
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(DEMO_TEXT, encoding="utf-8")
    app = create_app(settings)

    async def flow():
        rag = app.state.rag
        await rag.ensure_ready()
        await rag.ingest_document(doc)
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            status = await client.get("/api/rag/status")
            assert status.status_code == 200
            body = status.json()
            assert body["vector_backend"] == "embedded"
            assert body["counts"]["documents_indexed"] == 1

            search = await client.get("/api/rag/search", params={"q": "slope monitoring radar", "top_k": 2})
            assert search.status_code == 200
            hits = search.json()["results"]
            assert hits and hits[0]["doc_id"] == "test-circular"

            mem = await client.post(
                "/api/rag/memory",
                json={
                    "pattern": "weekly slope displacement highwall",
                    "codes": ["SLOPE", "WEEKLY", "HIGHWALL"],
                    "top_k": 3,
                },
            )
            assert mem.status_code == 200
            assert mem.json()["matches"][0]["mine_id"] in {"MINE-001", "MINE-002", "MINE-003"}

            ask = await client.post("/api/rag/ask", json={"query": "prism survey frequency?"})
            assert ask.status_code == 200
            assert ask.json()["citations"]

            docs = await client.get("/api/rag/documents")
            assert docs.status_code == 200
            assert docs.json()["total"] == 1

    try:
        _run(flow())
    finally:
        _run(app.state.rag._db.dispose())


if __name__ == "__main__":  # pragma: no cover
    pytest.main([__file__, "-v"])
