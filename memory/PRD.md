# Uplaud.AI — Business Page Redesign

## Original problem statement
Redesign the Uplaud business review page (currently at `https://www.uplaud.ai/business/the-solved-skin`) to match the newly redesigned landing page at `https://ai-acquisition-hub-2.preview.emergentagent.com/`. Design must feel trustworthy, modern and engaging. Primary verticals: Education, Health & Wellness, Legal, FinTech.

## User choices (verbatim)
- Business Profile Hero
- Trust Badges / "Verified by Uplaud" indicators
- Blog page for the business that converts testimonials into case studies/blogs
- Single dynamic route that works with any business (`the-solved-skin` = seeded example)
- Colors, fonts, and brand voice must match the new landing page

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`) + MongoDB (Motor async driver). Business, Review, and CaseStudy collections auto-seed on startup.
- **Frontend**: React 19 + Tailwind, cream/violet/mint palette, `Bricolage Grotesque` + `Instrument Serif` + `Inter Tight` typography.
- **Routes**:
  - `/` → redirects to `/business/the-solved-skin`
  - `/business/:slug` → dynamic business page
  - `/business/:slug/blog/:csSlug` → case study detail

## API endpoints
- `GET /api/business/{slug}` — business profile
- `GET /api/business/{slug}/reviews?rating&sort&q&referred_only` — filtered reviews
- `POST /api/business/{slug}/reviews` — submit new review
- `GET /api/business/{slug}/stats` — trust score, sentiment, keyword cloud, rating distribution
- `GET /api/business/{slug}/case-studies` — story list
- `GET /api/business/{slug}/case-studies/{cs_slug}` — story detail

## What's been implemented (2026-01-14)
- **Business Hero**: gradient logo tile, verified badge, location/site/founded, animated Uplaud Trust Score card (0-100 with gradient fill), 4 mini stats, mint-underlined tagline matching landing-page treatment.
- **Trust badges strip**: "Verified by Uplaud" + unique-reviewer count + vertical-specific badges (auto-adapts per vertical: dermatologist, bar assoc, SOC 2, educator-vetted, etc.). Dedup logic prevents repeats.
- **Insights section**: rating distribution bars, sentiment breakdown (positive/neutral/critical), animated keyword cloud (sized by frequency, colored by sentiment).
- **Reviews section**: filterable grid (search, rating pills, sort, referred-only toggle), skeleton loading states, 12 seeded reviews with real content from live site.
- **Review cards**: gradient avatar with initials, star rating, emoji reaction, verified badge, referred pill, WhatsApp channel, verified-purchase footer.
- **AI Stories / Blog**: 3 seeded case studies converted from top reviews (PCOS journey, cystic-acne turnaround, referral-loop deep-dive). Each has excerpt + hero quote + rich body HTML.
- **Case Study detail page**: editorial reading experience with prose styling, pull-quote block, back-link, share button, "browse all stories" CTA.
- **Share Your Experience CTA**: dark violet gradient panel with emoji-based rating, name/text inputs, live submit to backend, success state, WhatsApp share.
- **Nav + Footer**: sticky glass-morphism nav matching landing page, footer with claim/privacy/terms.

## Testing status
- Backend: 11/11 endpoints pass ✅
- Frontend: 12/12 UI flows pass ✅
- No dark-on-dark text issues, no blockers.

## Prioritized backlog

### P1 — Enhance
- Add multiple seeded verticals (Education, Legal, FinTech) with distinct sample businesses so the dynamic route is demonstrably universal.
- Photo/video review support (attach media to reviews).
- Real "Claim this business" flow (auth + email verification).
- OG image generation per business page for social sharing.

### P2 — Nice to have
- LLM-powered case-study generator (analyze N reviews → produce draft case study). Currently seeded manually.
- Reviewer profile pages (`/profile/:reviewerSlug`).
- Business admin dashboard for owners.
- SEO metadata + schema.org Review markup.

## Deferred / Future
- Move review text to a full-text index for smarter search.
- Multi-language support (Hindi, Tamil given customer base).

## B2B adaptation (2026-08)
- Added second seeded business `ai-fiesta` (B2B SaaS, modeled on aifiesta.ai — multi-LLM chat subscription) alongside `the-solved-skin` (B2C). Business now has `audience` field ("b2c" | "b2b") driving terminology.
- **Review model**: new `verification_type` field ("purchase" | "demo") + `reviewer_title` (job title/company). Reviews with `verification_type="demo"` show a violet "Verified Demo" badge (Video icon); purchase-type reviews show "Verified purchase" (b2c) or "Verified subscriber" (b2b) with a mint ShieldCheck icon.
- **B2B terminology swap** (when `business.audience === "b2b"`): Trust Score → Vendor Trust Score, Unique reviewers → Verified accounts, Referrals → Team referrals, "Verified business · Claimed" → "Verified vendor · Claimed", Nav "Refer a friend" → "Refer a teammate", Hero CTA "Share your experience" → "Share your team's experience", conversion tag "+2.3× conversion" → "+2.3× pipeline".
- **TrustStrip**: added `saas` vertical badge set (Y Combinator backed, SOC 2 in progress, Enterprise-ready).
- **Bug fixed**: Insights "Top praise" text and reviews-search placeholder were hardcoded to skincare copy; now dynamic via new `stats.top_praise` field (per-business).
- Removed unused `TrustBadges.jsx` (superseded by `TrustStrip.jsx`).
- Backend seed data refactored to per-slug mapping (`REVIEWS_BY_SLUG`, `CASE_STUDIES_BY_SLUG`) instead of one shared review/case-study list, so each business gets its own seeded content.
- Testing: 15/15 backend pytest cases pass, 100% frontend Playwright pass (`/app/test_reports/iteration_2.json`). Verified Demo vs Verified subscriber badges, B2B terminology, SaaS trust badges, dynamic top_praise, and full regression on `the-solved-skin` (unchanged).

### P1 — Next
- Seed additional B2B verticals (Legal, FinTech) using the same `audience`/`verification_type` pattern for full multi-vertical demo coverage.
- Add a "Verified Demo" filter pill in ReviewsSection (currently only "Referred by a friend" toggle exists) for B2B pages.

## Reviewer Profile Page (2026-08)
- New global route `/profile/:reviewerSlug` aggregates ALL reviews by a reviewer across ANY business (by `reviewer_slug`), not scoped to one business. Demonstrated with "Ananya Iyer" who has real reviews on both `the-solved-skin` and `ai-fiesta` — her profile correctly merges both.
- **New collection** `reviewer_profiles`: `{reviewer_slug, bio, instagram_url, linkedin_url, follower_count}`. Seeded for 6 reviewers (ananya-iyer, rohit-sharma, riya-menon, marcus-chen, rhea-kapoor, aditya-bhatt); others fall back to computed defaults (empty bio, 0 followers).
- **New endpoints**: `GET /api/reviewer/{slug}` (aggregated profile + metrics: total_reviews, avg_rating_given, total_referrals, verified_demo_count, member_since, businesses_reviewed, full reviews list with denormalized business_name), `POST /api/reviewer/{slug}/follow`, `POST /api/reviewer/{slug}/unfollow` (clamped at 0).
- **Frontend**: `ReviewerPage.jsx` — header (avatar, name, title, bio, Instagram/LinkedIn links, Follow/Unfollow button with localStorage-persisted state + optimistic follower count), 4 metric cards, "Businesses reviewed" chips (link to `/business/:slug`), full reviews list (each links to `/business/:slug#reviews`).
- **Bidirectional linking**: reviewer name/avatar on `ReviewCard.jsx` and Hero `PreviewCard` now link to `/profile/:reviewerSlug`; reviewer profile's review cards and business chips link back to the business page.
- Testing: 8/8 backend pytest, 100% frontend Playwright pass (`/app/test_reports/iteration_3.json`). Cleaned up leftover `TEST_`-prefixed seed pollution from earlier test runs.

### P1 — Next
- Add auth so "Follow" persists per-account instead of per-browser localStorage.
- Make unfollow atomic (currently read-then-clamp-set; a $inc + floor-at-0 aggregation update would remove the small race window).

## Reviewer Profile Redesign (2026-08)
- Redesigned `/profile/:reviewerSlug` per user feedback ("looks boring"): dark gradient cover banner (ambient mint/violet blur glows + grid overlay) behind an overlapping gradient avatar tile, hero-style stat strip (5 stats incl. new "Verified demos" count), "Businesses reviewed" as clickable logo-chip cards, and section headers matching site copy voice (pill kicker + italic accent word headings).
- **Shared component reuse**: `ReviewCard.jsx` gained an optional `showBusinessTag` prop (default `false`, only used on the reviewer profile page) that renders a small dark-gradient business logo tile + name (linking to `/business/:slug`) above the reviewer row — so review cards on the profile page are now visually IDENTICAL to business-page review cards (same verification badges, referred tag, avatar colors, WhatsApp referral button).
- Backend `GET /api/reviewer/{slug}` now also returns `business_audience` per review and `audience` per entry in `businesses_reviewed`, so the reused ReviewCard shows correct B2B/B2C terminology per review.
- Testing: 9/9 backend pytest, 100% frontend Playwright pass (`/app/test_reports/iteration_4.json`). Business page regression confirmed clean (no business tag shown there, WhatsApp referral still works).
- Fixed: reviewer page "Back" link no longer hardcoded to `/business/the-solved-skin`; now points to `/`.

### P1 — Next
- Single-column layout for reviewer review grid when a reviewer has only 1 review (currently a 2-col grid with one card looks slightly sparse).
