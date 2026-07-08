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

## What's Implemented (2026-12-08)
- Fully composed marketing page:
  Navbar (sticky, glass on scroll, mobile menu) → Hero (asymmetric, animated card stack) → TrustBar (Marquee of review sources) → PainPoint (data-driven stats) → **TrustGraph (dark AI section with custom Canvas node network)** → HowItWorks (bento 5-step) → Loops (2 acquisition loops) → FeatureGrid (6 product capabilities) → Outcomes (big-number metrics) → FAQ (Shadcn accordion) → LeadForm (dark, Resend-backed) → Footer (giant brand mark)
- Backend endpoints:
  - `GET /api/` health
  - `POST /api/leads` — validates payload, sends transactional HTML email to `deepthi@uplaud.ai` via Resend, persists to `db.leads` in MongoDB as backup, returns status `sent` or `saved`.
- Resend integration wired with user's API key; sender is `onboarding@resend.dev` until `uplaud.ai` domain is verified in Resend.
- Sonner toasts for success/error, native HTML5 validation on required fields.
- data-testid on every interactive element.

## Backlog / Next
- P1: Verify `uplaud.ai` domain in Resend and switch `SENDER_EMAIL` to `noreply@uplaud.ai`.
- P1: Replace native required-field tooltip with sonner error toast (add `noValidate` to form) — LOW priority UX polish flagged by testing agent.
- P2: Add a `/thanks` route or inline calendar embed (Cal.com / Calendly) after a lead is captured.
- P2: Add SEO metadata (OG image, sitemap.xml, robots.txt) and canonical tags.
- P2: Add per-vertical variants (e.g. `/for/sat-prep`) once user picks a beachhead vertical.
- P3: Add lightweight admin view at `/leads` (protected) to browse persisted leads.
- P3: Instrument PostHog events on CTA clicks and form submits.

## Test Credentials
None required. Landing page has no auth.
