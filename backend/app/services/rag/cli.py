"""CLI for building and probing the RAG index without starting the server.

Examples:
    python -m app.services.rag.cli --rebuild
    python -m app.services.rag.cli --doc circ-02-2020-slopes
    python -m app.services.rag.cli --query "weekly slope monitoring highwall extensometer"
    python -m app.services.rag.cli --memory "weekly slope displacement monitoring" --codes SLOPE,WEEKLY,HIGHWALL
"""
from __future__ import annotations

import argparse
import asyncio
import os

from app.config import Settings
from app.database import Database
from app.services.rag.service import RagService


async def _main(args: argparse.Namespace) -> None:
    settings = Settings()
    if args.database_url:
        settings.database_url = args.database_url
    db = Database(settings)
    try:
        rag = RagService(db, settings)
        await rag.ensure_ready()

        if args.doc or args.rebuild or args.index:
            if args.doc:
                from app.services.rag.corpus import DOC_BY_ID

                doc = DOC_BY_ID.get(args.doc)
                if doc is None:
                    print(f"unknown doc_id {args.doc!r}; known ids:")
                    print("  " + ", ".join(sorted(DOC_BY_ID)))
                    return
                entry = await rag.ingest_document(doc)
                print(entry)
            else:
                result = await rag.ingest_corpus(rebuild=bool(args.rebuild))
                print("indexed:", [r["doc_id"] for r in result["indexed"]])
                print("skipped:", [(r["doc_id"], r.get("detail", "")) for r in result["skipped"]])
                print("counts:", result["counts"])

        print("\nSTATUS:", await rag.status())

        if args.query:
            search = await rag.search(args.query, top_k=int(args.top_k))
            print(f"\nSEARCH q={args.query!r}")
            for r in search["results"]:
                print(f"  {r['score']:.3f}  {r['doc_id']} — {r['title'][:70]}")
                print(f"       {r['snippet'][:160]}")

        if args.memory:
            codes = [c.strip() for c in args.codes.split(",") if c.strip()] if args.codes else None
            mem = await rag.memory_lookup(pattern=args.memory, codes=codes, mine_id=args.mine_id)
            print(f"\nMEMORY pattern={args.memory!r}")
            print("  advisory:", mem["advisory"])
            for m in mem["matches"]:
                print(
                    f"  {m['score']:.3f}  {m['mine_name']} {m['label']} "
                    f"outcome={m['outcome']} delay={m.get('delay_days')}"
                )

        if args.ask:
            answer = await rag.ask(args.ask, top_k=int(args.top_k))
            print(f"\nASK {args.ask!r}  mode={answer['mode']}")
            print(answer["answer"])
            print("\ncitations:", len(answer["citations"]))
    finally:
        await db.dispose()


def _parse() -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="samaadhan-rag")
    parser.add_argument("--database-url", default=None,
                        help="Override DATABASE_URL (e.g. sqlite+aiosqlite:////tmp/rag.db)")
    parser.add_argument("--index", action="store_true", help="(Re)index the full corpus")
    parser.add_argument("--rebuild", action="store_true", help="Wipe and rebuild the index")
    parser.add_argument("--doc", default=None, help="(Re)index a single corpus doc_id")
    parser.add_argument("--query", default=None, help="Run a retrieval query")
    parser.add_argument("--memory", default=None, help="Run an organizational-memory lookup")
    parser.add_argument("--ask", default=None, help="Run a grounded Q&A")
    parser.add_argument("--codes", default="", help="Comma-separated pattern codes (with --memory)")
    parser.add_argument("--mine-id", default=None, help="Optional mine filter")
    parser.add_argument("--top-k", default="8")
    args = parser.parse_args()
    os.environ.setdefault("RAG_AUTO_INDEX_ON_START", "false")
    return args


if __name__ == "__main__":
    asyncio.run(_main(_parse()))
