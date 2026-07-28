import pytest

from live_integration import require_live_backend_url, require_live_test_jwt_secret


def test_live_integration_is_skipped_without_explicit_opt_in(monkeypatch):
    monkeypatch.delenv("RUN_LIVE_INTEGRATION_TESTS", raising=False)
    monkeypatch.setenv("REACT_APP_BACKEND_URL", "https://example.invalid")

    with pytest.raises(pytest.skip.Exception, match="RUN_LIVE_INTEGRATION_TESTS=1"):
        require_live_backend_url()


def test_live_integration_is_skipped_without_explicit_backend_url(monkeypatch):
    monkeypatch.setenv("RUN_LIVE_INTEGRATION_TESTS", "1")
    monkeypatch.delenv("REACT_APP_BACKEND_URL", raising=False)

    with pytest.raises(pytest.skip.Exception, match="REACT_APP_BACKEND_URL"):
        require_live_backend_url()


def test_live_integration_uses_only_explicit_backend_url(monkeypatch):
    monkeypatch.setenv("RUN_LIVE_INTEGRATION_TESTS", "1")
    monkeypatch.setenv("REACT_APP_BACKEND_URL", "https://preview.example.test/")

    assert require_live_backend_url() == "https://preview.example.test"


def test_live_jwt_secret_is_required_instead_of_silently_skipped(monkeypatch):
    monkeypatch.setenv("RUN_LIVE_INTEGRATION_TESTS", "1")
    monkeypatch.setenv("REACT_APP_BACKEND_URL", "https://preview.example.test")
    monkeypatch.delenv("TEST_JWT_SECRET", raising=False)

    with pytest.raises(pytest.UsageError, match="TEST_JWT_SECRET"):
        require_live_test_jwt_secret()


def test_live_jwt_secret_reads_the_test_side_copy(monkeypatch):
    monkeypatch.setenv("RUN_LIVE_INTEGRATION_TESTS", "1")
    monkeypatch.setenv("REACT_APP_BACKEND_URL", "https://preview.example.test")
    monkeypatch.setenv("JWT_SECRET", "server-only-value")
    monkeypatch.setenv("TEST_JWT_SECRET", "test-side-copy")

    assert require_live_test_jwt_secret() == "test-side-copy"
