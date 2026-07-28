"""Fail-closed opt-in gate shared by live backend integration suites."""

import os
from urllib.parse import urlparse

import pytest


def require_live_backend_url() -> str:
    if os.environ.get("RUN_LIVE_INTEGRATION_TESTS") != "1":
        pytest.skip(
            "live integration tests are disabled; set "
            "RUN_LIVE_INTEGRATION_TESTS=1 and REACT_APP_BACKEND_URL explicitly",
            allow_module_level=True,
        )

    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not backend_url:
        pytest.skip(
            "live integration tests require an explicit REACT_APP_BACKEND_URL",
            allow_module_level=True,
        )

    parsed = urlparse(backend_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise pytest.UsageError(
            "live integration tests require an explicit http(s) "
            "REACT_APP_BACKEND_URL"
        )
    if parsed.hostname.lower().endswith(".preview.emergentagent.com"):
        raise pytest.UsageError(
            "live integration tests refuse the retired Emergent preview URL"
        )

    return backend_url.rstrip("/")


def require_live_test_jwt_secret() -> str:
    require_live_backend_url()
    secret = os.environ.get("TEST_JWT_SECRET", "")
    if not secret:
        raise pytest.UsageError(
            "live JWT tests require TEST_JWT_SECRET as a test-side copy of "
            "the deployed server JWT_SECRET"
        )
    return secret
