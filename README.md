# Uplaud

Uplaud is packaged as one Vercel project: a Create React App frontend and a
FastAPI backend exposed under `/api`.

## Local development

Install the backend runtime and development tools from the repository root:

```sh
python3.12 -m pip install -r backend/requirements-dev.txt
```

Start FastAPI on port 8000:

```sh
python3.12 -m uvicorn backend.server:app --reload
```

Install the locked frontend dependencies and start CRA in another terminal:

```sh
npm --prefix frontend ci --legacy-peer-deps
REACT_APP_BACKEND_URL=http://localhost:8000 \
REACT_APP_SUPABASE_URL="$REACT_APP_SUPABASE_URL" \
REACT_APP_SUPABASE_PUBLISHABLE_KEY="$REACT_APP_SUPABASE_PUBLISHABLE_KEY" \
npm --prefix frontend start
```

Run the backend and focused frontend tests with:

```sh
python3.12 -m pytest -q -n 0
(cd backend && python3.12 -m pytest tests)
npm --prefix frontend test -- --runInBand --watchAll=false src/lib/api.test.js
```

The eight legacy root files are standalone network scripts, not valid pytest
suites, and pytest always ignores them. Load `TEST_PASSWORD` (and
`TEST_JWT_SECRET` for the JWT scripts) from an external secret store, choose a
current non-Emergent target, and invoke a script directly:

```sh
export RUN_LIVE_INTEGRATION_TESTS=1
: "${REACT_APP_BACKEND_URL:?load the current target URL from deployment output}"
: "${TEST_PASSWORD:?load TEST_PASSWORD from the approved secret store}"
python3.12 comprehensive_backend_test.py
python3.12 test_business_profile.py
python3.12 test_sources_airtable.py
python3.12 test_sources_comprehensive.py
python3.12 test_www_comprehensive.py
python3.12 test_www_prefix.py

: "${TEST_JWT_SECRET:?load the test-side JWT copy from the approved secret store}"
python3.12 backend_test.py
python3.12 test_work_email_validation.py
```

The real live pytest modules under `backend/tests` remain gated. With the same
credentials loaded, collect or run them explicitly:

```sh
(cd backend && python3.12 -m pytest -m live_integration tests)
```

`TEST_JWT_SECRET` is a test-side copy of the deployed server's `JWT_SECRET`,
used only to construct expiry-test tokens. The backend continues to read
`JWT_SECRET`; never store either value in this repository.

## Vercel runtime configuration

Preview, production, and Vercel development imports fail closed unless every
runtime variable below is configured in the Vercel project:

- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AIRTABLE_PAT`, falling back to the legacy Vercel name `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY`
- `PDL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY`
- Private Blob token: `BLOB_PRIVATE_READ_WRITE_TOKEN`, falling back to Vercel's
  generated `BLOB_READ_WRITE_TOKEN`
- Public Blob token: `BLOB_PUBLIC_READ_WRITE_TOKEN`, falling back to the
  connected store's generated `PUBLIC_READ_WRITE_TOKEN`

Local imports outside Vercel generate a per-process development JWT secret when
none is configured, so unit tests and local startup do not require production
credentials. Admin blog endpoints still return HTTP 503 until
`ADMIN_PASSWORD` is explicitly configured.

The backend uses the unprefixed Supabase names. CRA embeds only the two
`REACT_APP_SUPABASE_*` names at frontend build time. Configure both pairs with
the same public Supabase URL and publishable key; missing frontend values stop
the application with a configuration error instead of selecting a fallback.

Custom scoped Blob names take precedence over platform-generated names. The
resolved private and public tokens must be distinct; missing or identical
credentials keep Blob storage unavailable.

### Mandatory pre-Preview credential rotation gate

Before the next Preview deployment, a user-approved operator must:

- rotate any Supabase user password and admin credential that matched the
  formerly committed demo credential;
- update the Preview environment through the external credential stores and
  Vercel project settings, without copying values into this repository;
- verify the retired credential is rejected and the replacement credentials
  work; and
- record explicit deployment approval after rotation verification.

Do not deploy a Preview until every item above is complete. This repository
change only removes the exposed literal; it does not rotate external state.

## Frontend dependency overrides

The frontend uses npm-native `overrides`. Parent-scoped pins keep PostCSS,
FormData, YAML, and Picomatch versions inside each consumer's declared major
range. The prior Yarn resolutions that globally forced incompatible majors for
`webpack-dev-server`, `resolve-url-loader`, `uuid`, `@tootallnate/once`,
`nth-check`, and `serialize-javascript` were intentionally not carried over;
those upgrades require updating their parent CRA toolchain packages.
