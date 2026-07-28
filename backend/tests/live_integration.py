"""Fail-closed opt-in gate shared by live backend integration suites."""

import os

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

    return backend_url.rstrip("/")
