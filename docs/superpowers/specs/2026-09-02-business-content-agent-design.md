# Business Content Agent Design

## Goal

Create a logged-in CRM feature that generates high-quality, SEO/AEO-ready blog posts and case studies from public research plus a business's approved customer trust data. The system should use authoritative public sources to build useful articles around real buyer questions, then use reviews, Growth Signals, reviewer metadata, referral signals, and business profile context as proprietary evidence that makes the content more specific and defensible. Businesses can review, edit, approve, publish, unpublish, or archive the content. Published content appears on the public business page and detail pages.

This replaces the current request-time story generation model for public case studies. Runtime stitching is not acceptable for publication-quality articles.

## Product Surface

Add a CRM feature behind the existing business login:

- Route: `/business/content`
- Left nav label: `Content Agent`
- Section: `Amplification`, next to Growth Amplification
- Access: same authenticated business CRM guard used by the other `/business/*` routes

The first version should be useful without adding billing enforcement in code. It should be structured as a paid feature so plan gating can be added later with a single feature flag or entitlement check.

## User Workflow

1. A business opens `Content Agent` from the CRM left nav.
2. The page lists generated content drafts for the active business.
3. Each item shows:
   - Title
   - Buyer question
   - Content type: case study, review roundup, FAQ, comparison, or buyer guide
   - Status: draft, needs review, approved, published, archived
   - SEO score
   - AEO score
   - Source review count
   - Last updated date
4. The business can generate a new draft from available approved reviews and Growth Signals.
5. The system creates a draft asynchronously or through a long-running request.
6. A review agent scores and revises the article before it becomes visible as `needs review`.
7. The business can preview, edit, approve, publish, unpublish, or archive.
8. Published posts appear on `/business/public/:slug` and detail pages.

## Data Model

Use a new persisted content table rather than overloading `Blog_Posts`.

Recommended Airtable table: `Content_Posts`

Fields:

- `Business` text
- `Business_Slug` text
- `Title` text
- `Slug` text
- `Meta_Description` long text
- `Buyer_Question` text
- `Content_Type` single select: `Case Study`, `Review Roundup`, `FAQ`, `Comparison`, `Buyer Guide`
- `Content_HTML` long text
- `Excerpt` long text
- `Status` single select: `draft`, `needs_review`, `approved`, `published`, `archived`
- `Content_Brief_JSON` long text
- `Research_Packet_JSON` long text
- `Source_Review_IDs` long text or linked records
- `Source_Signal_IDs` long text or linked records
- `SEO_Score` number
- `AEO_Score` number
- `Quality_Score` number
- `Quality_Report_JSON` long text
- `Reviewer_Notes` long text
- `Schema_JSON` long text
- `Published_At` datetime
- `Updated_At` datetime
- `Created_At` datetime

Status meaning:

- `draft`: generated but not quality-gated
- `needs_review`: passed automated review and is ready for business review
- `approved`: business approved but not public
- `published`: visible on public business pages
- `archived`: hidden from CRM default list and public surfaces

## Backend Architecture

Add a content module with clear boundaries. The operating model should follow the installed `$blog` skill's agent methodology and quality gates:

- `content_sources`: gathers approved Uplaud reviews, Growth Signals, reviewer metadata, and referral context for the current business
- `blog-researcher`: performs public research, SERP/context research, and source collection using tier 1-3 sources only
- `blog-brief`: chooses a buyer question, template, search intent, source reviews, and outline
- `blog-writer`: drafts a structured article from the brief, research packet, and proprietary review evidence
- `blog-seo`: validates title, meta description, headings, schema, entity clarity, and internal links
- `blog-reviewer`: scores quality, SEO, AEO/GEO readiness, repetition, evidence use, and AI-slop risk
- `blog-rewrite`: revises the draft using reviewer feedback until it clears the threshold or exhausts attempts
- `content_repository`: reads and writes `Content_Posts`

The generator should be asynchronous-friendly. The first implementation can run in a single API request with a timeout-safe path, but the service boundary should allow a queued worker later.

The implementation should not re-invent a weaker content rubric. It should encode the `$blog` skill's methodology as the Content Agent's contract: answer-first formatting, quality scoring, SEO/AEO checks, schema requirements, and anti-pattern rejection.

## Generation Inputs

For each business, the generator should gather:

- Business name, slug, category, tagline/about fields if available
- Public research on the product category, buyer problem, competitor context, and current market language
- Tier 1-3 external sources with URLs, source names, dates, and claim summaries
- Approved Uplaud reviews
- Review source and rating
- Reviewer name, role, company, LinkedIn, Instagram when available
- Growth Signals from transcripts
- Circles/referral count and matching referred reviewers
- Public business URL
- Existing published content to avoid duplicate topics

The generator must not invent unsupported facts, metrics, or claims. It can synthesize themes from reviews, but any factual claim must trace back to a source review, Growth Signal, business profile field, or approved external source.

Reviews should not be the whole article. Reviews are proprietary proof points that sharpen a broader, useful article. The public research should carry the educational value, and the reviews should provide differentiated first-party signal: actual customer language, caveats, repeated outcomes, and credible examples.

## Content Requirements

Every generated article should:

- Answer one real buyer question
- Use public research to provide context beyond Uplaud's own review corpus
- Use a clear H1 title and H2/H3 hierarchy
- Open with an answer-first summary
- Include a short TL;DR box
- Interlace testimonials as evidence blocks, not raw concatenation
- Include reviewer attribution when available
- Mention caveats when reviews include them
- Avoid repetitive review snippets
- Avoid generic AI phrasing
- Include 3-5 FAQ items when appropriate
- Include JSON-LD in the server-rendered HTML source
- Keep paragraphs under 150 words
- Produce a meta description
- Produce a canonical slug

Representative buyer questions:

- `Is {Business} worth it for {use case}?`
- `What do customers like most about {Business}?`
- `Who is {Business} best for?`
- `What problems does {Business} solve for customers?`
- `What should buyers know before choosing {Business}?`

## Quality Gate

Minimum publishable score: `80`.

The content reviewer must score:

- Content quality
- SEO readiness
- AEO/GEO readiness
- Public research quality
- Evidence quality
- Repetition
- Tone and readability
- Structured data completeness

Hard failures:

- Fabricated statistics
- Unsupported claims
- Missing public research for non-trivial buyer guides, comparisons, or category articles
- Tier 4-5 sources used as authority
- Repetitive stitched reviews
- Paragraphs over 150 words
- Missing buyer question
- Missing evidence blocks
- Missing meta description
- Missing schema
- Artificial, childish, or generic prose

If the score is below 80, the system should revise and rescore. If it still fails after the configured attempts, save as `draft` with reviewer notes instead of exposing it for publication.

## API Design

Business-authenticated endpoints:

- `GET /api/business/content`
  - List content posts for the authenticated business.
- `POST /api/business/content/generate`
  - Generate a new draft from current trust data.
  - Request body can include optional `content_type`, `buyer_question`, and `source_review_ids`.
  - Generation output should persist `Content_Brief_JSON`, `Research_Packet_JSON`, `Quality_Report_JSON`, and `Schema_JSON`.
- `GET /api/business/content/{slug}`
  - Fetch a single draft/post for preview or editing.
- `PUT /api/business/content/{slug}`
  - Update title, slug, meta description, content HTML, status, or notes.
- `POST /api/business/content/{slug}/publish`
  - Publish the post.
- `POST /api/business/content/{slug}/unpublish`
  - Move back to approved.
- `POST /api/business/content/{slug}/archive`
  - Archive the post.

Public endpoints:

- `GET /api/business/public/{business_slug}/content`
  - List published content for the public business page.
- `GET /api/business/public/{business_slug}/content/{content_slug}`
  - Fetch one published post.

Existing public case-study URLs can keep working as aliases during migration:

- `/business/public/:slug/blog/:contentSlug`

## Public Rendering

The public business page should show published content from `Content_Posts`, not generated runtime story cards.

The article detail page should render:

- Title
- Meta description/excerpt
- Buyer question
- Content HTML
- Source testimonial callouts
- Last updated date
- Schema JSON-LD
- Links back to the business profile and related reviews

Server-rendered HTML must include the article content and JSON-LD so Google, ChatGPT, Claude, Perplexity, and other crawlers can read it without JavaScript.

## CRM UI

Add `frontend/src/pages/business/ContentAgentPage.jsx`.

Primary states:

- Empty state: explain that approved reviews and Growth Signals power content generation.
- Loading state: show skeleton rows.
- List state: show content cards or table rows with status, score, and actions.
- Detail/preview state: render article preview with source evidence.
- Generation state: show progress and disable duplicate generation.
- Error state: show recoverable API error.

Core actions:

- Generate draft
- Preview
- Edit metadata/body
- Publish
- Unpublish
- Archive

Avoid large marketing hero sections. This is an operational CRM surface.

## Migration Plan

Phase 1:

- Add `Content_Posts` repository helpers.
- Add business content API endpoints.
- Add CRM nav and `Content Agent` page.
- Generate persisted draft content from public research plus existing reviews/signals.
- Publish selected content to public business page.

Phase 2:

- Add queued/background generation.
- Add richer editorial calendar.
- Add plan entitlement gating.
- Add richer image sourcing and visual/chart generation.
- Add refresh/update workflow for stale posts.

Phase 3:

- Add analytics for content views, clicks, referrals, and AI crawler hits.
- Add repurposing into LinkedIn, X, email, and Reddit drafts.
- Add per-industry content templates.

## Testing

Backend tests:

- Content generation creates one persisted post from multiple reviews.
- Content generation persists public research packets and does not rely only on reviews.
- Review agent rejects stitched/repetitive content.
- Review agent rejects unsourced claims and low-quality sources.
- Publish endpoint only exposes `published` posts publicly.
- Unpublished/archived posts do not appear on public pages.
- Public detail endpoint includes content HTML and schema JSON.
- Source review IDs are preserved.
- Business auth prevents cross-business access.

Frontend tests/build:

- `/business/content` route renders behind `DashboardLayout`.
- Left nav includes `Content Agent`.
- Content list displays status, scores, buyer question, and actions.
- Publish/unpublish/archive actions call the correct endpoints.
- Production build passes.

Manual verification:

- Generate a draft for `aifiesta`.
- Confirm the article answers one buyer question.
- Confirm testimonials are not repetitive or stitched together.
- Confirm public page shows only published posts.
- Confirm HTML source contains article text and JSON-LD.

## Open Implementation Notes

- The first version should avoid adding runtime latency to public pages.
- The public page can temporarily fall back to legacy runtime story cards only when no published content exists.
- The generator should keep all prompt instructions server-side.
- The CRM should expose reviewer notes so a business understands why a draft is not publishable.
