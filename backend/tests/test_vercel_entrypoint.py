import json
import os
from pathlib import Path
import subprocess
import sys

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient


REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_VERCEL_ENV_VARS = (
    "JWT_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "AIRTABLE_PAT",
    "AIRTABLE_BASE_ID",
    "OPENAI_API_KEY",
    "PDL_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "REACT_APP_SUPABASE_URL",
    "REACT_APP_SUPABASE_PUBLISHABLE_KEY",
    "BLOB_PRIVATE_READ_WRITE_TOKEN",
    "BLOB_PUBLIC_READ_WRITE_TOKEN",
)


def run_entrypoint_import(env, statement="from api.index import app; print(app.title)"):
    return subprocess.run(
        [sys.executable, "-c", statement],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def runtime_env(vercel_env=None, value_prefix="configured-value"):
    env = os.environ.copy()
    for fallback_name in (
        "AIRTABLE_API_KEY",
        "BLOB_READ_WRITE_TOKEN",
        "PUBLIC_READ_WRITE_TOKEN",
    ):
        env.pop(fallback_name, None)
    if vercel_env is None:
        env.pop("VERCEL_ENV", None)
    else:
        env["VERCEL_ENV"] = vercel_env
    for name in REQUIRED_VERCEL_ENV_VARS:
        env[name] = f"{value_prefix}-{name.lower()}"
    return env


def test_vercel_entrypoint_imports_without_runtime_credentials():
    env = runtime_env()
    for name in ("MONGO_URL", "MONGODB_URI", "BLOB_READ_WRITE_TOKEN", "PYTHONPATH"):
        env.pop(name, None)
    for name in REQUIRED_VERCEL_ENV_VARS:
        env[name] = ""

    result = run_entrypoint_import(
        env,
        "from api.index import app; "
        "from backend.server import JWT_SECRET; "
        "print(app.title); print(JWT_SECRET)",
    )

    assert result.returncode == 0, result.stderr
    output_lines = result.stdout.splitlines()
    assert output_lines[0] == "Uplaud Growth Engine API"
    assert len(output_lines[1]) >= 32


def test_vercel_entrypoint_lists_all_missing_runtime_variable_names():
    env = runtime_env("preview")
    for name in REQUIRED_VERCEL_ENV_VARS:
        env[name] = ""

    result = run_entrypoint_import(env)

    assert result.returncode != 0
    assert (
        "Missing required Vercel environment variables: "
        + ", ".join(REQUIRED_VERCEL_ENV_VARS)
    ) in result.stderr


@pytest.mark.parametrize("vercel_env", ["", "   "])
def test_vercel_entrypoint_fails_closed_when_vercel_env_is_present(vercel_env):
    env = runtime_env(vercel_env)
    for name in REQUIRED_VERCEL_ENV_VARS:
        env[name] = ""

    result = run_entrypoint_import(env)

    assert result.returncode != 0
    assert "Missing required Vercel environment variables" in result.stderr


def test_vercel_entrypoint_error_never_includes_configured_secret_values():
    env = runtime_env("production", value_prefix="never-print-this-secret")
    env["PDL_API_KEY"] = ""

    result = run_entrypoint_import(env)

    assert result.returncode != 0
    assert "PDL_API_KEY" in result.stderr
    assert "never-print-this-secret" not in result.stderr


def test_vercel_entrypoint_imports_with_complete_vercel_runtime_config():
    for vercel_env in ("preview", "production", "development"):
        result = run_entrypoint_import(runtime_env(vercel_env))

        assert result.returncode == 0, result.stderr
        assert result.stdout.strip() == "Uplaud Growth Engine API"


def test_vercel_entrypoint_accepts_platform_generated_blob_token_names():
    env = runtime_env("preview")
    env.pop("BLOB_PRIVATE_READ_WRITE_TOKEN")
    env.pop("BLOB_PUBLIC_READ_WRITE_TOKEN")
    env["BLOB_READ_WRITE_TOKEN"] = "platform-private-token"
    env["PUBLIC_READ_WRITE_TOKEN"] = "platform-public-token"

    result = run_entrypoint_import(env)

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "Uplaud Growth Engine API"


def test_vercel_entrypoint_accepts_legacy_airtable_api_key_name():
    env = runtime_env("preview")
    env.pop("AIRTABLE_PAT")
    env["AIRTABLE_API_KEY"] = "legacy-airtable-token"

    result = run_entrypoint_import(env)

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "Uplaud Growth Engine API"


def test_vercel_entrypoint_uses_fallbacks_for_blank_canonical_values():
    env = runtime_env("preview")
    env["AIRTABLE_PAT"] = "   "
    env["AIRTABLE_API_KEY"] = "legacy-airtable-token"
    env["BLOB_PRIVATE_READ_WRITE_TOKEN"] = "\t"
    env["BLOB_READ_WRITE_TOKEN"] = "platform-private-token"
    env["BLOB_PUBLIC_READ_WRITE_TOKEN"] = "  "
    env["PUBLIC_READ_WRITE_TOKEN"] = "platform-public-token"

    result = run_entrypoint_import(env)

    assert result.returncode == 0, result.stderr


def test_vercel_entrypoint_rejects_identical_effective_blob_tokens():
    env = runtime_env("preview")
    env["BLOB_PRIVATE_READ_WRITE_TOKEN"] = "same-token"
    env["BLOB_PUBLIC_READ_WRITE_TOKEN"] = "same-token"

    result = run_entrypoint_import(env)

    assert result.returncode != 0
    assert "must be distinct" in result.stderr


def test_airtable_client_prefers_pat_then_falls_back_to_legacy_api_key():
    statement = "from backend.airtable_client import AIRTABLE_PAT; print(AIRTABLE_PAT)"
    env = os.environ.copy()
    env["AIRTABLE_PAT"] = "canonical-token"
    env["AIRTABLE_API_KEY"] = "legacy-token"
    preferred = run_entrypoint_import(env, statement)

    env.pop("AIRTABLE_PAT")
    fallback = run_entrypoint_import(env, statement)

    assert preferred.returncode == 0, preferred.stderr
    assert preferred.stdout.strip() == "canonical-token"
    assert fallback.returncode == 0, fallback.stderr
    assert fallback.stdout.strip() == "legacy-token"


def test_airtable_client_ignores_blank_pat_when_legacy_key_exists():
    statement = "from backend.airtable_client import AIRTABLE_PAT; print(AIRTABLE_PAT)"
    env = os.environ.copy()
    env["AIRTABLE_PAT"] = "   "
    env["AIRTABLE_API_KEY"] = "legacy-token"

    result = run_entrypoint_import(env, statement)

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "legacy-token"


def test_backend_modules_import_from_backend_working_directory():
    result = subprocess.run(
        [sys.executable, "-c", "import airtable_client, blob_storage, server"],
        cwd=REPO_ROOT / "backend",
        env=runtime_env(),
        capture_output=True,
        text=True,
        timeout=30,
    )

    assert result.returncode == 0, result.stderr


def test_blob_token_documentation_lists_custom_and_platform_names():
    readme = (REPO_ROOT / "README.md").read_text()

    for name in (
        "BLOB_PRIVATE_READ_WRITE_TOKEN",
        "BLOB_READ_WRITE_TOKEN",
        "BLOB_PUBLIC_READ_WRITE_TOKEN",
        "PUBLIC_READ_WRITE_TOKEN",
    ):
        assert f"`{name}`" in readme
    assert "`AIRTABLE_PAT`" in readme
    assert "`AIRTABLE_API_KEY`" in readme


def test_admin_token_returns_503_when_admin_password_is_unset(monkeypatch):
    from backend import server

    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    request = Request({"type": "http", "headers": []})

    with pytest.raises(HTTPException) as exc_info:
        server.check_admin_token(request)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "ADMIN_PASSWORD is not configured on the server."


def test_vercel_entrypoint_serves_api_root_and_representative_routes():
    from api.index import app

    response = TestClient(app).get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Uplaud Growth Engine API"}

    route_paths = {route.path for route in app.routes}
    assert {
        "/api/auth/login",
        "/api/sources",
        "/api/blog",
        "/api/public/testimonial/{share_id}",
    } <= route_paths


def test_vercel_config_packages_cra_and_fastapi_without_swallowing_api():
    config = json.loads((REPO_ROOT / "vercel.json").read_text())

    assert config["$schema"] == "https://openapi.vercel.sh/vercel.json"
    assert config["framework"] is None
    assert config["buildCommand"] == "npm --prefix frontend run build"
    assert config["installCommand"] == (
        "npm --prefix frontend ci --legacy-peer-deps"
    )
    assert config["outputDirectory"] == "frontend/build"

    function = config["functions"]["api/index.py"]
    assert 1 <= function["maxDuration"] <= 300
    assert "tests" in function["excludeFiles"]
    assert "test_reports" in function["excludeFiles"]
    assert "frontend" in function["excludeFiles"]

    # Vercel natively makes api/index.py the /api/* catch-all. The SPA rule
    # must leave those original paths untouched so FastAPI sees its /api prefix.
    assert config["rewrites"] == [
        {
            "source": "/:path((?!api(?:/|$)).*)",
            "destination": "/index.html",
        }
    ]

    api_headers = next(
        item for item in config["headers"] if item["source"] == "/api/:path*"
    )
    assert {header["key"]: header["value"] for header in api_headers["headers"]}[
        "Cache-Control"
    ] == "no-store"


def test_root_requirements_are_the_single_pinned_runtime_dependency_source():
    requirements = (REPO_ROOT / "requirements.txt").read_text().splitlines()
    backend_requirements = (REPO_ROOT / "backend" / "requirements.txt").read_text()

    assert backend_requirements.strip() == "-r ../requirements.txt"
    assert requirements
    assert all("==" in line for line in requirements if line and not line.startswith("#"))

    normalized = "\n".join(requirements).lower()
    for dependency in (
        "fastapi==",
        "python-dotenv==",
        "bcrypt==",
        "pyjwt==",
        "httpx==",
        "pydantic[email]==",
        "starlette==",
        "python-multipart==",
        "python-docx==",
        "pillow==",
        "pypdf==",
        "openai==",
        "beautifulsoup4==",
        "vercel==0.7.2",
    ):
        assert dependency in normalized

    for banned in ("emergentintegrations", "litellm", "pandas", "numpy"):
        assert banned not in normalized


def test_frontend_api_base_has_same_origin_fallback_and_one_shared_source():
    api_source = (REPO_ROOT / "frontend" / "src" / "lib" / "api.js").read_text()
    assert (
        'export const BACKEND = (process.env.REACT_APP_BACKEND_URL || "")'
        '.replace(/\\/$/, "");'
    ) in api_source
    assert "export const API = `${BACKEND}/api`;" in api_source

    def expected_api(value):
        return f"{(value or '').removesuffix('/')}/api"

    assert expected_api(None) == "/api"
    assert expected_api("") == "/api"
    assert expected_api("https://preview.example/") == "https://preview.example/api"

    direct_env_users = []
    for source_path in (REPO_ROOT / "frontend" / "src").rglob("*"):
        if source_path.suffix not in {".js", ".jsx", ".ts", ".tsx"}:
            continue
        if ".test." in source_path.name or ".spec." in source_path.name:
            continue
        if "REACT_APP_BACKEND_URL" in source_path.read_text():
            direct_env_users.append(source_path.relative_to(REPO_ROOT).as_posix())

    assert direct_env_users == ["frontend/src/lib/api.js"]


def test_frontend_supabase_uses_required_cra_environment_names():
    source = (REPO_ROOT / "frontend/src/lib/supabase.js").read_text()
    readme = (REPO_ROOT / "README.md").read_text()

    assert "process.env.REACT_APP_SUPABASE_URL" in source
    assert "process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY" in source
    assert "NEXT_PUBLIC_SUPABASE" not in source
    assert '"http://localhost:54321"' not in source
    assert '"unconfigured"' not in source
    for name in (
        "SUPABASE_URL",
        "SUPABASE_PUBLISHABLE_KEY",
        "REACT_APP_SUPABASE_URL",
        "REACT_APP_SUPABASE_PUBLISHABLE_KEY",
    ):
        assert f"`{name}`" in readme


def test_frontend_manifest_has_no_private_or_url_dependencies():
    package = json.loads((REPO_ROOT / "frontend" / "package.json").read_text())
    assert package["packageManager"] == "npm@10.9.4"
    assert package["dependencies"]["react-router-dom"] == "7.15.1"
    assert "resolutions" not in package

    overrides = package["overrides"]
    assert {
        "node-forge": "1.4.0",
        "diff": "4.0.4",
        "follow-redirects": "1.16.0",
        "path-to-regexp": "0.1.13",
        "rollup": "2.80.0",
        "underscore": "1.13.8",
        "jsonpath": "1.3.0",
        "http-proxy-middleware": "2.0.10",
    }.items() <= overrides.items()
    assert overrides["axios"] == {"form-data": "4.0.6"}
    assert overrides["jsdom"] == {"form-data": "3.0.5"}
    assert overrides["resolve-url-loader"] == {"postcss": "7.0.39"}
    assert package["devDependencies"]["picomatch"] == "4.0.5"
    assert "picomatch" not in overrides
    assert overrides["@rollup/pluginutils"] == {"picomatch": "2.3.2"}
    assert overrides["tinyglobby"] == {"picomatch": "4.0.5"}
    assert overrides["anymatch"] == {"picomatch": "2.3.2"}

    # These old Yarn resolutions crossed parent packages' declared major ranges.
    for incompatible_global_override in (
        "webpack-dev-server",
        "uuid",
        "@tootallnate/once",
        "nth-check",
        "serialize-javascript",
    ):
        assert incompatible_global_override not in overrides

    dependencies = {
        **package.get("dependencies", {}),
        **package.get("devDependencies", {}),
    }

    assert all(
        not value.startswith(("http://", "https://"))
        for value in dependencies.values()
    )


def test_development_requirements_are_pinned_outside_production_manifest():
    development_requirements = (
        REPO_ROOT / "backend" / "requirements-dev.txt"
    ).read_text().splitlines()
    production_requirements = (REPO_ROOT / "requirements.txt").read_text().splitlines()
    readme = (REPO_ROOT / "README.md").read_text()

    assert development_requirements == [
        "-r ../requirements.txt",
        "uvicorn==0.25.0",
        "pytest==9.1.1",
        "pytest-asyncio==1.4.0",
        "pytest-xdist==3.8.0",
        "requests==2.34.2",
    ]
    assert all(
        not any(line.startswith(f"{package}==") for line in production_requirements)
        for package in ("uvicorn", "pytest", "pytest-asyncio", "pytest-xdist", "requests")
    )
    for command in (
        "python3.12 -m pip install -r backend/requirements-dev.txt",
        "python3.12 -m uvicorn backend.server:app --reload",
        "(cd backend && python3.12 -m pytest tests)",
        "npm --prefix frontend ci --legacy-peer-deps",
        "npm --prefix frontend start",
    ):
        assert command in readme
