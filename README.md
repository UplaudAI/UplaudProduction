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
REACT_APP_BACKEND_URL=http://localhost:8000 npm --prefix frontend start
```

Run the backend and focused frontend tests with:

```sh
python3.12 -m pytest -q -n 0
(cd backend && python3.12 -m pytest tests)
npm --prefix frontend test -- --runInBand --watchAll=false src/lib/api.test.js
```

Legacy live integration suites are ignored before import unless both
`RUN_LIVE_INTEGRATION_TESTS=1` and `REACT_APP_BACKEND_URL` are set explicitly.
Authenticated live suites read `TEST_PASSWORD` and `TEST_JWT_SECRET` from the
operator's environment; never store those values in this repository.

## Vercel runtime configuration

Preview, production, and Vercel development imports fail closed unless every
runtime variable below is configured in the Vercel project:

- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY`
- `PDL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `BLOB_PRIVATE_READ_WRITE_TOKEN`
- `BLOB_PUBLIC_READ_WRITE_TOKEN`

Local imports outside Vercel generate a per-process development JWT secret when
none is configured, so unit tests and local startup do not require production
credentials. Admin blog endpoints still return HTTP 503 until
`ADMIN_PASSWORD` is explicitly configured.

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
