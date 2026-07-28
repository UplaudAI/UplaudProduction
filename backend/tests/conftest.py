"""Shared configuration for backend tests invoked from the repository root."""

import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "live_integration: requires explicit opt-in and an external backend URL",
    )
