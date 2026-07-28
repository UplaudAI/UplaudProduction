# Vercel Packaging Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vercel imports fail closed without complete runtime configuration, make npm enforce compatible transitive dependency pins, and separate local development dependencies from the production Python bundle.

**Architecture:** A small `backend/runtime_config.py` module owns the required Vercel variable names and validates `os.environ` during `backend.server` import. The frontend uses npm-native nested `overrides`, avoiding the breaking major-version pins in the previous Yarn-only map. A pinned development requirements file layers tooling over the minimal root runtime manifest.

**Tech Stack:** Python 3.12, FastAPI, pytest, npm 10, Create React App, Vercel.

---

### Task 1: Fail closed on Vercel runtime configuration

**Files:**
- Create: `backend/runtime_config.py`
- Modify: `backend/server.py`
- Test: `backend/tests/test_vercel_entrypoint.py`

- [ ] Add subprocess tests proving preview imports list missing variable names without values, complete preview/production/development environments import, and local imports retain only an explicit local JWT fallback.
- [ ] Add a direct test proving `check_admin_token` returns HTTP 503 when `ADMIN_PASSWORD` is absent.
- [ ] Run the focused tests and confirm they fail because no validator exists and the admin fallback still authorizes requests.
- [ ] Implement `REQUIRED_VERCEL_ENV_VARS` with `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `OPENAI_API_KEY`, `PDL_API_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_PUBLISHABLE_KEY`, `BLOB_PRIVATE_READ_WRITE_TOKEN`, and `BLOB_PUBLIC_READ_WRITE_TOKEN`; raise `RuntimeError` containing only missing names whenever `VERCEL_ENV` is present.
- [ ] Call the validator during `backend.server` import, generate a fresh per-process JWT secret only outside Vercel, and return HTTP 503 when the admin password is absent.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Replace Yarn resolutions with npm overrides

**Files:**
- Modify: `frontend/package.json`
- Regenerate: `frontend/package-lock.json`
- Test: `backend/tests/test_vercel_entrypoint.py`

- [ ] Add a manifest contract test requiring npm 10, no `resolutions`, npm `overrides`, aligned `react-router-dom`, parent-scoped PostCSS/FormData/Picomatch overrides, and no incompatible forced majors for `webpack-dev-server`, `resolve-url-loader`, `uuid`, or `@tootallnate/once`.
- [ ] Run the contract test and confirm it fails on the Yarn-only `resolutions` field.
- [ ] Update `react-router-dom` to `7.15.1` and add npm overrides for compatible pins: `node-forge@1.4.0`, `diff@4.0.4`, `follow-redirects@1.16.0`, `path-to-regexp@0.1.13`, `rollup@2.80.0`, `underscore@1.13.8`, `jsonpath@1.3.0`, and `http-proxy-middleware@2.0.10`, plus parent-scoped FormData, PostCSS, YAML, minimatch, and Picomatch versions.
- [ ] Regenerate `package-lock.json` with npm 10 and `--legacy-peer-deps`.
- [ ] Run `npm ls` for the intended versions, the focused Jest suite, and the production CRA build.

### Task 3: Separate Python development requirements

**Files:**
- Create: `backend/requirements-dev.txt`
- Modify: `README.md`
- Test: `backend/tests/test_vercel_entrypoint.py`

- [ ] Add a contract test requiring only `-r ../requirements.txt`, `uvicorn==0.25.0`, `pytest==9.1.1`, `pytest-asyncio==1.4.0`, `pytest-xdist==3.8.0`, and `requests==2.34.2` in the dev manifest, plus current npm/backend run commands in the root README.
- [ ] Run the contract test and confirm it fails because the dev manifest does not exist.
- [ ] Create the pinned manifest and document root-based local setup/run/test commands.
- [ ] Re-run the contract test and confirm it passes.

### Task 4: Verify and commit

**Files:**
- Verify all files above plus the existing Vercel packaging files.

- [ ] Run the complete focused backend packaging/runtime test command and confirm zero failures.
- [ ] Run a clean `npm ci --legacy-peer-deps`, targeted `npm ls`, frontend Jest test, and `CI=true npm run build`.
- [ ] Run Python compile/import checks, Vercel config validation, `git diff --check`, and inspect the final diff for secrets or unrelated changes.
- [ ] Commit the review fixes and report the SHA, exact commands, and outputs.
