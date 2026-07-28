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
  (historical local setup only). The login form no longer prefills either email
  or password, and credentials must be supplied through external secret stores.
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

## What's been implemented (2026-07-24, cont'd #2)
- Referral Agent outreach drafts (email + LinkedIn InMail, `build_outreach_prompt` in
  server.py): now explicitly frame the referrer as "your contact {referrer}" on first mention
  (referee often won't recall the referrer's name), and when the referrer's testimonial is
  substantive (≥40 chars) the email body MUST include a real quoted excerpt in quotation marks
  rather than a loose paraphrase. Verified via curl — confirmed both behaviors in a fresh
  regenerated draft.
- Warm Pipeline table (ReferralAgentPage.jsx) redesigned: column order now Lead → Recent
  Activity → Signals → Stage → Referred On → Referred By (status/dates/referrer moved to the
  right end); Recent Activity and Signals columns widened (no more cutoff text); Referred On
  is a narrow two-line date/time column; lead's role/company line is now uppercase.

## What's been implemented (2026-07-24, cont'd)
- Growth Signals (`/business/conversations`): Intelligent Action + hero metric now computed
  live from real conversation/insight data (`useMemo` in ConversationsPage.jsx) instead of
  static mocks; CTA jumps to the actual highest-signal conversation with a status-aware action
  label (Draft/Send/View approval/Amplify).
- New Airtable table `Growth_Signals` (created via Metadata API, base appFUJWWTaoJ3YiWt) stores
  every AI-extracted insight (motivations, pain points, buying signals, objections, customer
  language, product feedback, FAQs, sentiment, signal score) per source, keyed by Source_Id
  (idempotent upsert). Written on `POST /api/sources/{id}/analyze` and status-synced to
  "approved" on public testimonial approval.
- Growth Amplification (`/business/social`): hero metric + Intelligent Action now driven by real
  `GET /api/testimonials` data (count of approved testimonials, top testimonial surfaced) with a
  graceful zero-state; "Themes ready to move acquisition" and "Post queue" sections removed
  entirely (dead code PostRow/STATUS_META cleaned up); "Generate draft" now copies AI output to
  clipboard directly (no more fake queue).
- Instagram/LinkedIn/X post preview + branded visual asset cards (SocialAssets.jsx) restyled to
  PayRewards' real blue brand (#3066C9 palette, sourced from payrewards.com) with the real
  PayRewards logo lockup (generated asset `/payrewards-logo-lockup.png`); fixed an Instagram
  card layout bug where the quote collapsed into a large empty gap (now vertically centered).
- PageHero (`components/business/PageHero.jsx`) NorthStarBlock redesigned as a bordered white
  card matching the Intelligent Action panel's height 1:1 (`items-stretch` grid) — fixes the
  ROI Simulator's (and all other pages using northStar) misaligned/whitespace-heavy hero.
- Verified via testing_agent (100% pass, 9/9 frontend checks + 2/2 new backend Airtable tests):
  Airtable Growth_Signals persistence, live hero data on both pages, removed sections confirmed
  gone, visual fixes rendering correctly, no regressions in prior flows.

## What's been implemented (2026-07-27 — bug fixes)
- **Bug 1 (Personalize workspace not storing brand data)**: `POST/GET /api/business/profile`
  previously only saved Business Name/Domain. Added `scrape_business_website()` in server.py —
  fetches the entered site's homepage (httpx + BeautifulSoup), extracts brand color (theme-color
  meta tag, else dominant non-generic hex from inline CSS), logo (og:image → apple-touch-icon →
  favicon, resolved to an absolute URL), and calls OpenAI (gpt-4o) grounded strictly in the
  scraped title/meta description/body text to infer a 2-3 sentence brand voice description.
  Added `Brand_Voice` (multilineText), `Brand_Color` (singleLineText), `Logo_Url` (singleLineText)
  fields to the Airtable `Business` table (via Metadata API) and wired both endpoints to
  persist/read them. Verified live against stripe.com and payrewards.com — correct colors, logos
  and grounded brand-voice text returned and round-tripped through Airtable.
- **Bug 2 (extracted testimonial not showing in Growth Signals UI/Airtable)**: Root cause —
  `airtable_client.upsert_growth_signal()` was sending `Testimonial_Draft` and `Share_Id` fields
  that didn't exist in the real Airtable `Growth_Signals` table schema, so every create/update
  silently failed with a 422 (caught and only logged as a warning, never surfaced). Added the two
  missing fields to the table via the Airtable Metadata API. Verified via curl (200 OK on the
  Airtable write, record now appears in `GET /api/sources`) and via testing_agent: uploaded a
  transcript end-to-end, confirmed it appears in the Growth Signals page (`/business/conversations`)
  conversation list with full extracted signals + drafted testimonial, no console/network errors.
- Added `beautifulsoup4` to backend/requirements.txt for HTML parsing.

## What's been implemented (2026-07-27, cont'd — 2 more bug fixes)
- **Public testimonial share links ("/t/{share_id}") always showed "invalid or expired"**: root
  cause — `public_get_testimonial`/`public_update_testimonial`/`public_approve_testimonial`/
  `send_approval`/`submit_referrals` in server.py were still querying MongoDB `db.sources`/
  `db.users`, which have been empty since the earlier Sources rewrite moved everything to
  in-memory `TEMP_SOURCES` + Airtable `Growth_Signals` (no data ever migrated). Rewrote all five
  endpoints to resolve the source via a new `find_public_source()` helper (checks `TEMP_SOURCES`
  first, then Airtable `Growth_Signals` by `Share_Id`), added `get_growth_signal_by_share_id()` /
  `update_growth_signal_by_source_id()` to `airtable_client.py`, and added `Approved_At` /
  `Approval_Requested_At` fields to the `Growth_Signals` Airtable table. Verified via
  testing_agent: the exact previously-broken link `/t/46651f8c7376` now loads correctly, plus
  edit/approve/refer-a-friend all work end-to-end on a freshly uploaded transcript.
- **Sources page (`/business/import`, first landing page for new users) redesigned**: added a
  personalized dark "Welcome to Uplaud" hero (`WelcomeBanner`) shown only in the zero-source
  state — greets the user by first name/company and gives a 3-step overview (capture voice →
  extract signals & testimonials → turn wins into referrals/social), with an upload CTA; the
  existing metrics-driven `PageHero` now only renders once sources exist. Decoupled the
  "Personalize workspace" card's visibility from `sources.length` — it now shows/hides based on
  whether the business profile actually has `brand_voice`/`logo_url` set (fetched via
  `GET /api/business/profile`), so it correctly disappears once a workspace has been
  personalized regardless of how many sources exist. Verified via testing_agent.
- P2 backlog: `analyze_source` already creates an Uplaud-table record on analysis, and
  `public_approve_testimonial` creates another on approval — pre-existing duplicate-write
  behavior (masked by de-dupe in `list_uplaud_by_business` on read); left as-is, not part of the
  reported bugs. Also noted minor perf items from testing_agent (rapid `/api/sources` refetches,
  duplicate React keys on conversation cards, Airtable call volume) — non-blocking, deferred.

## What's been implemented (2026-07-27, cont'd — Warm Pipeline referral bug)
- **Referrals submitted via the public testimonial page weren't appearing in Warm Pipeline**
  even though they existed correctly in Airtable's `Circles` table (`Business_Name="Scalis"`).
  Root cause: a stale bad `Business` table row (`Business Name="Www"`, `Business Domain=
  "www.scalis.ai"`, left over from before the site had www-prefix stripping) was shadowing the
  correct `Scalis`/`scalis.ai` row in `get_business_name_by_email_domain()`'s loose
  `biz_domain.endswith(domain)` substring check — so the Warm Pipeline read path resolved the
  logged-in user's business to "Www" while referral writes (sourced directly from the Growth
  Signal record's `Business_Name` field) correctly used "Scalis". Deleted the bad Airtable row
  and hardened `get_business_name_by_email_domain()` in `airtable_client.py` to normalize
  "www." on both sides and always prefer an exact domain match over a subdomain-style match.
  Verified via testing_agent end-to-end (upload → analyze → approve → refer a friend → confirmed
  the referral now appears in Warm Pipeline / `GET /api/warm-leads`).

## What's been implemented (2026-07-27, cont'd — UI tightening + CTA polish)
- Sources page: "Signals Synced" hero box now has a "View Growth Signals" CTA
  (`northStar.cta` prop added to `PageHero`/`NorthStarBlock`, reused generically) linking to
  `/business/conversations` — also fills the box's previously-empty bottom whitespace.
- Sources page decluttered: dropzone moved directly under the hero/personalize card (visible
  without scrolling), "Customer feedback" (G2/Capterra) source list hidden, tightened padding/
  font sizes across hero, personalize card, dropzone, and the bottom info panel.
- "Connect integration" button now shows a "Please contact admin" toast instead of a generic
  simulated-integration message.
- Growth Signals page (`/business/conversations`): "Explore individual conversations" (list +
  detail split view) moved directly under the hero; the full-width "Latest approved testimonial"
  block was replaced with a compact `CompactLatestTestimonial` card (smaller font) shown inside
  the right-hand detail column instead of occupying the mid-page.
- Warm Pipeline (`/business/referrals`) and `PageHero` (used site-wide) spacing tightened
  (reduced section/heading padding and margins).
- Login now redirects straight to Warm Pipeline (`/business/referrals`) if there are unseen new
  warm leads (`getSeenLeadsCount`/`setSeenLeadsCount` in `business-storage.js`, compared against
  `GET /api/warm-leads` count at login; marked "seen" when the Warm Pipeline page is visited),
  falling back to the normal destination otherwise.
- Verified via testing_agent: all 5 changes pass, no console errors introduced, no broken layout.

## What's been implemented (2026-07-27, cont'd — "keeps reverting to Sources page")
- **Warm Pipeline (and any non-whitelisted page) kept redirecting back to Sources**: root cause
  was `DashboardLayout.jsx`'s zero-source redirect `useEffect` had `loc.pathname` in its
  dependency array, so it re-ran `GET /api/sources` and force-redirected to `/business/import`
  on EVERY navigation whenever that call returned 0 sources for the resolved business. Fixed by
  gating the check with a `zeroStateChecked` ref so it only runs once per login session, not on
  every route change.
- Also found + repaired the actual data corruption behind the "Scalis" account's 0-sources
  read: one `Growth_Signals` record and one `Uplaud` record had been written with
  `Business_Name="Www"` while the (now-deleted) bad Business row was shadowing `scalis.ai`;
  relabeled both to `"Scalis"` directly in Airtable so that account's real testimonial/source
  data is visible again.
- Bonus fix found while testing: ROI Simulator page (`/business/roi-simulator`) crashed with
  `ReferenceError: businessName is not defined` in the `BoardroomSummary` sub-component — it
  referenced `businessName` without it being passed as a prop. Fixed by passing
  `businessName` through from the parent. Both fixes verified via testing_agent.
