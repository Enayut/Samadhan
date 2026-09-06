"""Retrieval index for the SAMAADHAN advisory (RAG) layer.

Two storage backends behind one interface:

- ``embedded`` (default) — vectors live in the portable JSON columns of the ORM
  tables; cosine search runs in-process with numpy. Works on any SQLAlchemy
  database (SQLite dev/tests, PostgreSQL production) with zero extensions.
- ``pgvector`` (opt-in, ``RAG_VECTOR_BACKEND=pgvector``) — mirrored into
  ``vector(n)`` side-tables with an HNSW index and searched with the native
  ``<=>`` operator. If pgvector cannot be initialised (extension missing, no
  privileges), the store automatically degrades to ``embedded`` and logs it.

Embeddings are L2-normalised by the providers, so cosine similarity == dot product.
"""
from __future__ import annotations

import logging
import re

import numpy as np
from sqlalchemy import delete, select, text

from app.database import Database
from app.services.rag.embeddings import EmbeddingProvider
from app.services.rag.models import RAG_MODEL_TABLES, RagChunk, RagDocument, RagMemory

logger = logging.getLogger(__name__)


class RagVectorStore:
    def __init__(self, db: Database, embedder: EmbeddingProvider, vector_backend: str = "embedded") -> None:
        self._db = db
        self._embedder = embedder
        self._requested_backend = (vector_backend or "embedded").lower()
        self.backend: str = "embedded"  # resolved after ensure_schema()
        self._pgvector_ready = False

    # ---- schema -------------------------------------------------------------

    async def ensure_schema(self) -> None:
        async with self._db.engine.begin() as conn:
            from app.database import Base  # local import avoids circulars at module load

            tables = [RagDocument.__table__, RagChunk.__table__, RagMemory.__table__]
            await conn.run_sync(Base.metadata.create_all, tables=tables)

        if self._requested_backend != "pgvector":
            self.backend = "embedded"
            return

        try:
            await self._init_pgvector()
            self.backend = "pgvector"
            logger.info("rag store: pgvector backend initialised")
        except Exception as exc:  # noqa: BLE001
            logger.warning("rag store: pgvector unavailable (%s) — using embedded backend", exc)
            self.backend = "embedded"

    async def _init_pgvector(self) -> None:
        dim = self._embedder.dim
        async with self._db.engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS rag_vectors ("
                    " chunk_key TEXT PRIMARY KEY,"
                    " doc_id TEXT NOT NULL,"
                    " embedding vector(:dim))"
                ).bindparams(dim=dim)
            )
            await conn.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS rag_memory_vectors ("
                    " memory_key TEXT PRIMARY KEY,"
                    " embedding vector(:dim))"
                ).bindparams(dim=dim)
            )
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS rag_vectors_hnsw ON rag_vectors "
                    "USING hnsw (embedding vector_cosine_ops)"
                )
            )
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS rag_memory_vectors_hnsw ON rag_memory_vectors "
                    "USING hnsw (embedding vector_cosine_ops)"
                )
            )
        self._pgvector_ready = True

    # ---- documents ----------------------------------------------------------

    async def reset(self) -> None:
        """Wipe every rag row (used by ingest rebuild and /api/rag/ingest?rebuild)."""
        async with self._db.engine.begin() as conn:
            await conn.execute(delete(RagMemory))
            await conn.execute(delete(RagChunk))
            await conn.execute(delete(RagDocument))
            if self._pgvector_ready:
                await conn.execute(text("DELETE FROM rag_vectors"))
                await conn.execute(text("DELETE FROM rag_memory_vectors"))

    async def upsert_document(self, doc: dict) -> None:
        async for session in self._db.session():
            existing = await session.get(RagDocument, doc["doc_id"])
            if existing:
                for key, value in doc.items():
                    setattr(existing, key, value)
            else:
                session.add(RagDocument(**doc))
            await session.commit()

    async def delete_chunks(self, doc_id: str) -> None:
        async for session in self._db.session():
            await session.execute(delete(RagChunk).where(RagChunk.doc_id == doc_id))
            await session.commit()
        if self._pgvector_ready:
            async with self._db.engine.begin() as conn:
                await conn.execute(text("DELETE FROM rag_vectors WHERE doc_id = :d"), {"d": doc_id})

    async def add_chunk(self, chunk_key: str, doc_id: str, seq: int, content: str, meta: dict, embedding: list[float]) -> None:
        async for session in self._db.session():
            session.add(
                RagChunk(
                    chunk_key=chunk_key,
                    doc_id=doc_id,
                    seq=seq,
                    content=content,
                    meta=meta,
                    embedding=embedding,
                    token_count=len(content.split()),
                )
            )
            await session.commit()
        if self._pgvector_ready:
            async with self._db.engine.begin() as conn:
                await conn.execute(
                    text(
                        "INSERT INTO rag_vectors (chunk_key, doc_id, embedding) "
                        "VALUES (:k, :d, CAST(:v AS vector)) "
                        "ON CONFLICT (chunk_key) DO UPDATE SET embedding = EXCLUDED.embedding"
                    ),
                    {"k": chunk_key, "d": doc_id, "v": _pg_vector_literal(embedding)},
                )

    # ---- memory -------------------------------------------------------------

    async def upsert_memory(self, row: dict) -> None:
        async for session in self._db.session():
            existing = await session.get(RagMemory, row["memory_key"])
            if existing:
                for key, value in row.items():
                    setattr(existing, key, value)
            else:
                session.add(RagMemory(**row))
            await session.commit()
        if self._pgvector_ready:
            embedding = row.get("embedding")
            if embedding:
                async with self._db.engine.begin() as conn:
                    await conn.execute(
                        text(
                            "INSERT INTO rag_memory_vectors (memory_key, embedding) "
                            "VALUES (:k, CAST(:v AS vector)) "
                            "ON CONFLICT (memory_key) DO UPDATE SET embedding = EXCLUDED.embedding"
                        ),
                        {"k": row["memory_key"], "v": _pg_vector_literal(embedding)},
                    )

    # ---- search -------------------------------------------------------------

    async def search_chunks(
        self,
        query_vector: list[float],
        top_k: int,
        doc_ids: set[str] | None = None,
        query_text: str = "",
    ) -> list[dict]:
        """Return top-k chunks: [{chunk_key, doc_id, content, score, meta}].

        ``query_text`` feeds a lexical-overlap re-rank that boosts chunks sharing
        the query's meaningful tokens (the corpus is dominated by large company /
        annual-report texts whose generic vocabulary would otherwise outrank short
        regulatory hits).
        """
        if self._pgvector_ready:
            return await self._search_chunks_pg(query_vector, top_k, doc_ids)
        return await self._search_chunks_py(query_vector, top_k, doc_ids, query_text)

    async def search_memory(self, query_vector: list[float], top_k: int, mine_id: str | None = None) -> list[dict]:
        if self._pgvector_ready:
            return await self._search_memory_pg(query_vector, top_k, mine_id)
        return await self._search_memory_py(query_vector, top_k, mine_id)

    # embedded (numpy) --------------------------------------------------------

    async def _search_chunks_py(
        self, query_vector: list[float], top_k: int, doc_ids: set[str] | None, query_text: str
    ) -> list[dict]:
        q = np.asarray(query_vector, dtype=np.float32)
        query_tokens = _meaningful_tokens(query_text) or None
        rows: list[dict] = []
        async for session in self._db.session():
            stmt = select(
                RagChunk.chunk_key, RagChunk.doc_id, RagChunk.content, RagChunk.meta, RagChunk.embedding
            ).where(RagChunk.embedding.is_not(None))
            if doc_ids is not None:
                stmt = stmt.where(RagChunk.doc_id.in_(doc_ids))
            result = await session.execute(stmt)
            for chunk_key, doc_id, content, meta, embedding in result.all():
                vec = np.asarray(embedding, dtype=np.float32)
                cosine = float(q @ vec)  # both L2-normalised -> cosine
                rows.append(
                    {"chunk_key": chunk_key, "doc_id": doc_id, "content": content,
                     "meta": meta or {}, "cosine": cosine, "score": cosine}
                )
        # Hybrid re-rank: boost chunks sharing the query's meaningful tokens.
        if query_tokens:
            for row in rows:
                chunk_tokens = _meaningful_tokens(row["content"])
                overlap = len(query_tokens & chunk_tokens)
                if overlap:
                    lex = overlap / len(query_tokens)  # precision-style, 0..1
                    row["score"] = row["cosine"] + 0.45 * lex
        rows.sort(key=lambda r: r["score"], reverse=True)
        return rows[:top_k]

    async def _search_memory_py(self, query_vector: list[float], top_k: int, mine_id: str | None) -> list[dict]:
        q = np.asarray(query_vector, dtype=np.float32)
        rows: list[dict] = []
        async for session in self._db.session():
            stmt = select(
                RagMemory.memory_key, RagMemory.mine_id, RagMemory.mine_name, RagMemory.label,
                RagMemory.pattern_codes, RagMemory.description, RagMemory.outcome,
                RagMemory.delay_days, RagMemory.evidence_notes, RagMemory.source_ref,
                RagMemory.embedding,
            ).where(RagMemory.embedding.is_not(None))
            if mine_id:
                stmt = stmt.where(RagMemory.mine_id == mine_id)
            result = await session.execute(stmt)
            for (
                memory_key, mine_id_, mine_name, label, pattern_codes, description,
                outcome, delay_days, evidence_notes, source_ref, embedding,
            ) in result.all():
                vec = np.asarray(embedding, dtype=np.float32)
                score = float(q @ vec)
                rows.append(
                    {
                        "memory_key": memory_key, "mine_id": mine_id_, "mine_name": mine_name,
                        "label": label, "pattern_codes": pattern_codes or [],
                        "description": description, "outcome": outcome, "delay_days": delay_days,
                        "evidence_notes": evidence_notes, "source_ref": source_ref,
                        "score": round(score, 4),
                    }
                )
        rows.sort(key=lambda r: r["score"], reverse=True)
        return rows[:top_k]

    # pgvector ------------------------------------------------------------------

    async def _search_chunks_pg(self, query_vector: list[float], top_k: int, doc_ids: set[str] | None) -> list[dict]:
        literal = _pg_vector_literal(query_vector)
        rows: list[dict] = []
        async for session in self._db.session():
            stmt = text(
                "SELECT chunk_key, doc_id, 1 - (embedding <=> CAST(:v AS vector)) AS score "
                "FROM rag_vectors ORDER BY embedding <=> CAST(:v AS vector) LIMIT :k"
            )
            # HNSW first, filter after — small demo corpus makes this acceptable.
            params: dict = {"v": literal, "k": max(top_k * 8, 50)}
            result = await session.execute(stmt, params)
            candidates = [(r[0], r[1], float(r[2])) for r in result.all()]

            selected = [c for c in candidates if doc_ids is None or c[1] in doc_ids][:top_k]
            if not selected:
                return rows
            keys = [c[0] for c in selected]
            chunk_stmt = select(
                RagChunk.chunk_key, RagChunk.doc_id, RagChunk.content, RagChunk.meta
            ).where(RagChunk.chunk_key.in_(keys))
            meta_map = {
                ck: {"chunk_key": ck, "doc_id": did, "content": content, "meta": meta or {}}
                for ck, did, content, meta in (await session.execute(chunk_stmt)).all()
            }
        for key, _doc, score in selected:
            base = meta_map.get(key)
            if base:
                rows.append({**base, "score": round(score, 4)})
        return rows

    async def _search_memory_pg(self, query_vector: list[float], top_k: int, mine_id: str | None) -> list[dict]:
        literal = _pg_vector_literal(query_vector)
        async for session in self._db.session():
            stmt = text(
                "SELECT memory_key, 1 - (embedding <=> CAST(:v AS vector)) AS score "
                "FROM rag_memory_vectors ORDER BY embedding <=> CAST(:v AS vector) LIMIT :k"
            )
            result = await session.execute(stmt, {"v": literal, "k": max(top_k * 4, 20)})
            candidates = [(r[0], float(r[1])) for r in result.all()]

            mem_stmt = select(
                RagMemory.memory_key, RagMemory.mine_id, RagMemory.mine_name, RagMemory.label,
                RagMemory.pattern_codes, RagMemory.description, RagMemory.outcome,
                RagMemory.delay_days, RagMemory.evidence_notes, RagMemory.source_ref,
            )
            mem_rows = (await session.execute(mem_stmt)).all()
        mem_map = {
            mk: {
                "memory_key": mk, "mine_id": mine_id_, "mine_name": mine_name, "label": label,
                "pattern_codes": pattern_codes or [], "description": description,
                "outcome": outcome, "delay_days": delay_days,
                "evidence_notes": evidence_notes, "source_ref": source_ref,
            }
            for mk, mine_id_, mine_name, label, pattern_codes, description,
            outcome, delay_days, evidence_notes, source_ref in mem_rows
        }
        rows = []
        for key, score in candidates:
            base = mem_map.get(key)
            if base and (mine_id is None or base["mine_id"] == mine_id):
                rows.append({**base, "score": round(score, 4)})
        return rows[:top_k]

    # ---- counts ---------------------------------------------------------------

    async def counts(self) -> dict:
        async for session in self._db.session():
            docs = (await session.execute(select(RagDocument))).scalars().all()
            chunk_count = (
                await session.execute(select(RagChunk.chunk_key).where(RagChunk.embedding.is_not(None)))
            ).all()
            memory_count = len((await session.execute(select(RagMemory.memory_key))).all())
        indexed = sum(1 for d in docs if d.status == "indexed")
        no_text = sum(1 for d in docs if d.status == "no_text")
        return {
            "documents_total": len(docs),
            "documents_indexed": indexed,
            "documents_no_text": no_text,
            "chunks": len(chunk_count),
            "memory_entries": memory_count,
        }


def _pg_vector_literal(vector: list[float]) -> str:
    return "[" + ",".join(repr(float(v)) for v in vector) + "]"


_STOPWORDS = {
    "with", "from", "that", "this", "have", "been", "were", "will", "shall",
    "into", "over", "under", "their", "there", "about", "after", "during",
    "which", "where", "whose", "while", "would", "should", "could", "other",
    "also", "such", "each", "more", "most", "some", "than", "then", "they",
    "these", "those", "through", "against", "between", "within", "without",
    "per", "not", "are", "its", "them", "year", "years", "report", "company",
    "crore", "appendix", "annexure", "statement", "schedule", "notes", "note",
}
_WORD_RE = re.compile(r"[a-z0-9]+[a-z0-9./-]*")


def _meaningful_tokens(text: str) -> set[str]:
    """Lower-cased tokens that carry meaning for lexical re-ranking."""
    tokens = {t for t in _WORD_RE.findall(text.lower()) if len(t) >= 4}
    return {t for t in tokens if t not in _STOPWORDS and not t.isdigit()}
