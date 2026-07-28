# Uplaud V2 Vercel Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Uplaud V2 to Vercel with FastAPI, Airtable, and Vercel Blob while preserving functionality, removing MongoDB, and retaining a verified rollback path.

**Architecture:** Vercel serves the CRA frontend and exposes the FastAPI application as one Python Function. Airtable becomes the only structured datastore. Two distinct Vercel Blob stores preserve access separation: one private store for source binaries and approval receipts, and one public store for blog images. Custom credentials use `BLOB_PRIVATE_READ_WRITE_TOKEN` and `BLOB_PUBLIC_READ_WRITE_TOKEN`; Vercel-generated `BLOB_READ_WRITE_TOKEN` and `PUBLIC_READ_WRITE_TOKEN` are accepted fallbacks. All production promotion happens only after a Preview deployment passes persistence, tenancy, browser, and performance gates.

**Tech Stack:** React 19, CRA/Craco, FastAPI, Vercel Python Runtime/Fluid Compute, Airtable REST API, Vercel Blob Python SDK, Supabase Auth, OpenAI, pytest, Vercel CLI

---

## File Map

- Create `api/index.py`: Vercel's FastAPI entry point.
- Create `pyproject.toml`: Python runtime selection and FastAPI application script.
- Create `vercel.json`: frontend build, SPA rewrites, Python function duration, and bundle exclusions.
- Create `backend/blob_storage.py`: the only Vercel Blob integration boundary.
- Create `backend/tests/test_airtable_transport.py`: retry and pagination contracts.
- Create `backend/tests/test_mongo_free_persistence.py`: behavior-preserving Mongo removal tests.
- Create `backend/tests/test_source_persistence.py`: source persistence across independent requests.
- Create `backend/tests/test_blob_storage.py`: source/blog upload storage contracts.
- Create `backend/tests/test_vercel_entrypoint.py`: deployment import and route smoke tests.
- Modify `backend/airtable_client.py`: retrying transport, pagination, source repository, and strict agent-plan writes.
- Modify `backend/server.py`: remove Mongo, replace local state/files, and use Airtable/Blob persistence.
- Modify `backend/requirements.txt`: remove Motor and add the Vercel SDK.
- Modify `frontend/src/lib/api.js`: same-origin API base.
- Modify direct API constants in blog/landing pages: same-origin API base.
- Modify `frontend/package.json`: deterministic Vercel build metadata where required.

## Task 1: Establish Mongo-Free Behavioral Contracts

**Files:**
- Create: `backend/tests/test_mongo_free_persistence.py`
- Modify: `backend/server.py`

- [ ] **Step 1: Write failing import and behavior tests**

```python
# backend/tests/test_mongo_free_persistence.py
import ast
from pathlib import Path

SERVER = Path(__file__).parents[1] / "server.py"


def test_server_has_no_mongo_runtime_dependency():
    tree = ast.parse(SERVER.read_text())
    imported = {
        alias.name
        for node in ast.walk(tree)
        if isinstance(node, (ast.Import, ast.ImportFrom))
        for alias in node.names
    }
    text = SERVER.read_text()
    assert "motor.motor_asyncio" not in imported
    assert "MONGO_URL" not in text
    assert "DB_NAME" not in text
    assert "db." not in text


def test_no_process_local_source_store():
    assert "TEMP_SOURCES" not in SERVER.read_text()
```

- [ ] **Step 2: Verify the tests fail against the current V2 code**

Run: `python -m pytest backend/tests/test_mongo_free_persistence.py -v`

Expected: FAIL because `server.py` imports Motor, reads Mongo environment variables, uses `db.*`, and defines `TEMP_SOURCES`.

- [ ] **Step 3: Commit only the failing contract tests**

```bash
git add backend/tests/test_mongo_free_persistence.py
git commit -m "test: define Mongo-free persistence contracts"
```

## Task 2: Make Airtable Transport Reliable and Paginated

**Files:**
- Create: `backend/tests/test_airtable_transport.py`
- Modify: `backend/airtable_client.py`

- [ ] **Step 1: Write tests for transient retry and complete pagination**

```python
# backend/tests/test_airtable_transport.py
import pytest
import airtable_client


@pytest.mark.asyncio
async def test_get_all_follows_airtable_offsets(monkeypatch):
    responses = [
        {"records": [{"id": "rec1"}], "offset": "next"},
        {"records": [{"id": "rec2"}]},
    ]

    async def fake_get(table, params=None):
        assert table == "Circles"
        if len(responses) == 1:
            assert params["offset"] == "next"
        return responses.pop(0)

    monkeypatch.setattr(airtable_client, "_get", fake_get)
    result = await airtable_client._get_all("Circles", {"pageSize": 100})
    assert [record["id"] for record in result] == ["rec1", "rec2"]


@pytest.mark.asyncio
async def test_request_retries_429_then_succeeds(monkeypatch):
    attempts = 0

    async def fake_send(*args, **kwargs):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise airtable_client.TransientAirtableError(429, "rate limited")
        return {"records": []}

    monkeypatch.setattr(airtable_client, "_send_once", fake_send)
    assert await airtable_client._request("GET", "Circles") == {"records": []}
    assert attempts == 2
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_airtable_transport.py -v`

Expected: FAIL because `_get_all`, `TransientAirtableError`, `_send_once`, and `_request` do not exist.

- [ ] **Step 3: Add a bounded retrying request boundary**

```python
# backend/airtable_client.py
import asyncio

RETRYABLE_STATUS = {429, 500, 502, 503, 504}
MAX_ATTEMPTS = 3


class TransientAirtableError(RuntimeError):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code


async def _send_once(method: str, table: str, *, params=None, json=None) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.request(
            method,
            f"{AIRTABLE_API_URL}/{table}",
            headers=_headers(),
            params=params,
            json=json,
        )
    if response.status_code in RETRYABLE_STATUS:
        raise TransientAirtableError(response.status_code, response.text[:300])
    response.raise_for_status()
    return response.json()


async def _request(method: str, table: str, *, params=None, json=None) -> dict:
    for attempt in range(MAX_ATTEMPTS):
        try:
            return await _send_once(method, table, params=params, json=json)
        except TransientAirtableError:
            if attempt == MAX_ATTEMPTS - 1:
                raise
            await asyncio.sleep(0.25 * (2 ** attempt))
    raise RuntimeError("unreachable")


async def _get_all(table: str, params: dict | None = None) -> list:
    query = dict(params or {})
    records = []
    while True:
        page = await _get(table, query)
        records.extend(page.get("records", []))
        offset = page.get("offset")
        if not offset:
            return records
        query["offset"] = offset
```

- [ ] **Step 4: Route `_get`, `_create`, `_update`, and `_get_record` through `_request`**

Use `_request` for every Airtable operation while preserving the current return shapes. Keep a dedicated 404 branch in `_get_record` by allowing `_send_once` to return `None` for a 404 record request.

- [ ] **Step 5: Replace capped list calls with `_get_all`**

Update `list_circles_by_business`, `list_uplaud_by_business`, `list_growth_signals_by_business`, business lookup, and blog listing to iterate over the complete record list returned by `_get_all`.

- [ ] **Step 6: Run focused and existing Airtable tests**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_airtable_transport.py backend/tests/test_growth_signals_airtable.py backend/tests/test_warm_leads.py -v`

Expected: PASS.

- [ ] **Step 7: Commit Airtable reliability changes**

```bash
git add backend/airtable_client.py backend/tests/test_airtable_transport.py
git commit -m "feat: add reliable paginated Airtable transport"
```

## Task 3: Move Agent Plans Fully to Airtable

**Files:**
- Modify: `backend/tests/test_mongo_free_persistence.py`
- Modify: `backend/tests/test_referral_agent.py`
- Modify: `backend/airtable_client.py`
- Modify: `backend/server.py`

- [ ] **Step 1: Add tests for cached-plan read and strict plan writes**

```python
@pytest.mark.asyncio
async def test_plan_write_failure_is_not_reported_as_success(monkeypatch):
    async def fail(*args, **kwargs):
        raise RuntimeError("airtable unavailable")

    monkeypatch.setattr(airtable_client, "_update", fail)
    with pytest.raises(RuntimeError, match="airtable unavailable"):
        await airtable_client.update_circle_agent_plan("recLead", {"status": "pending"})


@pytest.mark.asyncio
async def test_plan_status_failure_is_not_reported_as_success(monkeypatch):
    async def fail(*args, **kwargs):
        raise RuntimeError("airtable unavailable")

    monkeypatch.setattr(airtable_client, "_update", fail)
    with pytest.raises(RuntimeError, match="airtable unavailable"):
        await airtable_client.update_circle_agent_plan_status("recLead", "approved")
```

- [ ] **Step 2: Verify the strict-write tests fail**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_mongo_free_persistence.py -v`

Expected: FAIL because current helper functions swallow Airtable exceptions.

- [ ] **Step 3: Make plan writes strict**

Remove the `try/except` wrappers from `update_circle_agent_plan` and `update_circle_agent_plan_status`. Let the retrying Airtable transport exhaust retries and propagate its error to FastAPI.

- [ ] **Step 4: Replace Mongo plan reads in the routes**

```python
# backend/server.py
@api_router.get("/warm-leads")
async def get_warm_leads(current=Depends(get_current_user)):
    business_name = (
        await airtable_client.get_business_name_by_email_domain(current["email"])
        or current["company"]
    )
    leads = await airtable_client.list_circles_by_business(business_name)
    return {"business_name": business_name, "leads": leads}
```

In `run_referral_agent`, use `lead.get("agent_plan")` as the cached plan and return it unless `force=True`. In `update_agent_plan_status`, load the scoped lead with `get_circle_lead`, require `lead["agent_plan"]`, update Airtable, then return the same plan with the new status.

- [ ] **Step 5: Run referral-agent tests**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_referral_agent.py backend/tests/test_referral_agent_v2.py backend/tests/test_referral_outreach.py -v`

Expected: PASS, including create → reload → approve/skip persistence.

- [ ] **Step 6: Commit the agent-plan migration**

```bash
git add backend/server.py backend/airtable_client.py backend/tests/test_mongo_free_persistence.py backend/tests/test_referral_agent.py
git commit -m "refactor: persist referral agent plans only in Airtable"
```

## Task 4: Remove Remaining MongoDB Writes

**Files:**
- Modify: `backend/tests/test_mongo_free_persistence.py`
- Modify: `backend/server.py`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Add referral and lead-magnet persistence tests**

```python
@pytest.mark.asyncio
async def test_lead_magnet_awaits_airtable_write(monkeypatch):
    called = []

    async def save(**kwargs):
        called.append(kwargs)
        return "recUser"

    monkeypatch.setattr(airtable_client, "find_or_create_user", save)
    result = await server.blog_lead_magnet(
        server.LeadMagnetRequest(email="reader@company.com", slug="guide")
    )
    assert result == {"status": "ok"}
    assert called[0]["extra_fields"]["Interests"] == "Blog Lead Magnet: guide"
```

Add an endpoint-level referral test that stubs `find_or_create_user` and `create_circle_record`, submits two referrals, and asserts exactly two `Circles` writes and no secondary repository call.

- [ ] **Step 2: Remove redundant Mongo operations**

Delete the referral `db.referrals.insert_one` call. Replace the lead-magnet background task with:

```python
record_id = await airtable_client.find_or_create_user(
    name=name_part,
    email=email,
    extra_fields={"Interests": f"Blog Lead Magnet: {slug}"},
)
if not record_id:
    raise HTTPException(status_code=502, detail="Could not save lead magnet signup")
```

- [ ] **Step 3: Remove Mongo initialization and dependency**

Delete the Motor import, client/database initialization, Mongo startup/shutdown handlers, and `motor` package from `backend/requirements.txt`.

- [ ] **Step 4: Run the Mongo-free contract and flow tests**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_mongo_free_persistence.py backend/tests/test_referrals_enrichment.py backend/tests/test_warm_leads.py backend/tests/test_blog.py -v`

Expected: PASS and `rg 'MONGO_URL|DB_NAME|motor|db\.' backend` returns no runtime matches.

- [ ] **Step 5: Commit complete Mongo removal**

```bash
git add backend/server.py backend/requirements.txt backend/tests/test_mongo_free_persistence.py
git commit -m "refactor: remove MongoDB from V2 backend"
```

## Task 5: Persist Sources Before Analysis

**Files:**
- Create: `backend/tests/test_source_persistence.py`
- Modify: `backend/airtable_client.py`
- Modify: `backend/server.py`

- [ ] **Step 1: Add source repository tests**

```python
# backend/tests/test_source_persistence.py
import pytest
import airtable_client


@pytest.mark.asyncio
async def test_upsert_uploading_source_round_trips(monkeypatch):
    stored = {}

    async def upsert(table, fields, merge_fields):
        assert merge_fields == ["Source_Id"]
        stored.update(fields)
        return {"id": "recSource", "fields": fields}

    async def get_source(*args, **kwargs):
        return None

    monkeypatch.setattr(airtable_client, "_upsert_by_fields", upsert)
    monkeypatch.setattr(airtable_client, "get_source_by_id", get_source)
    monkeypatch.setattr(airtable_client, "_get_source_by_id_unscoped", get_source)
    record = await airtable_client.upsert_uploading_source(
        source_id="src-1",
        business_name="Acme",
        owner_id="user-1",
        filename="call.txt",
        file_type="txt",
        transcript_text="Customer transcript",
        word_count=2,
        content_sha256="a" * 64,
        share_id="share-1",
        created_at="2026-07-28T12:00:00+00:00",
    )
    assert record["fields"]["Source_Status"] == "uploading"
    assert record["fields"]["Content_SHA256"] == "a" * 64
    assert "Blob_Url" not in record["fields"]
    assert stored["Transcript_Text"] == "Customer transcript"
```

- [ ] **Step 2: Verify the test fails**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_source_persistence.py -v`

Expected: FAIL because `upsert_uploading_source` does not exist.

- [ ] **Step 3: Add additive `Growth_Signals` source fields**

Before code deployment, verify or create these Airtable fields through the Airtable Metadata API: `Owner_Id`, `Filename`, `File_Type`, `Transcript_Text`, `Word_Count`, `Content_SHA256`, `Source_Status`, and `Blob_Url`. `Content_SHA256` is an additive single-line text field containing a lowercase 64-character hex digest. Do not rename or delete existing fields.

- [ ] **Step 4: Implement the Airtable source repository**

Add `upsert_uploading_source`, `get_source_by_id`, and `update_source_by_id` to `airtable_client.py`. Compute raw-byte SHA-256 and derive `Source_Id` from authenticated owner ID plus the digest. The initial source write must use Airtable `performUpsert` keyed by `Source_Id`, persist canonical metadata/transcript/`Content_SHA256` with status `uploading`, and omit `Blob_Url`. Re-read and validate the canonical row after an ambiguous upsert response. Retry identity uses owner, business, source ID, digest, and immutable file facts—not exact `Created_At` string equality—and preserves the existing `Created_At` and `Share_Id`. Scope reads by both `Source_Id` and `Business_Name`; permit strict transitions through `uploading`/`upload_failed`/`uploaded`, and store `analyzed` only after successful insight persistence.

- [ ] **Step 5: Rewrite source routes to use persisted records**

Remove `TEMP_SOURCES`. `POST /sources` creates/upserts the Airtable `uploading` row before any Blob write and returns only after strict finalization to `uploaded`. `GET /sources/{id}` reads Airtable. `POST /sources/{id}/analyze` rejects incomplete uploads, retrieves `Transcript_Text`, performs analysis, and updates the same source record idempotently.

- [ ] **Step 6: Verify independent-request persistence**

Create a test client, upload a source, clear all imported module caches that could contain state, create a second test client, and assert the source remains retrievable from the stubbed Airtable repository.

- [ ] **Step 7: Run source and public testimonial suites**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_source_persistence.py backend/tests/test_openai_analyze.py backend/tests/test_growth_signals_airtable.py backend/tests/test_uplaud_flows.py -v`

Expected: PASS.

- [ ] **Step 8: Commit durable source persistence**

```bash
git add backend/server.py backend/airtable_client.py backend/tests/test_source_persistence.py
git commit -m "feat: persist uploaded sources in Airtable"
```

## Task 6: Replace Durable Local Files with Vercel Blob

**Files:**
- Create: `backend/blob_storage.py`
- Create: `backend/tests/test_blob_storage.py`
- Modify: `backend/server.py`
- Modify: `backend/airtable_client.py`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Write Blob adapter tests**

```python
# backend/tests/test_blob_storage.py
import pytest
import blob_storage


@pytest.mark.asyncio
async def test_store_source_uses_deterministic_private_blob(monkeypatch):
    calls = []

    class FakeClient:
        def __init__(self, *, token):
            assert token == "private-token"

        async def put(self, pathname, body, **options):
            calls.append((pathname, body, options))
            return type("Blob", (), {"url": "https://blob/source", "pathname": pathname})()

        async def aclose(self):
            pass

    monkeypatch.setenv("BLOB_PRIVATE_READ_WRITE_TOKEN", "private-token")
    monkeypatch.setattr(blob_storage, "AsyncBlobClient", FakeClient)
    result = await blob_storage.store_source("src-1", "call.txt", b"hello", "text/plain")
    assert result == "https://blob/source"
    assert calls[0][2]["access"] == "private"
    assert calls[0][2]["add_random_suffix"] is False
    assert calls[0][2]["overwrite"] is False


@pytest.mark.asyncio
async def test_store_blog_image_uses_public_blob(monkeypatch):
    calls = []

    class FakeClient:
        def __init__(self, *, token):
            assert token == "public-token"

        async def put(self, pathname, body, **options):
            calls.append(options)
            return type("Blob", (), {"url": "https://blob/image.png", "pathname": pathname})()

        async def aclose(self):
            pass

    monkeypatch.setenv("BLOB_PUBLIC_READ_WRITE_TOKEN", "public-token")
    monkeypatch.setattr(blob_storage, "AsyncBlobClient", FakeClient)
    result = await blob_storage.store_blog_image("image.png", b"png", "image/png")
    assert result.endswith("image.png")
    assert calls[0]["access"] == "public"
```

- [ ] **Step 2: Add the Vercel SDK and adapter**

Pin `vercel==0.7.2` in `backend/requirements.txt`. Add a required (never skipped) import/version/signature contract for `AsyncBlobClient.put`, `get`, `head`, `delete`, and `aclose` in the Task 6 suite. Implement source, blog-image, and approval-receipt operations with `vercel.blob.AsyncBlobClient`. Source pathnames must be deterministic and sanitized under `sources/{source_id}/`, with `overwrite=False` and no random suffix; after a failed put, reconcile the same pathname with `head`, then read no more than the 5 MiB source limit from the private store and require the stored bytes' SHA-256 to match. Size alone is insufficient. Blog images remain public and collision-resistant. Cap approval-receipt reads at 64 KiB before decoding JSON. Map access, missing-token, and expired-token SDK errors to a sanitized storage-unavailable error.

- [ ] **Step 3: Integrate source and admin uploads**

Implement the controlling source-first state machine: upsert canonical Airtable metadata/transcript as `uploading` with no Blob URL; create the deterministic private Blob; then strictly update that same row with `Blob_Url` and `uploaded`. On Blob failure, best-effort mark `upload_failed` and return a sanitized dependency error. On an ambiguous final Airtable response, re-read and accept only the exact URL/`uploaded` state; otherwise retain both the deterministic Blob and tracked source row for retry or reconciliation. Never delete the Blob as compensation for an ambiguous Airtable result. Replace `open(filepath, "wb")` in `/admin/upload` with public-store `store_blog_image` and return the public Blob URL.

Add local mocked tests for committed-then-timeout initial upserts, lost final-update responses, Blob failure status, ambiguous final updates without deletion, owner-and-digest source identity, same-client retry resumption, cross-owner separation, mismatched-digest collisions, digest-verified Blob adoption, receipt-size limits, and credential-expiry mapping. Preserve deterministic first-writer approval behavior.

- [ ] **Step 4: Run Blob and blog tests**

Run: `PYTHONPATH=backend python -m pytest backend/tests/test_blob_storage.py backend/tests/test_source_persistence.py backend/tests/test_source_state_security.py -v`

Expected: PASS with only local/mocked Blob coverage, and `rg 'open\(filepath|uploads_dir|os\.makedirs' backend/server.py` returns no durable-upload implementation.

- [ ] **Step 5: Commit Blob persistence**

```bash
git add backend/blob_storage.py backend/server.py backend/requirements.txt backend/tests/test_blob_storage.py
git commit -m "feat: persist uploads with Vercel Blob"
```

## Task 7: Package CRA and FastAPI for One Vercel Project

**Files:**
- Create: `api/index.py`
- Create: `pyproject.toml`
- Create: `vercel.json`
- Create: `backend/tests/test_vercel_entrypoint.py`
- Modify: `frontend/src/lib/api.js`
- Modify: `frontend/src/components/landing/BlogPreview.jsx`
- Modify: `frontend/src/components/landing/LeadForm.jsx`
- Modify: `frontend/src/pages/AdminBlogPage.jsx`
- Modify: `frontend/src/pages/BlogListPage.jsx`
- Modify: `frontend/src/pages/BlogPostPage.jsx`

- [ ] **Step 1: Write a FastAPI entry-point smoke test**

```python
# backend/tests/test_vercel_entrypoint.py
from fastapi.testclient import TestClient
from api.index import app


def test_vercel_entrypoint_exposes_api_health():
    response = TestClient(app).get("/api/")
    assert response.status_code == 200
    assert response.json()["message"] == "Uplaud Growth Engine API"
```

- [ ] **Step 2: Create the Vercel FastAPI entry point**

```python
# api/index.py
from backend.server import app

__all__ = ["app"]
```

- [ ] **Step 3: Define Python runtime metadata**

```toml
# pyproject.toml
[project]
name = "uplaud-v2"
version = "2.0.0"
requires-python = ">=3.12,<3.13"
dependencies = []

[project.scripts]
app = "backend.server:app"
```

Keep runtime packages in `backend/requirements.txt` only if Vercel confirms nested requirements installation; otherwise move the exact runtime dependencies to root `requirements.txt` during the implementation and verify from build logs.

- [ ] **Step 4: Default all frontend API clients to same-origin**

Use this exact base construction everywhere:

```javascript
const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API = `${BACKEND}/api`;
```

This produces `/api` in Vercel and still permits an explicit backend URL locally.

- [ ] **Step 5: Add Vercel build and route configuration**

Create `vercel.json` with a build command that installs/builds `frontend`, an output directory of `frontend/build`, a Python function rule for `api/index.py` with the account-supported duration, exclusions for tests/reports, an `/api/(.*)` rewrite to the Python entry point, and an SPA fallback to `/index.html`.

- [ ] **Step 6: Run local packaging checks**

Run:

```bash
PYTHONPATH=. python -m pytest backend/tests/test_vercel_entrypoint.py -v
cd frontend && npm ci && npm run build
```

Expected: API smoke test PASS and CRA production build completes with `frontend/build/index.html`.

- [ ] **Step 7: Commit Vercel packaging**

```bash
git add api/index.py pyproject.toml vercel.json frontend backend/tests/test_vercel_entrypoint.py
git commit -m "feat: package Uplaud V2 for Vercel"
```

## Task 8: Run Full Local Verification

**Files:**
- Modify tests only if a test exposes a real compatibility regression; do not weaken assertions.

- [ ] **Step 1: Install deterministic dependencies**

Run `python -m pip install -r backend/requirements.txt` and `npm ci --prefix frontend` in the approved workspace runtime.

- [ ] **Step 2: Run all backend tests**

Run: `PYTHONPATH=backend:. python -m pytest backend/tests -v`

Expected: all tests PASS with no Mongo environment variables.

- [ ] **Step 3: Run frontend tests non-interactively**

Run: `CI=true npm test --prefix frontend -- --watchAll=false`

Expected: PASS; if the repository has no frontend tests, the command must exit successfully with the configured no-tests behavior or a focused route/API-base test must be added.

- [ ] **Step 4: Build frontend and inspect backend bundle inputs**

Run: `npm run build --prefix frontend` and inspect the Python dependency/site-package size before deployment.

Expected: build PASS and estimated uncompressed Python bundle remains below Vercel's 500 MB limit.

- [ ] **Step 5: Verify no forbidden state remains**

Run:

```bash
rg 'MONGO_URL|DB_NAME|motor\.motor_asyncio|TEMP_SOURCES|db\.' backend
rg 'open\(.*["'"']wb["'"']|uploads_dir' backend
```

Expected: no runtime Mongo, process-local source, or durable local-upload matches.

- [ ] **Step 6: Commit any test-only compatibility fixes**

```bash
git add backend/tests frontend/src
git commit -m "test: verify V2 Vercel compatibility"
```

Skip this commit if verification required no changes.

## Task 9: Configure a Safe Vercel Preview

**Files:**
- Vercel project settings and environment only; never write secret values to repository files or logs.

- [ ] **Step 1: Record rollback deployment**

Run: `vercel inspect https://www.uplaud.ai`

Expected: record the current Ready production deployment ID and URL in the release checklist.

- [ ] **Step 2: Link the workspace to `uplaud-production`**

Run: `vercel link --project uplaud-production --yes`

Expected: `.vercel/project.json` points to `prj_fhmackrdzjoBAOP4HuYpohXQ9m9C`; `.vercel` remains gitignored.

- [ ] **Step 3: Audit environment-variable names without printing secret values**

Run: `vercel env ls`

Expected: Preview and Production contain Airtable (`AIRTABLE_PAT` or legacy `AIRTABLE_API_KEY`), OpenAI, PDL, Supabase, admin/JWT, and a private/public Blob pair using either custom scoped names or generated `BLOB_READ_WRITE_TOKEN` and `PUBLIC_READ_WRITE_TOKEN`. Record names and scopes only—never values.

- [ ] **Step 4: Create and connect two access-scoped Vercel Blob stores**

Create a private Blob store for source binaries and approval receipts and a separate public Blob store for blog images in the selected region. Connect both to `uplaud-production`. In both Preview and Production, retain the generated private `BLOB_READ_WRITE_TOKEN` and public `PUBLIC_READ_WRITE_TOKEN`, or map them to the corresponding custom scoped names; verify the underlying values are distinct without displaying them. Audit with `vercel env ls` and record only variable names and environment scopes. This is an external billable resource action and requires explicit user approval at execution time.

- [ ] **Step 5: Verify additive Airtable fields**

Use Airtable Metadata API to confirm the source-persistence fields from Task 5—including the additive single-line text field `Content_SHA256`—and agent-plan fields from the design exist. Add only missing fields. Confirm the digest field accepts a lowercase 64-character SHA-256 hex value without printing production record contents. This is a live schema mutation and requires explicit user approval at execution time.

- [ ] **Step 6: Deploy Preview only**

Run: `vercel deploy`

Expected: deployment status Ready, Environment Preview, with no `www.uplaud.ai` or `uplaud.ai` alias reassignment.

- [ ] **Step 7: Inspect build and function logs**

Confirm CRA output, Python dependency installation, FastAPI route detection, configured duration, and absence of import/startup errors.

## Task 10: Preview Functional and Performance Gates

**Files:**
- No code changes unless verification reveals a defect; defects return to the relevant TDD task.

- [ ] **Step 1: Run health and routing smoke tests**

Verify `/`, `/business`, `/business/referrals`, `/blog`, and `/api/` directly on the Preview URL. Expected: HTTP 200 and no SPA 404s.

- [ ] **Step 2: Verify authentication and tenancy**

Sign in through Supabase, load `/auth/me`, and confirm a business user only receives its resolved Airtable business records.

- [ ] **Step 3: Verify source cold-invocation persistence**

Upload a uniquely prefixed transcript, wait long enough to force an independent request, retrieve it, analyze it, regenerate it, and complete the public testimonial edit/approve flow.

- [ ] **Step 4: Verify Mongo-replacement flows**

Submit a uniquely prefixed referral, confirm it appears in Warm Pipeline, generate an agent plan, reload, approve/skip, reload again, and confirm exact plan/status persistence in Airtable. Submit a lead magnet and confirm the Airtable `User` update.

- [ ] **Step 5: Verify Blob-backed blog upload**

Upload an image through the admin endpoint and confirm the returned URL remains available from a separate browser session.

- [ ] **Step 6: Exercise failure handling**

Use mocked integration tests—not destructive live credential changes—to show exhausted Airtable retries produce a non-2xx API response and never a false success toast.

- [ ] **Step 7: Measure performance**

Capture server timing for Warm Pipeline, source upload, analysis, and agent generation. Warm Pipeline must make one paginated `Circles` request plus one batched linked-User request per page, with no Mongo or per-plan Airtable request. Compare median warm responses to the current V2 baseline; investigate any regression above 10% or 250 ms, whichever is larger.

- [ ] **Step 8: Clean uniquely prefixed preview records**

Remove only records created by this verification run after resolving and validating their exact record IDs. Do not bulk-delete by a broad formula.

## Task 11: Promote the Verified Deployment and Preserve Rollback

**Files:**
- Vercel deployment state only.

- [ ] **Step 1: Present the release evidence and request promotion approval**

Summarize the exact Preview URL, commit SHA, test results, functional gates, performance measurements, environment audit, and rollback deployment. Production promotion requires explicit user approval.

- [ ] **Step 2: Promote the tested deployment without rebuilding**

Use Vercel's deployment promotion/alias operation on the exact verified Preview deployment. Do not run a fresh `vercel --prod` build from an unverified working tree.

- [ ] **Step 3: Run immediate production smoke tests**

Verify home, business login, authenticated Warm Pipeline, and one read-only Airtable API call on `www.uplaud.ai`. Inspect frontend and function errors.

- [ ] **Step 4: Roll back if any release gate fails**

Reassign the production aliases to the recorded Ready deployment. Confirm `www.uplaud.ai` serves the prior deployment and report the failed gate; do not attempt risky production debugging while the site is impaired.

- [ ] **Step 5: Close the release**

Record the production deployment ID, commit SHA, promotion time, smoke-test result, and rollback deployment ID. Keep the previous deployment available until V2 has completed an agreed observation window.

## Reviewer Self-Check

- Every Mongo read and write has a named Airtable replacement.
- Agent-plan fields are read in the existing batched `Circles` response; migration adds no per-plan requests.
- Airtable failures propagate after bounded retries.
- The current 100-record cap is removed through pagination.
- Source and blog persistence no longer depend on process memory or local filesystem.
- Frontend API calls work same-origin on Vercel.
- Preview uses live Airtable only with uniquely identified records.
- Creation of both access-scoped Blob stores, Airtable schema changes, and production promotion require explicit approval.
- Preview and Production expose distinct private/public Blob credentials through custom scoped names or the generated `BLOB_READ_WRITE_TOKEN`/`PUBLIC_READ_WRITE_TOKEN` pair; environment audits never print values.
- Production promotion uses the exact verified deployment and has an identified rollback target.
