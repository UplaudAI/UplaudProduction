"""Vercel ASGI catch-all entrypoint for nested Uplaud API routes."""

from backend.server import app


__all__ = ["app"]
