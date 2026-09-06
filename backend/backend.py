"""CLI entrypoint for running the SAMAADHAN backend with uvicorn."""
from __future__ import annotations

import argparse

from app.config import Settings
import logging

from app.logging import configure_logging

configure_logging(logging.INFO)

parser = argparse.ArgumentParser(prog="samaadhan-backend")
parser.add_argument("--host", default=None)
parser.add_argument("--port", type=int, default=None)
parser.add_argument("--reload", action="store_true")
args = parser.parse_args()

settings = Settings()

if args.host:
    settings.host = args.host
if args.port:
    settings.port = args.port

import uvicorn

uvicorn.run(
    "app.main:create_app",
    host=settings.host,
    port=settings.port,
    reload=args.reload,
    factory=True,
    log_level="info",
)
