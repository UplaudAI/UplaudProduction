import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_LIVE_MODULES = {
    "backend_test.py",
    "comprehensive_backend_test.py",
    "test_business_profile.py",
    "test_sources_airtable.py",
    "test_sources_comprehensive.py",
    "test_work_email_validation.py",
    "test_www_comprehensive.py",
    "test_www_prefix.py",
}


def _load_root_conftest():
    path = ROOT / "conftest.py"
    assert path.exists(), "root conftest.py must gate live suites before import"
    spec = importlib.util.spec_from_file_location("root_collection_conftest", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_all_root_live_modules_are_preimport_gated_without_opt_in(monkeypatch):
    module = _load_root_conftest()
    monkeypatch.delenv("RUN_LIVE_INTEGRATION_TESTS", raising=False)
    monkeypatch.delenv("REACT_APP_BACKEND_URL", raising=False)

    assert EXPECTED_LIVE_MODULES <= module.LIVE_INTEGRATION_TESTS
    for filename in EXPECTED_LIVE_MODULES:
        assert module.pytest_ignore_collect(ROOT / filename, None) is True


def test_root_live_modules_stay_gated_when_backend_url_is_missing(monkeypatch):
    module = _load_root_conftest()
    monkeypatch.setenv("RUN_LIVE_INTEGRATION_TESTS", "1")
    monkeypatch.delenv("REACT_APP_BACKEND_URL", raising=False)

    assert module.pytest_ignore_collect(ROOT / "backend_test.py", None) is True


def test_explicit_live_opt_in_collects_only_the_named_root_suites(monkeypatch):
    module = _load_root_conftest()
    monkeypatch.setenv("RUN_LIVE_INTEGRATION_TESTS", "1")
    monkeypatch.setenv("REACT_APP_BACKEND_URL", "https://preview.example.test")

    assert module.pytest_ignore_collect(ROOT / "backend_test.py", None) is None
    assert module.pytest_ignore_collect(ROOT / "test_mongodb.py", None) is None
    assert module.pytest_ignore_collect(
        ROOT / "backend/tests/test_blog.py", None
    ) is None
