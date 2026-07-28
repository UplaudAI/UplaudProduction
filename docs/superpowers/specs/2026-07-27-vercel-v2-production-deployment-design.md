# Uplaud V2 Production Deployment Design

## Objective

Deploy the `Uplaud-V2-Production` codebase to `www.uplaud.ai` without reducing functionality or performance. Keep the current `main` deployment available for rollback. Host the React frontend and FastAPI backend on Vercel, use Airtable as the sole database, and remove MongoDB safely.

## Current State

- Vercel project: `uplaud-production`
- Production domains: `www.uplaud.ai` and `uplaud.ai`
- Current production branch: `main`
- Current production architecture: Vite frontend plus JavaScript functions under `api/`
- V2 architecture: CRA/Craco frontend under `frontend/`, FastAPI under `backend/`, Airtable integrations, OpenAI processing, Supabase authentication, and People Data Labs enrichment
- V2 still contains legacy MongoDB references and process-local/file-local storage that are unsuitable for Vercel Functions

## Target Architecture

### Vercel frontend

Vercel builds the CRA application from `frontend/` and serves its static assets through the Vercel CDN. Client-side routes rewrite to the frontend entry point. The frontend calls the same deployment's `/api` routes, avoiding an additional backend domain and cross-origin dependency.

### Vercel FastAPI function

Vercel exposes the FastAPI application as one Python Function using Fluid Compute. The application entry point imports the existing FastAPI `app`. Function duration is configured to accommodate OpenAI analysis and referral-research requests. Runtime dependencies exclude tests, reports, and frontend assets to remain below Vercel's Python bundle limit.

### Persistent storage

- Airtable is the sole structured datastore.
- Two separate Vercel Blob stores preserve the access boundary: a private store holds uploaded source files and approval receipts, and a public store holds blog images.
- The private store credential is exposed to the application only as `BLOB_PRIVATE_READ_WRITE_TOKEN`; the public store credential is exposed only as `BLOB_PUBLIC_READ_WRITE_TOKEN`. The values must be distinct.
- Extracted transcript text and source metadata are persisted before analysis; no workflow depends on process memory.
- Temporary parsing files may use `/tmp`, but no durable state relies on the function filesystem.

## MongoDB Removal

### Referrals

Remove the redundant `db.referrals.insert_one` call. Each referral already creates a `User` record and a `Circles` record in Airtable. The endpoint must report failure if required Airtable writes do not complete.

### Referral-agent plans

Use the existing agent-plan fields on each Airtable `Circles` record:

- `Research_Headline`
- `Research_Summary`
- `Email_Subject`
- `Email_Body`
- `Linkedin_Message`
- `Next_Action_Label`
- `Next_Action_Cta`
- `Agent_Plan_Status`
- `Agent_Plan_Generated_At`

Cached-plan reads, plan creation, and approve/skip updates all use the same Airtable record. The Warm Pipeline already maps these fields into `agent_plan` during its normal batched Airtable read, so no extra read is introduced.

Change Airtable plan writes to raise a service error after bounded retries instead of logging and returning success. This prevents the UI from reporting a saved plan that was not persisted.

### Lead-magnet signups

Store lead-magnet interest on the Airtable `User` record and await the write. Remove the duplicate MongoDB insert and background-only Airtable task.

### Mongo initialization

Remove Motor, `MONGO_URL`, `DB_NAME`, Mongo client initialization, shutdown handling, and Mongo index creation. Those indexes only support collections that no longer exist and have no replacement requirement in Airtable.

## Airtable Reliability and Performance

- Preserve the existing batched `Circles` and linked `User` reads.
- Remove the additional Mongo agent-plan query from every Warm Pipeline load.
- Add Airtable pagination rather than stopping at 100 records.
- Use bounded retries with backoff for transient `429` and `5xx` responses.
- Respect Airtable rate-limit headers and avoid per-record reads in list endpoints.
- Place the Vercel Function in a region with low latency to Airtable and the majority of users.
- Record endpoint timing during preview verification and compare it with the current V2 baseline.

## Source Upload and Analysis Flow

1. The browser uploads a supported transcript.
2. The backend validates size and file type.
3. The backend computes `Content_SHA256` over the raw bytes and derives a stable `Source_Id` from the authenticated owner ID plus that digest. The same owner and bytes therefore resume one source; another owner receives a different identity.
4. Before any Blob write, the backend uses Airtable `performUpsert`, keyed by `Source_Id`, to persist the canonical owner-scoped metadata, transcript, and `Content_SHA256` with `Source_Status="uploading"` and no `Blob_Url`. Retry identity excludes exact `Created_At` string equality, preserves the original timestamp/share ID, and fails closed if immutable facts or the digest differ.
5. The original file is created once in the private Blob store at a deterministic, sanitized source-ID pathname. A retry may adopt an existing object only after downloading at most the 5 MiB upload limit and comparing its SHA-256 digest, not merely its size.
6. The same Airtable source is strictly updated with the matching `Blob_Url` and `Source_Status="uploaded"`. If the update response is lost, the backend re-reads that canonical source and returns success only when the URL, status, owner, and digest match. A later client retry resumes the same row and Blob.
7. A Blob failure is best-effort marked `upload_failed`. A final Airtable failure leaves the deterministic Blob and canonical source row intact for retry or reconciliation; it never performs a destructive compensation delete after an ambiguous response.
8. Analysis retrieves persisted transcript text only from an `uploaded` source, calls OpenAI, and updates that same `Growth_Signals` record to `analyzed` after successful insight persistence.
9. Regeneration and public testimonial flows operate entirely from persisted records. Approval receipts use deterministic create-once objects in the private Blob store.

This replaces `TEMP_SOURCES`, ensuring uploads survive cold starts, concurrent instances, and deployments.

## Blog Upload Flow

Admin uploads go to the public Vercel Blob store rather than a local `uploads/` directory. Airtable blog records store the resulting durable URL. Existing public blog routes retain their response formats.

## Environment Configuration

Configure Vercel Preview and Production environments separately. Required names include:

- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY`
- `PDL_API_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `REACT_APP_BACKEND_URL` or a same-origin frontend configuration
- `BLOB_PRIVATE_READ_WRITE_TOKEN`, mapped from the connected private Blob store credential
- `BLOB_PUBLIC_READ_WRITE_TOKEN`, mapped from the connected public Blob store credential

Remove `MONGO_URL` and `DB_NAME`. Secrets must not be committed or printed during verification.

Connect and map both Blob stores separately in Preview and Production. The environment audit must list names only, verify that both exact scoped names exist in both environments, confirm that the two underlying values are distinct without printing them, and reject generic one-store configuration such as application use of `BLOB_READ_WRITE_TOKEN`.

The preview environment may use the live Airtable base as approved. Test records must use a unique deployment/test prefix and be removed after verification when safe.

## Deployment Strategy

1. Adapt V2 for Vercel and remove MongoDB on its feature branch.
2. Run unit and backend integration tests locally.
3. Create a Vercel Preview deployment without changing production aliases.
4. Verify the preview through browser and API tests.
5. Record the current production deployment ID as the rollback target.
6. Promote the already-verified preview deployment to production; do not rebuild different code for promotion.
7. Run production smoke tests immediately.
8. Roll back to the recorded deployment if a release gate fails.

## Verification Gates

### Build and health

- Frontend production build succeeds.
- FastAPI imports without MongoDB variables.
- `/api/` health endpoint responds from Preview.
- Direct navigation to frontend routes works.

### Authentication and tenancy

- Supabase login succeeds.
- Expired and invalid tokens are rejected.
- Business users only receive records belonging to their resolved business.

### Sources and testimonials

- Upload a transcript, then retrieve it after a separate request/cold invocation.
- Analyze and regenerate a source.
- Edit, request approval, open the public share link, approve, and reload.
- Confirm `Growth_Signals` and testimonial data persist in Airtable.

### Referrals and agent plans

- Submit a referral from a public testimonial.
- Confirm it appears in Warm Pipeline.
- Generate an agent plan, reload, and confirm identical content.
- Approve and skip plans, reload, and confirm status persistence.
- Simulate an Airtable failure and confirm the API does not return false success.

### Blog and lead magnets

- List/read/create/update/delete a blog post.
- Upload an image and confirm its durable Blob URL.
- Submit a lead magnet and confirm the Airtable `User` update.

### Performance

- Measure Warm Pipeline response time before and after Mongo removal.
- Confirm the new path makes no additional per-plan Airtable request.
- Measure upload, analysis, and referral-agent request duration against configured Vercel limits.
- Check cold-start behavior and function logs.

### Production smoke test

- Home page and business login load.
- Authenticated dashboard and Warm Pipeline load.
- One read-only Airtable-backed API request succeeds.
- No elevated frontend errors, API errors, or function timeouts appear after promotion.

## Rollback

The current ready production deployment remains available in Vercel. If production smoke tests fail, reassign the production domains to that deployment immediately. Airtable changes introduced by V2 must be additive so application rollback does not require a destructive data rollback.

## Success Criteria

- `www.uplaud.ai` serves the verified V2 deployment.
- All existing V2 workflows pass the verification gates.
- No runtime dependency on MongoDB, process memory, or durable local filesystem remains.
- Airtable plan persistence is observable and failure-safe.
- Warm Pipeline performance is no worse than the pre-migration V2 baseline.
- The previous production deployment can be restored without rebuilding.
