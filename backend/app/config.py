"""Runtime configuration for the SAMAADHAN backend."""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
        case_sensitive=False,
    )

    # App
    app_name: str = "SAMAADHAN"
    environment: str = "development"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database (async PostgreSQL via asyncpg). DEV only switches to SQLite
    # for smoke testing when a real DB isn't available — the abstraction in
    # database.py keeps business logic DB-agnostic while still targeting PG.
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/samaadhan"
    database_url_for_tests: str = "sqlite+aiosqlite:///:memory:"

    # Auth
    secret_key: str = "change-me-in-production"
    jwt_access_minutes: int = 15
    jwt_refresh_days: int = 7

    # CORS — wide open in dev so the existing Vite desktop + mobile app can
    # keep calling the backend without a separate proxy during the demo era.
    cors_allowed_origins: list[str] = ["*"]

    # Feature flags
    demo_mode: bool = False
    ocr_enabled: bool = True
    ai_enabled: bool = True
    pgvector_available: bool = True

    # AI / RAG (see app/services/rag/README.md)
    # Gemini is used only when a key is present AND ai_enabled is true; otherwise
    # every AI surface degrades to the deterministic local path (the demo's
    # "simulated but labelled" guarantee carries into the backend).
    gemini_api_key: str = ""
    gemini_embedding_model: str = "text-embedding-004"
    gemini_generation_model: str = "gemini-2.0-flash"
    rag_embedding_backend: str = "auto"  # auto | local | gemini
    rag_vector_backend: str = "embedded"  # embedded | pgvector
    rag_data_dir: str = ""  # empty -> <repo>/data (RAG_CORPUS.md + bundled PDFs)
    rag_auto_index_on_start: bool = False
    rag_chunk_size: int = 1400
    rag_chunk_overlap: int = 120

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @property
    def resolved_rag_data_dir(self) -> Path:
        """Repo-root `data/` by default; used by the corpus indexer."""
        if self.rag_data_dir:
            return Path(self.rag_data_dir)
        return Path(__file__).resolve().parents[2] / "data"

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.gemini_api_key) and self.ai_enabled


def get_settings() -> Settings:
    return Settings()
