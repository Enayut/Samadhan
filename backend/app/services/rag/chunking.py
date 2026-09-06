"""Deterministic chunking of corpus text.

Strategy (kept deliberately simple and reproducible):
- split on blank lines into paragraphs,
- drop boilerplate fragments (headers/footers, page numbers, very short lines),
- merge paragraphs until the chunk size cap, hard-splitting oversized
  paragraphs on sentence boundaries.
"""
from __future__ import annotations

import re

MIN_PARAGRAPH_CHARS = 40
MAX_CHUNK_CHARS = 10_000  # guard; chunk_size drives the real cap


def _is_boilerplate(paragraph: str) -> bool:
    stripped = paragraph.strip()
    if not stripped:
        return True
    if len(stripped) < MIN_PARAGRAPH_CHARS:
        return True
    # Running headers/footers seen in extracted gazette/annual-report text.
    headerish = {
        "ANNUAL REPORT & ACCOUNTS 2024-25",
        "CORPORATE STATUTORY FINANCIAL OVERVIEW REPORTS STATEMENTS",
        "STATEMENTS",
        "CONTENTS",
    }
    if stripped in headerish:
        return True
    if re.fullmatch(r"[\s\S]{0,8}\d{1,4}\s*", stripped):  # bare page numbers
        return True
    return False


def split_paragraphs(text: str) -> list[str]:
    raw = re.split(r"\n\s*\n", text)
    paragraphs: list[str] = []
    for para in raw:
        flat = re.sub(r"[ \t]+", " ", para).strip()
        if not _is_boilerplate(flat):
            paragraphs.append(flat)
    return paragraphs


def _hard_split(paragraph: str, chunk_size: int) -> list[str]:
    """Split one oversized paragraph on sentence boundaries."""
    if len(paragraph) <= chunk_size:
        return [paragraph]
    sentences = re.split(r"(?<=[.!?])\s+", paragraph)
    parts: list[str] = []
    buf = ""
    for sent in sentences:
        if len(buf) + len(sent) + 1 > chunk_size and buf:
            parts.append(buf.strip())
            buf = sent
        else:
            buf = f"{buf} {sent}".strip()
    if buf:
        parts.append(buf.strip())
    # Rarely: a single sentence larger than the cap — cut it blind.
    out: list[str] = []
    for part in parts:
        while len(part) > MAX_CHUNK_CHARS:
            out.append(part[:chunk_size])
            part = part[chunk_size:]
        out.append(part)
    return out


def chunk_text(text: str, chunk_size: int = 1400) -> list[str]:
    """Return deterministic text chunks (documents without text yield [])."""
    paragraphs = split_paragraphs(text)
    chunks: list[str] = []
    buf = ""
    for para in paragraphs:
        for piece in _hard_split(para, chunk_size):
            candidate = f"{buf} {piece}".strip() if buf else piece
            if len(candidate) > chunk_size and buf:
                chunks.append(buf.strip())
                buf = piece
            else:
                buf = candidate
    if buf.strip():
        chunks.append(buf.strip())
    return chunks
