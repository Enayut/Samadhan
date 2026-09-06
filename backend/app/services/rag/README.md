# SAMAADHAN advisory retrieval (RAG) layer

> **What this is:** the "organizational memory + grounded context" feature of SAMAADHAN
> (BACKEND_PLAN.md §9.3; DEMO_FLOW.md scenes 4 and 10). It indexes the 18-document corpus
> (`data/rag/RAG_CORPUS.md` + bundled PDFs in `data/regulatory` / `data/mine_documents`),
> retrieves similar passages for any question or incoming instrument, and surfaces
> **organizational memory** — past obligations with the same pattern — as an advisory line.
>
> **What this is not:** it never creates, modifies, rejects, or closes a compliance obligation.
> Rules and human review decide compliance. Every response carries a disclaimer to that effect.

## Layout

```
app/services/rag/
  corpus.py           # the 18-doc corpus definition (mirror of data/rag/RAG_CORPUS.md)
  text_extraction.py  # pdftotext extraction + data/rag/text/<doc_id>.txt cache
  chunking.py         # deterministic paragraph chunking
  embeddings.py       # embedding providers: LocalEmbedder (offline) | GeminiEmbedder
  models.py           # ORM: rag_documents, rag_chunks, rag_memory
  store.py            # retrieval index: embedded (numpy) | pgvector (optional)
  service.py          # RagService: ingest, search, memory/advisory, ask w/ citations
  cli.py              # python -m app.services.rag.cli — build & probe without a server
```

## Behaviour

| Concern | Default | Config |
|---|---|---|
| Embedding | deterministic **local** lexical (no network, no model download) | `RAG_EMBEDDING_BACKEND=auto\|local\|gemini`; auto → Gemini when `GEMINI_API_KEY` is set and `AI_ENABLED=true` |
| Vector store | **embedded** — vectors in portable JSON columns; numpy cosine | `RAG_VECTOR_BACKEND=embedded\|pgvector` (pgvector auto-degrades to embedded if the extension is unavailable) |
| Generation | deterministic **extractive fallback** (no LLM) | when Gemini is enabled, `/api/rag/ask` calls `GEMINI_GENERATION_MODEL` and falls back on any failure |
| Corpus root | `<repo>/data` | `RAG_DATA_DIR` |

Why an offline default matters: the demo promise is *"deterministic fallback required"* — the
memory panel and any cited answer must render identically with or without a live model/vector DB.
Gemini is a real upgrade when present, never a dependency.

## Corpus coverage

- **Bundled PDFs** (11 docs) are extracted with `pdftotext` at ingest time and cached to
  `data/rag/text/<doc_id>.txt` (re-indexing reuses the cache).
- **URL-only documents** (The Wire, Dataful, PARIVESH, coal.gov.in, PIB, Wikipedia/GEM) are
  *registered* with metadata but produce no chunks until a plain-text copy is placed at
  `data/rag/text/<doc_id>.txt` — see `data/rag/RAG_CORPUS.md` "Build note".
- If `pdftotext` is not installed, extraction is skipped cleanly (documents marked `no_text`);
  the status endpoint reports coverage.

## API

| Method & path | Purpose |
|---|---|
| `GET  /api/rag/status` | backend / store / corpus coverage |
| `GET  /api/rag/documents` | corpus registry rows |
| `POST /api/rag/ingest` | `{rebuild?: bool, doc_ids?: [...]}` — build the index |
| `GET  /api/rag/search?q=&top_k=&mine_id=&domain=&concepts=` | retrieval, with provenance per hit |
| `POST /api/rag/ask` | `{query, top_k?, mine_id?, domain?}` — grounded answer + citations |
| `POST /api/rag/memory` | `{pattern, codes?, mine_id?, top_k?}` — similar past obligations + advisory |

## Quick start

```bash
# Index the full corpus against a scratch DB (no server needed)
cd backend
DATABASE_URL=sqlite+aiosqlite:////tmp/rag_demo.db python -m app.services.rag.cli --rebuild

# Probe
DATABASE_URL=sqlite+aiosqlite:////tmp/rag_demo.db python -m app.services.rag.cli \
  --query "weekly slope monitoring highwall extensometer threshold"
DATABASE_URL=sqlite+aiosqlite:////tmp/rag_demo.db python -m app.services.rag.cli \
  --memory "weekly slope displacement monitoring" --codes SLOPE,WEEKLY,HIGHWALL,EXTENSOMETER
```

Then run the server (`python backend.py` or `uvicorn app.main:create_app --factory`) and call
`POST /api/rag/ingest` once to index, or set `RAG_AUTO_INDEX_ON_START=true`.

## pgvector (optional)

With a PostgreSQL database that has the `vector` extension available:

```bash
export RAG_VECTOR_BACKEND=pgvector
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/samaadhan
```

The store mirrors chunk/memory vectors into `vector(n)` side-tables with an HNSW index and
searches with the native `<=>` operator. If the extension cannot be created (no privileges,
extension missing), the store logs a warning and continues on the embedded backend — schema and
API are identical either way. The vector dimension follows the configured embedder
(384 local · 768 Gemini), so switching embedders requires a rebuild (`--rebuild`).

## Honesty rules

1. Every response includes `disclaimer` and reports its `mode` (`extractive-fallback`,
   `memory`, `generative`) and `embedding_backend` so a judge can see exactly what ran.
2. The memory/advisory line is deterministic rule text over retrieved records — never a claim
   that a real compliance event occurred at a named mine (seed records are labelled
   `org-memory seed`).
3. Corpus source classes (`REAL OFFICIAL` / `REAL PUBLIC`) are carried through every hit with
   the origin URL, so retrieval never launders provenance.
4. Tests (`backend/tests/test_rag.py`) run fully offline against SQLite + the local embedder.
