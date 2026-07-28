"""Fail-closed collection policy for legacy root-level live test suites."""

import os
from pathlib import Path


ROOT = Path(__file__).resolve().parent
LIVE_INTEGRATION_TESTS = frozenset(
    {
        "backend_test.py",
        "comprehensive_backend_test.py",
        "test_business_profile.py",
        "test_sources_airtable.py",
        "test_sources_comprehensive.py",
        "test_work_email_validation.py",
        "test_www_comprehensive.py",
        "test_www_prefix.py",
    }
)


def _live_integration_enabled() -> bool:
    return (
        os.environ.get("RUN_LIVE_INTEGRATION_TESTS") == "1"
        and bool(os.environ.get("REACT_APP_BACKEND_URL", "").strip())
    )


def pytest_ignore_collect(collection_path, config):
    path = Path(str(collection_path))
    if (
        path.parent == ROOT
        and path.name in LIVE_INTEGRATION_TESTS
        and not _live_integration_enabled()
    ):
        return True
    return None


def pytest_terminal_summary(terminalreporter):
    if not _live_integration_enabled():
        terminalreporter.write_line(
            "root live integration suites ignored: set "
            "RUN_LIVE_INTEGRATION_TESTS=1 and REACT_APP_BACKEND_URL explicitly"
        )
