# Uplaud Growth Engine — PRD

## Original Problem Statement
Building the Uplaud Growth Engine product; prioritizing a demo for PayRewards' Marketing & Sales team (www.payrewards.com). UI reference: https://ai-acquisition-hub-2.preview.emergentagent.com/business/insights. Wire the backend to make it customer-ready.

Phase 1 features:
1. Login
2. Sources tab: upload a client demo call transcript (.txt / word / pdf)
3. Growth Signals: generate insights from the transcript; auto-generate a testimonial draft from the highest-sentiment client comments; Edit Draft; Send to Customer (opens a pre-drafted email editor with attachment).

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Routes under `/api`. JWT (Bearer) auth. File parsing via python-docx & pypdf. LLM via `emergentintegrations` LlmChat → OpenAI **gpt-5.5** using the customer's own `OPENAI_API_KEY`.
- **Frontend**: React 19 + Tailwind + shadcn/ui. Routes: `/login`, `/business/insights` (protected). Auth token in localStorage (`uplaud_token`). Brand: Cabinet Grotesk headings / Inter body, indigo palette.

## User Personas
- Marketing/Sales leader at PayRewards (demo persona: David Cameron, Head of Marketing) turning demo-call conversations into testimonials & growth signals.

## Core Requirements (static)
- Secure login; upload transcripts; AI insights + testimonial draft; edit & email to customer.

## Implemented (2026-07-22)
- JWT email/password auth, seeded demo user (dcameron@payrewards.com), `/api/auth/login`, `/api/auth/me`.
- Sources: upload+parse .txt/.docx/.pdf (`POST /api/sources`), list (`GET /api/sources`), get one.
- Growth Signals: `POST /api/sources/{id}/analyze` → GPT-5.5 structured insights (company/speaker/AE, sentiment_label, signal_score 0-100, call_type, motivations, pain_points, buying_signals, objections, customer_language, product_feedback, faqs) + testimonial draft.
- Edit draft (`PUT /api/sources/{id}/testimonial`); email draft generator (`GET /api/sources/{id}/email-draft`).

### UI integration (2026-07-22) — user's real GitHub UI wired to backend
- Adopted the user's actual frontend from GitHub (UplaudAI/UplaudProduction @ Emergent) wholesale into /app/frontend (CRA+craco+Tailwind). Added deps: react-markdown, remark-gfm, react-fast-marquee, @tailwindcss/typography.
- Wired 3 pages to the backend WITHOUT rebuilding UI:
  - BusinessLoginPage (/business): real JWT login via /api/auth/login, token stored in localStorage `uplaud_business_auth_v1`.
  - ImportReviewsPage (/business/import): dropzone now uploads a real transcript → /api/sources then /api/sources/{id}/analyze, drives progress + success, routes to Growth Signals.
  - ConversationsPage (/business/conversations): fetches GET /api/sources, maps to conversation shape; AI-extracted signals grid + drafted testimonial render from real data. Edit draft (PUT), Regenerate/Draft (analyze), Copy wired. "Send for customer approval" opens the pre-filled email composer (DEMO no-op).
- Verified 100% via testing agent iteration_2 (7/7 backend, all E2E flows).
- NOTE: Other business pages (Insights, Reviews, ROI, Referrals, Social, Reddit, Interactions, Settings) remain MOCK-driven and are out of scope for phase 1.

### Public Testimonial Page + share assets (2026-07-22)
- Public, no-auth page at `/t/{share_id}` (TestimonialPage.jsx): customer sees the drafted testimonial, can Edit (PUT /api/public/testimonial/{share_id}) and Approve (POST .../approve). Edit locks (400) after approval.
- On approval, the page reveals branded, PayRewards-styled (navy #0B1F3A + gold #E8B84B) social assets — LinkedIn (1200×800) + Instagram (1080×1080) cards rendered via CSS and exported with html-to-image. Share via LinkedIn / X / device share tray (Web Share API), plus Download PNG and Copy link (with clipboard fallback).
- Internal: "Send for customer approval" now calls POST /api/sources/{id}/send-approval (persists status draft→sent, returns share_id) and the pre-drafted email body includes the `/t/{share_id}` approval link. Customer approval reflects back as `approved` in Growth Signals (Amplify action). send-approval no longer regresses an approved testimonial.
- Verified via testing agent iteration_3 (12/12 backend, all E2E). Branded backgrounds generated for reference.

## Backlog / Remaining
- **P1**: Real email sending (Resend/SendGrid) + PDF conversation-summary attachment generation (currently email is in-app editor only, no real send).
- **P1**: Object storage for uploaded files so original transcript can be attached.
- **P2**: Better client name/email capture on upload; multi-user accounts & registration.
- **P2**: Live KPI dashboard data (currently illustrative static numbers).
- **P2**: Streaming insight generation UI; testimonial approval workflow.

## Next Tasks
- Confirm demo with PayRewards; decide on real email provider for phase 2.
