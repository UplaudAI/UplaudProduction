# Uplaud Growth CRM — PRD

## Original problem statement
Uplaud Growth CRM converts customer voice into growth campaigns (referrals, social posts, etc).
Codebase: https://github.com/UplaudAI/UplaudProduction (branch `conflict_220726_1738`).
UI is largely built; backend wiring happens feature by feature.

Specific ask handled this session: on `frontend/src/pages/business/ReferralAgentPage.jsx`,
referral leads are enriched via the People Data Labs (PDL) API, but the enrichment data shown
was incomplete — the "Signals" column had no way to show all the extra data PDL returns that
doesn't already have a dedicated table column.

## Architecture
- FastAPI backend (`/app/backend/server.py`), MongoDB for sources/users/referrals, Airtable
  (User/Circles/Business/Uplaud/Event_Log tables) as the CRM system of record for
  leads/reviewers, People Data Labs for person enrichment.
- React (CRA + craco) frontend (`/app/frontend`), Tailwind, shadcn/ui.
- Auth: JWT (bcrypt password hash), single seeded admin/business user.

## What's been implemented (2026-07-23)
- Cloned `conflict_220726_1738` branch into this sandbox; wired `backend/.env`
  (MONGO_URL/DB_NAME/CORS_ORIGINS/JWT_SECRET/ADMIN_EMAIL/ADMIN_PASSWORD/AIRTABLE_PAT/
  AIRTABLE_BASE_ID/PDL_API_KEY/OPENAI_API_KEY).
- Added 9 new columns to the Airtable "User" table via the Airtable Metadata API:
  Work_Email, Mobile_Phone, Skills, Interests, Education, Previous_Company, Job_Start_Date,
  Twitter_URL, Github_URL. Added `Referrer_Testimonial` to the Circles table.
- `backend/airtable_client.py`: new `summarize_pdl_extra()` (+ helpers `_summarize_education`,
  `_most_recent_previous_company`) extracts these extra PDL fields defensively (PDL returns
  booleans instead of real values for some PII fields when redacted at the current API tier —
  guarded against that). Wired into `submit_referrals()` in `server.py` and surfaced through
  `list_circles_by_business()` / `get_circle_lead()` → `GET /api/warm-leads`.
- `frontend/src/pages/business/ReferralAgentPage.jsx`: `buildSignals()` turns all extra lead
  fields into label/value pairs; new `SignalsCell` component renders the first signal + a
  "+N more" toggle that expands the rest inline within the table cell (stopPropagation so it
  doesn't open the lead drawer). LeadDrawer also got a new "Additional PDL signals" block.
- Referral Agent (new): `POST /api/warm-leads/{lead_id}/agent-run` researches the lead/company
  via OpenAI's `responses.create` web_search tool (`gpt-4.1`, existing OPENAI_API_KEY), then
  drafts a grounded personalized email + LinkedIn InMail using the referrer's real testimonial +
  research findings. Plans cached in Mongo `agent_plans` (unique index on `lead_id`);
  `GET /api/warm-leads` returns each lead's cached plan. `POST .../agent-plan/{approve|skip}`
  marks status (simulated, no real send). Frontend auto-generates plans for the top 5 leads in
  "Agentic actions awaiting your approval"; any other lead gets a manual "Generate agent plan"
  button in the drawer (shows research bullets, email/LinkedIn drafts with copy buttons,
  regenerate action).
- Verified end-to-end via curl + testing_agent across 3 rounds: Signals column (12/12 tests +
  UI), OpenAI key fix, Referral Agent (13/13 tests + full UI, genuinely grounded LLM output).

## Core requirements (static)
- Convert customer testimonials/reviews into referral, social, and reputation growth campaigns.
- Enrich referred leads via People Data Labs; give business users full visibility into
  everything known about a warm lead.
- CRM data of record lives in Airtable (User/Circles/Business/Uplaud tables).

## User personas
- Business admin / growth marketer (e.g. "David Cameron", Head of Marketing) reviewing warm
  leads and approving campaigns.
- End customers being asked for testimonials/referrals via a public share link.

## Prioritized backlog / remaining work
- P1: Fix `backend/tests/test_referrals_enrichment.py` hardcoded `SHARE_ID="demo123"` (stale
  fixture, not present in this sandbox's Mongo — 7/15 of its cases 404; unrelated regression).
- P2: `airtable_client.list_circles_by_business()` uses `pageSize=100` with no pagination —
  will silently truncate once a business has >100 Circles rows.
- P2: `submit_referrals()` enriches referrals serially per friend (PDL + Airtable round trips);
  fine for small batches, consider `asyncio.gather` for larger ones.
- P2: Referral Agent auto-triggers up to 5 concurrent OpenAI calls on page load (top-5 leads) —
  fine at current scale, consider a concurrency cap/background job if lead volume grows.
- P2: `_call_openai_web_search` has no explicit timeout — consider adding one.

## Next tasks
- Continue wiring remaining backend features feature-by-feature per user's stated workflow
  (Reviews, Conversations, Social, Reddit agent pages, etc.) as requested.
