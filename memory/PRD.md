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

## What's Implemented (updated 2026-12-09 v3)
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
