"""Keep legacy standalone network scripts out of pytest collection."""

from pathlib import Path


ROOT = Path(__file__).resolve().parent
STANDALONE_LIVE_SCRIPTS = frozenset(
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


def pytest_ignore_collect(collection_path, config):
    path = Path(str(collection_path))
    if (
        path.parent == ROOT
        and path.name in STANDALONE_LIVE_SCRIPTS
    ):
        return True
    return None


def pytest_terminal_summary(terminalreporter):
    terminalreporter.write_line(
        "legacy root live scripts ignored by pytest; run them directly with "
        "the documented explicit opt-in environment"
    )
