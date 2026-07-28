import importlib.util
import os
from pathlib import Path
import subprocess
import sys

import live_test_guard


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_STANDALONE_SCRIPTS = {
    "backend_test.py",
    "comprehensive_backend_test.py",
    "test_business_profile.py",
    "test_sources_airtable.py",
    "test_sources_comprehensive.py",
    "test_work_email_validation.py",
    "test_www_comprehensive.py",
    "test_www_prefix.py",
}

SOURCE_INSPECTION_SCRIPTS = {
    "backend_test.py",
    "test_business_profile.py",
    "test_sources_airtable.py",
    "test_sources_comprehensive.py",
}


def _load_root_conftest():
    path = ROOT / "conftest.py"
    assert path.exists(), "root conftest.py must gate live suites before import"
    spec = importlib.util.spec_from_file_location("root_collection_conftest", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_all_root_standalone_scripts_are_always_ignored_by_pytest(monkeypatch):
    module = _load_root_conftest()
    monkeypatch.delenv("RUN_LIVE_INTEGRATION_TESTS", raising=False)
    monkeypatch.delenv("REACT_APP_BACKEND_URL", raising=False)

    assert EXPECTED_STANDALONE_SCRIPTS <= module.STANDALONE_LIVE_SCRIPTS
    for filename in EXPECTED_STANDALONE_SCRIPTS:
        assert module.pytest_ignore_collect(ROOT / filename, None) is True
    monkeypatch.setenv("RUN_LIVE_INTEGRATION_TESTS", "1")
    monkeypatch.setenv("REACT_APP_BACKEND_URL", "https://preview.example.test")
    for filename in EXPECTED_STANDALONE_SCRIPTS:
        assert module.pytest_ignore_collect(ROOT / filename, None) is True
    assert module.pytest_ignore_collect(ROOT / "test_mongodb.py", None) is None
    assert module.pytest_ignore_collect(
        ROOT / "backend/tests/test_blog.py", None
    ) is None


def test_real_no_live_pytest_collection_never_collects_standalone_scripts():
    env = os.environ.copy()
    for name in (
        "RUN_LIVE_INTEGRATION_TESTS",
        "REACT_APP_BACKEND_URL",
        "TEST_PASSWORD",
        "TEST_JWT_SECRET",
    ):
        env.pop(name, None)

    result = subprocess.run(
        [sys.executable, "-m", "pytest", "--collect-only", "-q", "-n", "0"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stdout + result.stderr
    for filename in EXPECTED_STANDALONE_SCRIPTS:
        assert filename not in result.stdout


def test_each_standalone_script_exits_before_network_without_live_gate():
    env = os.environ.copy()
    for name in (
        "RUN_LIVE_INTEGRATION_TESTS",
        "REACT_APP_BACKEND_URL",
        "TEST_PASSWORD",
        "TEST_JWT_SECRET",
    ):
        env.pop(name, None)

    for filename in EXPECTED_STANDALONE_SCRIPTS:
        result = subprocess.run(
            [sys.executable, str(ROOT / filename)],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=False,
            timeout=10,
        )
        assert result.returncode != 0, filename
        assert "RUN_LIVE_INTEGRATION_TESTS=1" in result.stderr, filename


def test_standalone_scripts_reject_the_retired_emergent_preview_target():
    env = os.environ.copy()
    env.update(
        {
            "RUN_LIVE_INTEGRATION_TESTS": "1",
            "REACT_APP_BACKEND_URL": (
                "https://retired.preview" + ".emergentagent.com"
            ),
            "TEST_PASSWORD": "test-only-placeholder",
            "TEST_JWT_SECRET": "test-only-placeholder",
        }
    )

    for filename in EXPECTED_STANDALONE_SCRIPTS:
        result = subprocess.run(
            [sys.executable, str(ROOT / filename)],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=False,
            timeout=10,
        )
        assert result.returncode != 0, filename
        assert "retired Emergent preview" in result.stderr, filename


def test_backend_live_pytest_modules_collect_with_all_test_side_inputs():
    env = os.environ.copy()
    env.update(
        {
            "RUN_LIVE_INTEGRATION_TESTS": "1",
            "REACT_APP_BACKEND_URL": "https://preview.example.test",
            "TEST_PASSWORD": "test-only-placeholder",
            "TEST_JWT_SECRET": "test-only-placeholder",
        }
    )
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "--collect-only",
            "-q",
            "-n",
            "0",
            "-m",
            "live_integration",
            "backend/tests",
        ],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stdout + result.stderr
    assert "test_auth_token_expiry.py::test_expired_token_returns_401" in result.stdout


def test_backend_live_jwt_module_fails_collection_without_test_side_secret():
    env = os.environ.copy()
    env.update(
        {
            "RUN_LIVE_INTEGRATION_TESTS": "1",
            "REACT_APP_BACKEND_URL": "https://preview.example.test",
            "TEST_PASSWORD": "test-only-placeholder",
        }
    )
    env.pop("TEST_JWT_SECRET", None)
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "--collect-only",
            "-q",
            "-n",
            "0",
            "backend/tests/test_auth_token_expiry.py",
        ],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "TEST_JWT_SECRET" in result.stdout + result.stderr


def test_readme_documents_runnable_standalone_live_commands():
    readme = (ROOT / "README.md").read_text()
    for filename in EXPECTED_STANDALONE_SCRIPTS:
        assert f"python3.12 {filename}" in readme


def test_backend_source_path_is_repository_relative_not_cwd_relative(
    monkeypatch, tmp_path
):
    monkeypatch.chdir(tmp_path)

    assert live_test_guard.backend_source_path("server.py") == ROOT / "backend/server.py"
    assert live_test_guard.backend_source_path("airtable_client.py") == (
        ROOT / "backend/airtable_client.py"
    )


def test_all_standalone_scripts_are_free_of_container_absolute_backend_paths():
    for filename in EXPECTED_STANDALONE_SCRIPTS:
        source = (ROOT / filename).read_text()
        assert "/app/backend" not in source, filename

        if filename in SOURCE_INSPECTION_SCRIPTS:
            assert "backend_source_path(" in source, filename

    work_email_source = (ROOT / "test_work_email_validation.py").read_text()
    assert "from backend.server import derive_business_name" in work_email_source
    assert "from backend.server import is_work_email" in work_email_source
