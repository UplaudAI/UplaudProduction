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

## What's Implemented (updated 2026-12-09)
- **Full brand refresh v2**: swapped from emerald/black to Uplaud violet palette (`#6d28d9`, `#7c3aed`, `#a78bfa`), added tasteful gradient shine on headings & CTAs, pill-shaped buttons.
- **Real logo** now used in navbar and footer (purple circle mark).
- **Fonts**: Bricolage Grotesque (headings, rounded/contemporary, matches logo) + Inter (body) + JetBrains Mono (accents).
- **Hero rewritten with PAS framework**: opens with "Dear growth-obsessed founder", pain hook "You're spending $2 to earn $1 on cold ads", then pivots to the solution + mechanism (WhatsApp + Trust Graph) + 30-day timeframe.
- **WhatsApp** integrated as the core capture mechanism throughout (matches live uplaud.ai positioning).
- **Pain section rebuilt**: "Dear founder," + 3 pain questions + old-way vs Uplaud-way side-by-side + stat row.
- Stripped em dashes across the copy per landing-page copywriting guidance.
- All 13 sections retained: Navbar → Hero → TrustBar → PainPoint (v2) → TrustGraph (violet nodes) → HowItWorks (WhatsApp-first) → Loops → FeatureGrid → Outcomes → FAQ (+ new WhatsApp Q) → LeadForm → Footer.

## Backlog / Next
- P1: Verify `uplaud.ai` in Resend and switch `SENDER_EMAIL` to `noreply@uplaud.ai`.
- P2: Add a `/thanks` route or embed Cal.com after form submit.
- P2: SEO metadata (OG image, sitemap, robots.txt).
- P3: Add PostHog event tracking on CTA clicks & form submits.
- P3: Consider a vertical picker chip in the hero so visitors can self-select (SAT prep / law firm / dentist / ecommerce) and see 1-2 tailored copy swaps.

## Test Credentials
None required. Landing page has no auth.
