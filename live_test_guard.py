"""Fail-closed environment gate for legacy standalone live-test scripts."""

import os
from pathlib import Path
from urllib.parse import urlparse


RETIRED_PREVIEW_HOST_SUFFIX = ".preview.emergentagent.com"
REPOSITORY_ROOT = Path(__file__).resolve().parent


def backend_source_path(filename: str) -> Path:
    """Resolve a backend source file independently of the caller's cwd."""
    return REPOSITORY_ROOT / "backend" / filename


def require_live_script_environment(*, require_jwt_secret: bool = False) -> str:
    """Return the explicit backend URL or terminate before any network call."""
    if os.environ.get("RUN_LIVE_INTEGRATION_TESTS") != "1":
        raise SystemExit(
            "live script disabled: set RUN_LIVE_INTEGRATION_TESTS=1, "
            "REACT_APP_BACKEND_URL, and TEST_PASSWORD explicitly"
        )

    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    parsed = urlparse(backend_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise SystemExit(
            "live script requires an explicit http(s) REACT_APP_BACKEND_URL"
        )
    if parsed.hostname.lower().endswith(RETIRED_PREVIEW_HOST_SUFFIX):
        raise SystemExit(
            "live script refuses the retired Emergent preview backend URL"
        )
    if not os.environ.get("TEST_PASSWORD", ""):
        raise SystemExit("live script requires TEST_PASSWORD")
    if require_jwt_secret and not os.environ.get("TEST_JWT_SECRET", ""):
        raise SystemExit("live script requires TEST_JWT_SECRET")

    return backend_url.rstrip("/")
