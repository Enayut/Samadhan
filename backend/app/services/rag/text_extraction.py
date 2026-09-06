"""Text extraction for corpus documents.

Bundled PDFs are extracted with the poppler ``pdftotext`` CLI (already used at build
time to produce ``data/rag/text/*.txt`` caches). Scanned (image-only) PDFs fall back
to **OCR** via poppler ``pdftoppm`` + ``tesseract`` so e.g. the hero DGMS circular
(a 2-page scan) is indexable too. Extracted text is cached under
``data/rag/text/<doc_id>.txt`` so re-indexing does not re-run extraction or OCR.

URL-only documents have no PDF; they are indexed only when a human has dropped a
plain-text copy at ``data/rag/text/<doc_id>.txt`` (per ``data/rag/RAG_CORPUS.md``).
"""
from __future__ import annotations

import asyncio
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path

from app.services.rag.corpus import CorpusDocument, text_cache_dir

logger = logging.getLogger(__name__)


def cache_path_for(data_dir: Path, doc_id: str) -> Path:
    return text_cache_dir(data_dir) / f"{doc_id}.txt"


def _binary(name: str) -> bool:
    return shutil.which(name) is not None


def _run(cmd: list[str], *, timeout: int = 120) -> str:
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError(f"{cmd[0]} failed: {proc.stderr[:300]}")
    return proc.stdout or ""


def _extract_text_layer(pdf_path: Path) -> str:
    return _run(["pdftotext", "-layout", str(pdf_path), "-"])


def _ocr_pdf(pdf_path: Path) -> str:
    """OCR every page of an image-only PDF (pdftoppm -> tesseract)."""
    with tempfile.TemporaryDirectory(prefix="samaadhan-rag-ocr-") as tmp:
        prefix = str(Path(tmp) / "page")
        subprocess.run(
            ["pdftoppm", "-png", "-r", "300", str(pdf_path), prefix],
            capture_output=True,
            text=True,
            timeout=240,
            check=True,
        )
        page_files = sorted(Path(tmp).glob("page-*.png"))
        parts = []
        for page_file in page_files:
            text = _run(["tesseract", str(page_file), "stdout", "-l", "eng", "--psm", "3"])
            if text.strip():
                parts.append(text.strip())
        return "\n\n".join(parts)


def _write_cache(text: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")


def _extract_pdf(data_dir: Path, doc: CorpusDocument) -> str:
    """Sync extraction (runs in a thread executor). Returns "" on total failure."""
    pdf_path = (data_dir / doc.bundled_rel).resolve()
    if not pdf_path.exists():
        logger.warning("rag corpus %s: bundled file missing at %s", doc.doc_id, pdf_path)
        return ""

    if _binary("pdftotext"):
        text = _extract_text_layer(pdf_path)
        if text.strip():
            return text
        logger.info("rag corpus %s: no text layer (scanned PDF) — trying OCR", doc.doc_id)
    elif _binary("pdftoppm") and _binary("tesseract"):
        logger.info("rag corpus %s: pdftotext missing — trying OCR directly", doc.doc_id)
    else:
        logger.warning(
            "rag corpus %s: neither pdftotext nor (pdftoppm+tesseract) available", doc.doc_id
        )
        return ""

    if _binary("pdftoppm") and _binary("tesseract"):
        try:
            return _ocr_pdf(pdf_path)
        except Exception as exc:  # noqa: BLE001 — OCR must never break indexing
            logger.warning("rag corpus %s: OCR failed: %s", doc.doc_id, exc)
            return ""
    return ""


async def extract_document_text(data_dir: Path, doc: CorpusDocument) -> str:
    """Return the plain text for a corpus document ("" when unavailable).

    Resolution order: cached text file -> bundled PDF (pdftotext, then OCR) -> "".
    Extraction results are written to the text cache.
    """
    cache = cache_path_for(data_dir, doc.doc_id)
    if cache.exists():
        text = cache.read_text(encoding="utf-8")
        if text.strip():
            return text

    if not doc.bundled:
        logger.info(
            "rag corpus %s: URL-only document, no local text "
            "(doc registered, not indexed)", doc.doc_id
        )
        return ""

    try:
        text = await asyncio.to_thread(_extract_pdf, data_dir, doc)
    except Exception as exc:  # noqa: BLE001
        logger.warning("rag corpus %s: extraction failed: %s", doc.doc_id, exc)
        return ""

    if not text.strip():
        logger.warning("rag corpus %s: extraction produced no text (scanned PDF?)", doc.doc_id)
        return ""

    await asyncio.to_thread(_write_cache, text, cache)
    logger.info("rag corpus %s: extracted %d chars (cached)", doc.doc_id, len(text))
    return text
