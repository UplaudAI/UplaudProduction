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
- Growth Signals: `POST /api/sources/{id}/analyze` → GPT-5.5 structured insights (summary, key themes, sentiment score/overview, highlights, pain points, buying signals) + testimonial draft.
- Edit draft (`PUT /api/sources/{id}/testimonial`); email draft generator (`GET /api/sources/{id}/email-draft`).
- Frontend: branded login, app shell (sidebar + header), Overview/KPI dashboard, Sources drag-drop upload, Growth Signals insights + testimonial card with Edit Draft & Send-to-Customer email composer.
- Verified 100% via testing agent (7/7 backend, all frontend flows).

## Backlog / Remaining
- **P1**: Real email sending (Resend/SendGrid) + PDF conversation-summary attachment generation (currently email is in-app editor only, no real send).
- **P1**: Object storage for uploaded files so original transcript can be attached.
- **P2**: Better client name/email capture on upload; multi-user accounts & registration.
- **P2**: Live KPI dashboard data (currently illustrative static numbers).
- **P2**: Streaming insight generation UI; testimonial approval workflow.

## Next Tasks
- Confirm demo with PayRewards; decide on real email provider for phase 2.
