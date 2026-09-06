"""Embedding providers for the SAMAADHAN advisory layer.

Two providers behind one interface:

- ``LocalEmbedder`` — deterministic, offline, zero-dependency (stdlib + numpy).
  A signed hashed word-token bag-of-words projected into a fixed dimension.
  Quality is lexical (no synonyms), which is exactly what a labelled demo fallback
  needs; it is also what makes parity tests reproducible without any network.
- ``GeminiEmbedder`` — real embedding model (``text-embedding-004``) via the
  Google Generative Language REST API. Used only when a key is configured and
  ``ai_enabled`` is true.

Both return L2-normalised ``list[float]`` vectors of their own fixed dimension.
Vectors are stored per-provider; switching providers requires re-indexing
(``POST /api/rag/ingest?rebuild=true``).
"""
from __future__ import annotations

import hashlib
import logging
import math
import re

import httpx
import numpy as np

from app.config import Settings

logger = logging.getLogger(__name__)

LOCAL_EMBEDDING_DIM = 384

_WORD_RE = re.compile(r"[a-z0-9]+")


def _hash_token(token: str, dim: int) -> tuple[int, int]:
    """Stable signed index for a token (md5 — no per-process hash randomisation)."""
    digest = hashlib.md5(token.encode("utf-8")).digest()
    (bucket,) = struct_unpack(digest[:8])
    idx = bucket % dim
    sign = 1 if (bucket >> 8) % 2 == 0 else -1
    return idx, sign


def struct_unpack(raw: bytes) -> tuple[int]:
    import struct

    return struct.unpack(">Q", raw)


class EmbeddingProvider:
    name: str = "abstract"
    dim: int = 0

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        return [await self.embed(t) for t in texts]


class LocalEmbedder(EmbeddingProvider):
    """Signed hashed word-token embedding, TF-weighted, L2-normalised."""

    name = "local"
    dim = LOCAL_EMBEDDING_DIM

    def _vector(self, text: str) -> np.ndarray:
        vec = np.zeros(self.dim, dtype=np.float32)
        tokens = _WORD_RE.findall(text.lower())
        counts: dict[str, int] = {}
        for token in tokens:
            counts[token] = counts.get(token, 0) + 1
        for token, count in counts.items():
            idx, sign = _hash_token(token, self.dim)
            vec[idx] += sign * math.sqrt(count)
        norm = float(np.linalg.norm(vec))
        if norm > 0:
            vec /= norm
        return vec

    async def embed(self, text: str) -> list[float]:
        # Fast, pure — no need for a thread hop, but keep the signature async.
        return self._vector(text).tolist()

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        rows = np.zeros((len(texts), self.dim), dtype=np.float32)
        for i, text in enumerate(texts):
            rows[i] = self._vector(text)
        norms = np.linalg.norm(rows, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        rows /= norms
        return rows.tolist()


class GeminiEmbedder(EmbeddingProvider):
    """text-embedding-004 via https://generativelanguage.googleapis.com/v1beta."""

    name = "gemini"

    def __init__(self, api_key: str, model: str = "text-embedding-004", dim: int = 768) -> None:
        self._api_key = api_key
        self._model = model
        self.dim = dim
        self._url = (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/{model}:embedContent"
        )

    async def embed(self, text: str) -> list[float]:
        payload = {"content": {"parts": [{"text": text[:30_000]}]}}
        headers = {"x-goog-api-key": self._api_key}
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self._url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        values = data["embedding"]["values"]
        return _normalise([float(v) for v in values])

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        # The REST API batches per call; keep it simple and sequential — the corpus
        # is small and this path only runs when a key is configured.
        return [await self.embed(t) for t in texts]


def _normalise(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


def build_embedder(settings: Settings) -> EmbeddingProvider:
    """auto -> Gemini when configured & enabled, else local."""
    backend = (settings.rag_embedding_backend or "auto").lower()
    if backend == "local":
        return LocalEmbedder()
    if backend == "gemini":
        if not settings.gemini_enabled:
            logger.warning("rag: embedding backend=gemini but no GEMINI_API_KEY — falling back to local")
            return LocalEmbedder()
        return GeminiEmbedder(api_key=settings.gemini_api_key, model=settings.gemini_embedding_model)
    # auto
    if settings.gemini_enabled:
        logger.info("rag: embedding backend=auto -> gemini (%s)", settings.gemini_embedding_model)
        return GeminiEmbedder(api_key=settings.gemini_api_key, model=settings.gemini_embedding_model)
    return LocalEmbedder()
