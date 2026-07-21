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


## What's Implemented (updated 2026-02-13 v19 — ROI Simulator for PayRewards board deck)
- **NEW `/business/roi-simulator`** — a Status Quo vs With Uplaud side-by-side projection tool built for the PayRewards demo.
  - **Sidebar entry** added under `Business Impact` between Growth Overview and Warm Pipeline (nav-roi test id, Calculator icon).
  - **11 editable inputs** across two groups:
    - *Your paid engine today*: demos attended/mo, demo→customer %, paid CAC, ACV, gross margin, annual retention.
    - *Uplaud lift assumptions*: capture rate, approval rate, intros per testimonial, warm→customer, Uplaud CAC.
  - **Live model** recomputes every metric on any change: monthly customers, new ARR/yr, blended CAC, LTV/CAC, payback (months).
  - **Two comparison cards** side-by-side: Status Quo (calm grey) vs With Uplaud (mint gradient · shadow · Sparkles). Uplaud card also surfaces testimonials/mo, warm intros/mo, Uplaud-sourced customers/mo.
  - **Boardroom deltas table** with sq → up + delta chip (+customers, +ARR, -CAC%, +LTV/CAC, -payback months).
  - **"Ready for slide 3"** dark purple summary card with 3 headline stats and a one-line narrative (`+$X ARR · +N customers · Y% lower CAC`), plus **Copy summary** button that writes a slide-paste-ready block to clipboard.
  - **Reset to PayRewards defaults** button in the toolbar.
- **Testing status**: Smoke-tested end-to-end via screenshot tool. Editing an input from 641 → 1,200 demos live-updated deltas from +246 → +460 customers and +$4.52M → +$8.46M ARR. Copy button fired sonner toast confirming clipboard write.


## What's Implemented (updated 2026-02-13 v18 — Editable funnel + insight tips + IA reorder)
- **Growth Overview redesigned to feel calmer and more designed**:
  - Value Chain preserved (already redesigned in v17)
  - **New editable funnel**: click "Edit funnel" → every stage's People count becomes an editable input. Conversion percentages recalc live so a demo can plug in PayRewards' real numbers.
  - **Per-stage Uplaud tip** on every funnel row (Lightbulb icon + actionable insight). Examples: *"Move the incentive AFTER the referral campaign launch — historically lifts feedback-share by 22%"*, *"Send approval reminder Day 3. 68% of eventual approvals happen on the 3-day nudge"*.
- **Sidebar reorder**: `Growth Signals` moved ABOVE `Untapped Opportunities` under Pre-Customer Growth.
- **Conversation detail reorder**: the drafted customer testimonial block now renders **above** the AI-extracted signals grid (CSS `order` on flex-col section).
- **Tests**: compile clean, funnel edit-mode + input change smoke-tested successfully.



## What's Implemented (updated 2026-02-13 v17 — Modern UX + Funnel + Warm Pipeline agentic + IA polish)
- **Value Chain reimagined as modern product UI**: numbered nodes on a gradient rail (purple → mint), conversion pills below each stage, calm bordered outcome bar. No more hand-drawn feel.
- **Sophisticated funnel is back**: colour-coded by phase (Acquisition/Activation/Pipeline/Revenue/Advocacy), trapezoidal bars with inline conversion %, delta chips on the right, opportunity annotations, and a phase legend footer.
- **Sidebar IA polish**:
  - **Business Impact**: Growth Overview · Warm Pipeline
  - Pre-Customer Growth: Untapped Opportunities · **Growth Signals** (renamed from Customer Signals)
  - Post-Customer Advocacy: Trust Assets
  - Amplification: **Growth Amplification** (renamed from Testimonial Amplification) · High-Intent Demand
  - Data: Sources
- **Warm Pipeline evolutions**:
  - Closed-won leads no longer appear (they're customers, shown as a small counter chip on the section header)
  - Leads sorted by **urgency + potential value** (custom score: stage weight × 100 + hotness × 60 + spend/20k)
  - New **"Agentic actions awaiting approval"** panel — top 5 leads with a per-lead one-click Approve / Skip flow (drafted by Uplaud)
- **Growth Signals** page:
  - **Latest customer-approved testimonial** section at the top as the key takeaway (with "Amplify across channels" and "Seed referral campaign" CTAs)
  - Themes section **moved out** to Growth Amplification
  - **"Connect a source"** button added on the section header
- **Growth Amplification** page:
  - Renamed
  - Live preview now shows **all 3 platforms side-by-side**: LinkedIn (text post), **Instagram Reel** (visual gradient card with punch quote), **X** (short punchy post)
  - Themes moved here (they belong to amplification — turning buyer language into ads)
- **Testing status**: all 4 major flow checkpoints (Overview, Warm Pipeline, Growth Signals, Growth Amplification) verified via smoke test.



## What's Implemented (updated 2026-02-13 v16 — Value-chain + Intelligent NBAs + Warm Leads)
- **Value Chain visualisation replaces the dense "388" text block** on Overview. Renders as a 6-stage horizontal flow (Demos attended → Testimonials extracted → Approved → Referral campaigns → Warm leads → New customers) with conversion pills between stages and a bottom outcome bar showing **$284k attributed revenue · CAC $186 vs $1,204 paid baseline (-84.6%)**. Every stage is a countable, HubSpot-traceable number.
- **Intelligent Next Best Actions**. Each page's NBA now shows **rationale** (3 signal bullets), **segmentation** (which specific cohort) and **projected outcome** with numbers. Example on Overview: *"76 of your 253 unactivated demo attendees match every high-conversion signal: monthly vendor spend ≥ $200k, positive sentiment on call, 1+ PayRewards customer in their LinkedIn network. Segment & launch to 76 →"*.
- **Warm Pipeline page rebuilt around real leads**. New `WARM_LEADS` mock (8 named leads) with:
  - Referrer (which customer sent them) + relationship + testimonial link
  - Campaign (Refer-a-Controller / CFO Cohort / Healthcare CFO)
  - Stage (New → Clicked → Booked → Demoed → Negotiation → Converted / Cold)
  - Fit score (0–1)
  - **Enrichment**: LinkedIn URL, recent activity (funding raised, milestones), company metrics (ARR, growth), buying signals
  - Suggested next actions per lead
- **Lead drawer** shows full profile, referrer, campaign, enrichment (Company · Monthly spend · Recent activity · Buying signals) + suggested actions + "Open in HubSpot" primary CTA.
- All other pages retain their functionality but now use the intelligent NBA pattern.
- New reusable `PageHero` supports both `valueChain` (Overview) and `northStar` (other pages) + `smartAction` (rationale + outcome).
- **Testing status**: smoke test passes for value chain, smart NBAs on all 7 pages, warm leads table + drawer. No compile errors.



## What's Implemented (updated 2026-02-13 v15 — Executive-outcome design pivot)
- **Design philosophy pivot**: every dashboard page now leads with one **executive question + one North Star metric + one recommended action** (business-outcome first, not feature-first).
- **New `PageHero` component** (`/app/frontend/src/components/business/PageHero.jsx`) — reusable, exposes `page-hero`, `page-hero-question`, `page-hero-northstar-value`, `page-hero-action-cta` test IDs. Used on all 8 dashboard pages.
- **Sidebar renamed to outcome-focused labels**:
  - Business Impact → **Growth Overview**
  - Pre-Customer Growth → **Untapped Opportunities**, **Customer Signals**
  - Post-Customer Advocacy → **Trust Assets**, **Warm Pipeline**
  - Amplification → **Story Amplification**, **High-Intent Demand**
  - Data → **Sources**
- **Topbar simplified**: no search, no "New campaign" button, no notification dot. Just title + bell + avatar.
- **Growth Overview rebuilt from scratch**: PageHero ("How much business value has Uplaud created?" · $1.42M influenced revenue) + two stacked loop cards (Pre-Customer $531k + Post-Customer $887k) each showing 6 stages and CAC. Removed KPI grid, trend chart, and attribution table — replaced with subtle "Explore attribution" link.
- **Customer Signals (Conversations) rebuilt**: leads with 3 aggregated theme cards (buyer language, value framing, addressable objection) with lift metrics and one clear action each. Individual conversations moved into a secondary "Explore" section below.
- All other pages retain their existing functionality but now lead with the outcome hero. Every page answers its executive question in under 5 seconds.
- **Testing status**: `iteration_8.json` — 100% flows pass, zero bugs. Unused DashboardLayout imports (Search, Plus) cleaned up post-report.



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
