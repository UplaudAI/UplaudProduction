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
