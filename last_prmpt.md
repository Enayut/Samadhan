he entire RAG (advisory retrieval) layer is now coded in the backend, verified end-to-end against the real corpus. Summary:

New code —  backend/app/services/rag/ 
-  corpus.py  — the 18-document corpus as structured metadata (mirror of  data/rag/RAG_CORPUS.md : source class, origin URL, bundled path, domain, mine relevance, concepts)
-  text_extraction.py  — PDF → text via  pdftotext , with automatic OCR fallback ( pdftoppm  +  tesseract ) for scanned PDFs; caches to  data/rag/text/<doc_id>.txt 
-  chunking.py  — deterministic paragraph chunking with boilerplate (running headers/page numbers) filtering
-  embeddings.py  — two providers behind one interface:  LocalEmbedder  (deterministic, offline, hashed TF vectors, dim 384) and  GeminiEmbedder  ( text-embedding-004 , REST);  auto  picks Gemini only when a key exists
-  models.py  — ORM tables  rag_documents ,  rag_chunks ,  rag_memory  (portable JSON vectors)
-  store.py  — retrieval index: embedded numpy cosine default (works on SQLite or Postgres, zero extensions) with a lexical-overlap hybrid re-rank; optional pgvector side-tables with HNSW ( RAG_VECTOR_BACKEND=pgvector ), auto-degrading if unavailable
-  service.py  — ingest/search/memory/ask, deterministic memory advisory builder, Gemini grounded answers with extractive fallback; every response carries a disclaimer + its exact  mode 
-  cli.py  —  python -m app.services.rag.cli --rebuild | --query | --memory | --ask  (no server needed)

Wiring —  config.py  settings (+ GEMINI_API_KEY ,  RAG_* ),  main.py  mounts one  RagService  on  app.state  with lifespan init,  app/api/routes/rag.py  exposes  GET /api/rag/status ,  GET /api/rag/documents ,  POST /api/rag/ingest ,  GET /api/rag/search ,  POST /api/rag/ask ,  POST /api/rag/memory . Also  requirements.txt ,  .env.example ,  backend/app/services/rag/README.md .

Verified
-  pytest : 4/4 passing, fully offline (SQLite + local embedder)
- Real-corpus run: 18 docs registered → 10 indexed (1,844 chunks) incl. the scanned hero Circular 02/2020 (now OCR'd), 8 URL-only registered awaiting text drops; 5 memory entries seeded
- Demo story reproduced: the memory lookup returns "Ashoka OCP closed D+12, Magadh OCP closed D+9" with the advisory line; retrieval ranks the hero circular #1 for slope-monitoring queries;  /ask  returns cited extractive answers

Honesty preserved — advisory-only, deterministic-fallback-first, source classes and origins carried on every hit, OCR-derived text cached beside the real PDFs, generated text cache (~3.5 MB) documented in  data/README.md  and the corpus build note.