# Uplaud AI — Landing Page PRD

## Original Problem Statement
Build a high-converting, AI/tech-forward landing page for Uplaud AI. It must communicate trustworthiness and tech competence while speaking to the audience's direct pain points: high customer acquisition costs and dwindling return on ad spend. Target audience: education company founders/marketing teams (SAT prep), law firms, dentists, ecommerce founders/marketers. Design references: pixis.ai, vercel.com, notion.com, attio.com.

## User Choices (verbatim)
- Theme: Hybrid — light editorial hero + dark sections for product/AI showcases
- Primary CTA: "Book a demo"
- Form: submissions sent to deepthi@uplaud.ai
- No case studies for now
- No pricing, no founder photo, no vertical-headlined heroes

## Architecture
- Frontend: React 19 + TailwindCSS + Shadcn UI, React Router. Single-page marketing site at `/`.
- Backend: FastAPI, MongoDB (Motor), Resend for transactional email.
- Fonts: Clash Display (headings, Fontshare) + Manrope (body, Google) + JetBrains Mono (accents).
- Signature color: Electric Emerald `#10b981` on Structural Black `#0a0a0a` / Ivory `#fdfdfb`.

## What's Implemented (updated 2026-12-10 v12 — blog module)
- **Full blog module** added:
  - Backend: `GET /api/blog`, `GET /api/blog/latest`, `GET /api/blog/{slug}`, and admin `POST /api/blog`, `PUT /api/blog/{slug}`, `DELETE /api/blog/{slug}`, `GET /api/admin/blog` (all protected by `X-Admin-Token` header). Model stored in `db.blog_posts` with slug auto-generation.
  - Public pages: `/blog` (featured post + card grid), `/blog/:slug` (markdown-rendered post with prose typography, cover image, tag/date/author, CTA to demo).
  - Admin page: `/admin/blog` — token-gated (stored in `localStorage`), lists all posts including drafts, in-place create/edit/delete form with fields: title, slug (auto), tag, author, cover image URL, excerpt, markdown content, published toggle.
  - Landing page adds a **"What we're thinking about"** section (auto-hides when no posts).
  - Navbar has a new **Blog** link; nav anchors updated to `/#how`, `/#agents`, etc. so they work from any route.
- Uses `react-markdown` + `remark-gfm` for content rendering and `@tailwindcss/typography` for reading typography.
- **Image upload for blog covers** wired via **fal.ai storage** (`POST /api/admin/upload`, X-Admin-Token protected, 8 MB limit, image/* only). Admin form now has a drag-and-drop cover uploader that hits fal.ai and stores the returned CDN URL. `FAL_KEY` lives in `/app/backend/.env`.
  - **⚠ Note**: fal.ai account is currently at *zero balance* — top up at https://fal.ai/dashboard/billing to enable uploads. Auth, validation and dropzone are all working; only the outbound fal.ai call is blocked by balance.
- Admin token stored in `/app/backend/.env` as `ADMIN_TOKEN=uplaud-admin-c9f7e2a1` — user should rotate this in production.


## What's Implemented (updated 2026-02-13 v14 — Growth Activation Platform reframe)
- **Narrative reframe from feature-first → outcome-first**. Positioning: *"The operating system for customer-led growth"*. Two connected loops:
  1. **Growth Activation** (pre-customer): Interactions + Conversation Intelligence
  2. **Customer Advocacy** (post-customer): Reviews + Referrals
  Both feed into **Amplification** (Social + Reddit) and roll up to a **Growth Engine** dashboard.
- **Rebranded mocked workspace**: Westgate Wealth → **PayRewards** (B2B payments platform; card-earned rewards on vendor bills; acquires via Meta + Google ads). New personas: Rohan Sethi @ Blueprint Robotics, Marcus Beltran @ Halo Skincare, Sara Kim @ Trellis SaaS, James Wu @ Kettle & Fire Coffee, etc.
- **Sidebar restructured** into 5 sections with hint labels:
  - Growth Engine → Overview (rebuilt Insights page)
  - Growth Activation (Pre-customer) → **Interactions**, **Conversations** *(both new)*
  - Customer Advocacy (Post-customer) → Reviews & Feedback, Referrals
  - Amplification → Social Agent, Reddit Agent
  - Data → Import
  - Settings
- **NEW `/business/insights` — Growth Engine dashboard**: "Where should I focus next" opportunity cards on top, 9-stage journey funnel (Ad Clicked → Advocates) with opportunity pills, KPI grid (interactions, stories, warm intros, posts, pipeline, CAC), trend chart, channel attribution, executive recommendation.
- **NEW `/business/interactions`** — table of 10 lifecycle interactions (demo/trial/webinar/onboarding/CS/QBR) with activation status (pending → prompt_sent → feedback_received → story_drafted → awaiting_approval → approved → amplified), summary tiles, filters, drawer with 4 suggested activation actions.
- **NEW `/business/conversations`** — Conversation Intelligence pillar. 5 sources (Zoom AI, Gong, Fireflies, Fathom, HubSpot). 7 mocked conversations with AI-extracted signals (motivations, pain points, buying signals, objections, customer language, product feedback, FAQs). **Customer approval flow** for drafted stories: Draft → Sent for approval → Approved → Amplified. Different action buttons appear based on status.
- **Import page** now shows **dual source columns** (Conversations + Customer feedback) and reframed messaging.
- **Login page copy** refreshed: "The operating system for customer-led growth." · Growth Engine preview panel.
- **Landing navbar** link renamed "Sign in" → "Log in" (both desktop + mobile).
- Preserved: Reviews table + drawer, Social Agent, Referral Agent, Reddit Agent, Settings — all working with new PayRewards data.
- **Testing status**: `iteration_7.json` — 100% frontend flows pass; hydration warning from Social Agent `<option>` fixed with explicit `label` attribute.



## What's Implemented (updated 2026-02-13 v13 — Product MVP Dashboard UI)
- **Business Dashboard MVP** — frontend-only, mocked (no backend calls added). Vertical showcased: **Fintech / Wealth Management** (Westgate Wealth).
- Route entry `/business` → **Login page** (mocked auth via localStorage `uplaud_business_auth_v1`). Any email/password accepted. Pre-filled: `hello@westgate.finance` / `demo1234`.
- After login → zero-state redirect to `/business/import` (first time), or `/business/insights` if `uplaud_business_imported_v1` is true.
- **DashboardLayout** — 248px sidebar with sections (Overview / Ingest / Agents) + workspace switcher, topbar with search, "New campaign", notifications, user avatar, logout.
- **6 modules**:
  1. **Import Reviews** (`/business/import`) — dropzone with animated progressive import, 5 review sources (Google, Trustpilot, Yelp, App Store, CSV), success state + navigation to Insights/Reviews.
  2. **Reviews** (`/business/reviews`) — filterable table of 12 mocked reviews + Review Drawer with agentic recommendations (Social/Referral/Reddit/Attribution agents) with confidence bars.
  3. **Social Post Agent** (`/business/social`) — composer with source-review picker, platform (LinkedIn/X/Instagram), tone chips, live preview card, post queue with status pills, generate/schedule/publish actions.
  4. **Referral Agent** (`/business/referrals`) — 3 campaigns list, funnel stats, auto-drafted per-reviewer WhatsApp/email messages, campaign builder modal.
  5. **Reddit Agent** (`/business/reddit`) — query + preset chips, 4 opportunity threads with match scores, reply composer anchored to a real review, guardrails card.
  6. **Insights** (`/business/insights`) — 6 KPI cards, SVG trend chart, funnel visualisation, channel attribution table, "Apply recommendation" CTA.
  7. **Settings** (`/business/settings`) — profile, notifications toggles, integrations list, "Reset workspace" for demo cycling.
- **Landing Navbar** now has a subtle "Sign in" link that routes to `/business`.
- All mocked data lives in `/app/frontend/src/mocks/fintech.js`. Auth/state helpers in `/app/frontend/src/lib/business-storage.js`.
- **Testing status**: `iteration_6.json` — 100% frontend flows passed after routing fix (React Router v7 splat vs exact-path conflict resolved by converting `/business/*` wrapper to a pathless layout route).


## Backlog / Next
- Rotate the admin token.
- Optional: add image upload (currently cover_image is a URL you paste).
- Optional: SEO metadata per post (og:image, description).
- **Rebuilt for the right audience & the right brand.** Copy simplified for education, healthcare, legal and pet care operators (no jargon, no "Trust Graph" language, no MarTech-speak).
- **Exact Uplaud brand palette** pulled from live uplaud.ai CSS: purple `#6D46C6`, deep purple `#261c4d`, mint `#5EEAD4`, black `#111827`, white. Buttons are clean solid purple with mint hover accents; no more emerald or violet-shine gradients.
- **Hero rewritten to be punchy & benefit-first**: "More reviews. More referrals. More customers." + a 2-line subhead naming patients / parents / clients / pet parents. Four vertical chips visible directly under the CTAs.
- **Page structure simplified** to 9 sections: Nav → Hero → Trust bar (industry categories, not review platforms) → Ads-vs-Uplaud pain comparison → 3-step How it works (was 5) → Powered-by-AI dark section (single headline, no stat cluster) → 6-card product grid → 3 big-number results on deep purple → FAQ (6 short Qs) → Book-a-demo (light bg, mint+lavender halo) → Footer.
- **Loops section removed** (too abstract for this audience). "AI Engine" simplified to a single dark statement.
- Backend unchanged. Resend + Mongo flow still verified.

## Backlog / Next
- P1: Verify `uplaud.ai` in Resend and switch `SENDER_EMAIL` to `noreply@uplaud.ai`.
- P2: Embed Cal.com after success state so form → booked call in one step.
- P2: SEO/OG image, sitemap.xml, robots.txt.
- P2: Add a per-vertical hero variant swap (Education / Healthcare / Legal / Pet care) with tailored review examples in the hero visual.
- P3: PostHog event tracking on CTAs & FAQ opens.

## Test Credentials
None required. Landing page has no auth.
