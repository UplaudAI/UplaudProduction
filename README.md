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
(cd backend && python3.12 -m pytest tests)
npm --prefix frontend test -- --runInBand --watchAll=false src/lib/api.test.js
```

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

Local imports outside Vercel retain a development-only JWT secret so unit tests
and local startup do not require production credentials. Admin blog endpoints
still return HTTP 503 until `ADMIN_PASSWORD` is explicitly configured.

## Frontend dependency overrides

The frontend uses npm-native `overrides`. Parent-scoped pins keep PostCSS,
FormData, YAML, and Picomatch versions inside each consumer's declared major
range. The prior Yarn resolutions that globally forced incompatible majors for
`webpack-dev-server`, `resolve-url-loader`, `uuid`, `@tootallnate/once`,
`nth-check`, and `serialize-javascript` were intentionally not carried over;
those upgrades require updating their parent CRA toolchain packages.
