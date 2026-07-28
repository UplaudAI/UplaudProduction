import json
import os
from pathlib import Path
import subprocess
import sys

from fastapi.testclient import TestClient


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_vercel_entrypoint_imports_without_runtime_credentials():
    env = os.environ.copy()
    for name in (
        "MONGO_URL",
        "MONGODB_URI",
        "BLOB_READ_WRITE_TOKEN",
        "BLOB_PRIVATE_READ_WRITE_TOKEN",
        "BLOB_PUBLIC_READ_WRITE_TOKEN",
        "PYTHONPATH",
    ):
        env.pop(name, None)

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "from api.index import app; print(app.title)",
        ],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "Uplaud Growth Engine API"


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


def test_frontend_manifest_has_no_private_or_url_dependencies():
    package = json.loads((REPO_ROOT / "frontend" / "package.json").read_text())
    assert package["packageManager"] == "npm@10.9.4"
    dependencies = {
        **package.get("dependencies", {}),
        **package.get("devDependencies", {}),
    }

    assert all(
        not value.startswith(("http://", "https://"))
        for value in dependencies.values()
    )
