# Uplaud Growth Engine — PRD

## Original problem statement
User is building Uplaud Growth Engine: converts customer voice (calls, reviews, DMs) into
insights, testimonials, referral campaigns, and a growth flywheel. Code lives at
https://github.com/UplaudAI/UplaudProduction, branch `conflict_220726_1738`. Team was mid-dev
and hadn't backed up all local changes to GitHub. Ask: restore/build a preview from the latest
available code so the user can see how much progress has been made.

## Architecture
- FastAPI backend (`/app/backend/server.py`, ~1160 lines), MongoDB for sources/users/insights/
  agent_plans, Airtable (User/Circles/Business/Uplaud/Event_Log tables) as CRM system of record
  for leads/reviewers, People Data Labs for person enrichment.
- React (CRA + craco) frontend (`/app/frontend`), Tailwind, shadcn/ui.
- Auth: JWT (bcrypt password hash), single seeded demo/admin user.

## What's been implemented (2026-07-24)
- Cloned `conflict_220726_1738` branch from GitHub (no .env was ever committed — expected,
  gitignored). Copied backend (server.py, airtable_client.py, requirements.txt, tests) and
  frontend (src, public, plugins, package.json, craco/tailwind/postcss/jsconfig configs) into
  this sandbox, replacing the blank template.
- Wired `backend/.env` with real user-provided keys: OPENAI_API_KEY, AIRTABLE_PAT,
  AIRTABLE_BASE_ID (appFUJWWTaoJ3YiWt), PDL_API_KEY, plus JWT_SECRET/ADMIN_EMAIL/ADMIN_PASSWORD
  (set to match the frontend's hardcoded demo login default: dcameron@payrewards.com /
  P@yRew@rds123, so the pre-filled login form works out of the box).
- Fixed a pip dependency conflict (stray pinned `litellm` wheel unrelated to any code usage,
  removed from requirements.txt) blocking backend startup; installed all deps (yarn + pip).
- Verified via testing_agent (15/15 backend tests, all 10 dashboard routes, no console/network
  errors): auth login/JWT protection, source upload + OpenAI (gpt-4o) insight extraction,
  Airtable-backed Warm Pipeline (`GET /api/warm-leads`) against the real Airtable base, Referral
  Agent (`POST /api/warm-leads/{id}/agent-run`) doing real OpenAI web-search research (gpt-4.1)
  + drafting personalized email/LinkedIn outreach, public testimonial share page.
- Only gap found: Blog feature (`/api/blog`, `/api/admin/blog`, `/api/admin/upload`) has
  frontend pages (BlogListPage/BlogPostPage/AdminBlogPage) but no backend routes — 404s
  gracefully to an empty list; post detail/admin editor would break if used.
- Social Agent (Growth Amplification page) rewired to real AI generation: composer + live
  LinkedIn/Instagram/X previews now call `POST /api/social/generate` (OpenAI, PayRewards brand
  voice) instead of the old local mock generator; added a `tone` param (professional/punchy/
  founder-testimonial/data-forward/warm) threaded through the prompt. "Generate draft" pushes
  real AI copy into the Post queue.
- Growth Amplification now sources testimonials from the real Airtable `Uplaud` table, filtered
  by the logged-in business (`business_name` match via `current["company"]` /
  email-domain lookup), excluding low-sentiment (`NBA_Sentiment`) rows and de-duping — new
  `GET /api/testimonials` endpoint + `airtable_client.list_uplaud_by_business()`. Verified live
  against the real PayRewards data (5 real testimonials incl. Jamie Rivera, Deepthi Rao).
- Real LinkedIn/X publishing (OAuth + posting API) explicitly deferred at user's request —
  "Connect accounts"/"Schedule"/"Publish now" remain simulated (toast-only). Playbooks already
  gathered (LinkedIn OAuth2 + UGC/Posts API needs Client ID/Secret + org page admin approval for
  company posting; X needs OAuth2 app + paid Basic tier for tweet.write) — ready to implement
  once user provides developer app credentials.

## Core requirements (static)
- Convert customer testimonials/reviews/calls into referral, social, and reputation growth
  campaigns.
- Enrich referred leads via People Data Labs; give business users full visibility into
  everything known about a warm lead.
- CRM data of record lives in Airtable (User/Circles/Business/Uplaud tables).

## User personas
- Business admin / growth marketer (demo: "David Cameron", Head of Marketing, PayRewards)
  reviewing warm leads, insights, and approving campaigns.
- End customers being asked for testimonials/referrals via a public share link.

## Prioritized backlog / remaining work
- P1: Implement blog backend endpoints (`/api/blog` list/detail, `/api/admin/blog` CRUD,
  `/api/admin/upload`) or explicitly deprioritize/remove the blog frontend routes.
- P1 (deferred by user): Real LinkedIn/X publishing — needs user-provided developer app
  credentials (LinkedIn Client ID/Secret + page admin approval; X OAuth2 app on a paid tier).
- P2: `airtable_client.list_circles_by_business()` uses `pageSize=100` with no pagination.
- P2: `submit_referrals()` enriches referrals serially per friend — fine for small batches.
- P2: Referral Agent auto-triggers up to 5 concurrent OpenAI calls on page load.
- P2: Consider splitting `server.py` (1160+ lines) into routers by domain.

## Next tasks
- Verify/build out Reddit Agent, Conversations, Reviews pages against real data (deferred,
  not yet requested).
- Revisit LinkedIn/X publishing once user is ready with developer credentials.
- Decide on blog feature fate (build backend vs remove).
