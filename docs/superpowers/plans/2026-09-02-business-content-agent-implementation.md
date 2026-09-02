# Business Content Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a logged-in CRM Content Agent at `/business/content` that generates, reviews, persists, publishes, and publicly renders SEO/AEO-ready articles from public research plus Uplaud review evidence.

**Architecture:** Add a persisted `Content_Posts` repository and business-authenticated API surface, then connect it to a CRM page and the public business content section. The generator follows the installed `$blog` methodology: research packet, content brief, writer, SEO check, reviewer scorecard, rewrite loop, schema JSON, and publish gating.

**Tech Stack:** FastAPI, Airtable, OpenAI chat completions, React, React Router, existing `api` Axios client, existing `DashboardLayout`.

**Spec:** `docs/superpowers/specs/2026-09-02-business-content-agent-design.md`

## Global Constraints

- Add CRM route `/business/content` behind the existing business login.
- Add left-nav item labeled `Content Agent`.
- Use a new persisted Airtable table named `Content_Posts`.
- Public research provides the article backbone; Uplaud reviews and Growth Signals provide proprietary evidence.
- Follow `$blog` quality gates: answer-first formatting, TL;DR, quality scoring, SEO/AEO checks, schema requirements, and anti-pattern rejection.
- Minimum publishable score is `80`.
- Do not fabricate statistics, metrics, quotes, sources, or claims.
- Public pages must render published content and JSON-LD in server HTML, not only client-side JavaScript.
- Keep legacy `/business/public/:slug/blog/:contentSlug` URLs working.

---

## File Structure

- Modify `backend/airtable_client.py`
  - Add `Content_Posts` repository helpers.
- Modify `backend/server.py`
  - Add request/response models, content-source gathering, generation/review functions, business content API routes, public content routes, and server-rendered public article HTML.
- Create `backend/tests/test_business_content_agent.py`
  - Unit and route coverage for generation, persistence, quality gate, publish visibility, and public rendering.
- Modify `frontend/src/App.js`
  - Add `/business/content` CRM route.
- Modify `frontend/src/components/business/DashboardLayout.jsx`
  - Add `Content Agent` to the left nav.
- Create `frontend/src/pages/business/ContentAgentPage.jsx`
  - CRM list/generate/preview/publish module.
- Modify `frontend/src/components/business/CaseStudies.jsx`
  - Prefer persisted published content from the new public endpoint.
- Modify `frontend/src/pages/CaseStudyPage.jsx`
  - Render persisted content detail, preserving legacy route path.

---

### Task 1: Content_Posts Repository

**Files:**
- Modify: `backend/airtable_client.py`
- Test: `backend/tests/test_business_content_agent.py`

**Interfaces:**
- Produces:
  - `record_to_content_post(rec: dict) -> dict`
  - `list_content_posts_airtable(business_slug: str, include_archived: bool = False, published_only: bool = False) -> list`
  - `get_content_post_airtable(business_slug: str, slug: str, published_only: bool = False) -> Optional[dict]`
  - `create_content_post_airtable(post: dict) -> Optional[dict]`
  - `update_content_post_airtable(business_slug: str, slug: str, updates: dict) -> Optional[dict]`

- [ ] **Step 1: Write failing repository mapping test**

```python
def test_record_to_content_post_maps_quality_and_research_fields():
    rec = {
        "id": "rec_content",
        "createdTime": "2026-09-02T20:00:00Z",
        "fields": {
            "Business": "AI Fiesta",
            "Business_Slug": "aifiesta",
            "Title": "Is AI Fiesta worth it for comparing AI models?",
            "Slug": "is-ai-fiesta-worth-it",
            "Meta_Description": "AI Fiesta reviews and public research show who benefits most from model comparison workflows.",
            "Buyer_Question": "Is AI Fiesta worth it for comparing AI models?",
            "Content_Type": "Case Study",
            "Content_HTML": "<article><p>Answer first.</p></article>",
            "Excerpt": "A research-backed buyer guide.",
            "Status": "needs_review",
            "Content_Brief_JSON": "{\"template\":\"case-study\"}",
            "Research_Packet_JSON": "{\"sources\":[]}",
            "Source_Review_IDs": "rec1,rec2",
            "Source_Signal_IDs": "sig1",
            "SEO_Score": 82,
            "AEO_Score": 84,
            "Quality_Score": 86,
            "Quality_Report_JSON": "{\"score\":86}",
            "Schema_JSON": "{\"@context\":\"https://schema.org\"}",
            "Published_At": "",
            "Updated_At": "2026-09-02T20:00:00Z",
            "Created_At": "2026-09-02T20:00:00Z",
        },
    }

    post = airtable_client.record_to_content_post(rec)

    assert post["business_slug"] == "aifiesta"
    assert post["status"] == "needs_review"
    assert post["quality_score"] == 86
    assert post["source_review_ids"] == ["rec1", "rec2"]
    assert post["content_brief"]["template"] == "case-study"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/Users/Apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m pytest backend/tests/test_business_content_agent.py::test_record_to_content_post_maps_quality_and_research_fields -q`

Expected: FAIL because `record_to_content_post` does not exist.

- [ ] **Step 3: Implement repository mapping and Airtable helpers**

Add `TABLE_CONTENT_POSTS = "Content_Posts"` and mapping helpers in `backend/airtable_client.py`. Store JSON fields as strings in Airtable, parse them on read, and tolerate invalid JSON by returning `{}`.

- [ ] **Step 4: Run repository tests**

Run: `/Users/Apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m pytest backend/tests/test_business_content_agent.py -q`

Expected: PASS for repository tests.

- [ ] **Step 5: Commit**

```bash
git add backend/airtable_client.py backend/tests/test_business_content_agent.py
git commit -m "Add content post repository"
```

---

### Task 2: Content Source Gathering

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_business_content_agent.py`

**Interfaces:**
- Consumes:
  - `public_uplaud_records_by_slug(slug: str)`
  - `public_reviews_from_records(business: dict, records: list) -> list`
  - `airtable_client.list_growth_signals_by_business(business_name: str)`
- Produces:
  - `async gather_content_sources(business_slug: str) -> dict`

- [ ] **Step 1: Write failing source-gathering test**

```python
async def test_gather_content_sources_returns_reviews_and_growth_signals(monkeypatch):
    async def fake_public_page_payload(slug):
        return {
            "business": {"name": "AI Fiesta", "slug": "aifiesta", "category": "AI productivity"},
            "reviews": [{"id": "rec1", "text": "Model comparison helped us choose.", "rating": 5}],
            "stats": {"avg_rating": 5.0, "total_reviews": 1},
        }

    async def fake_signals(business_name):
        return [{"id": "sig1", "pain_points": ["hard to compare model outputs"], "company_name": "Fintrail"}]

    monkeypatch.setattr(server, "public_page_payload", fake_public_page_payload)
    monkeypatch.setattr(airtable_client, "list_growth_signals_by_business", fake_signals)

    sources = await server.gather_content_sources("aifiesta")

    assert sources["business"]["name"] == "AI Fiesta"
    assert sources["reviews"][0]["id"] == "rec1"
    assert sources["growth_signals"][0]["id"] == "sig1"
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL because `gather_content_sources` does not exist.

- [ ] **Step 3: Implement `gather_content_sources`**

Use `public_page_payload` for business/review data, then call `list_growth_signals_by_business` with `business["airtable_business_name"] or business["name"]`. Raise `404` if the public business payload is missing.

- [ ] **Step 4: Run tests**

Expected: PASS for source gathering.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_business_content_agent.py
git commit -m "Gather sources for content agent"
```

---

### Task 3: Research, Brief, Writer, Reviewer, and Schema Engine

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_business_content_agent.py`

**Interfaces:**
- Produces:
  - `build_content_research_prompt(sources: dict, request: dict) -> str`
  - `build_content_writer_prompt(sources: dict, research_packet: dict, brief: dict) -> str`
  - `build_content_reviewer_prompt(article: dict, sources: dict) -> str`
  - `build_content_schema(post: dict, business: dict, canonical_url: str) -> dict`
  - `async generate_content_article(business_slug: str, request: ContentGenerateRequest) -> dict`

- [ ] **Step 1: Write failing prompt contract tests**

```python
def test_content_writer_prompt_requires_public_research_and_review_evidence():
    sources = {
        "business": {"name": "AI Fiesta", "slug": "aifiesta"},
        "reviews": [{"id": "rec1", "reviewer_name": "Anand", "text": "Model comparison helped.", "rating": 5}],
        "growth_signals": [],
    }
    research = {"sources": [{"name": "Google Search Central", "url": "https://developers.google.com/search"}]}
    brief = {"buyer_question": "Is AI Fiesta worth it for comparing AI models?", "template": "case-study"}

    prompt = server.build_content_writer_prompt(sources, research, brief)

    assert "public research" in prompt.lower()
    assert "proprietary review evidence" in prompt.lower()
    assert "do not stitch reviews together" in prompt.lower()
    assert "TL;DR" in prompt
```

- [ ] **Step 2: Write failing reviewer gate test**

```python
def test_content_quality_gate_rejects_low_scores():
    article = {"quality_score": 79, "status": "needs_review"}

    status = server.content_status_from_quality(article)

    assert status == "draft"
```

- [ ] **Step 3: Run tests to verify failures**

Expected: FAIL because prompt builders and gate helpers do not exist.

- [ ] **Step 4: Implement deterministic helpers and OpenAI orchestration**

Implement JSON-only OpenAI calls using existing `_call_openai` and `_parse_json`. The generation flow should:

1. Build public research prompt.
2. Ask for `Research_Packet_JSON` with tier 1-3 sources.
3. Build a content brief with buyer question, selected reviews, outline, and target keyword.
4. Draft article HTML, title, excerpt, meta description, FAQ, and source attribution.
5. Review using `$blog` scoring categories.
6. If score is below 80, run one rewrite pass and review again.
7. Return `status="needs_review"` only when final score is at least 80; otherwise `status="draft"`.

- [ ] **Step 5: Run tests**

Expected: prompt and quality-gate tests pass. OpenAI calls should be mocked in tests.

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_business_content_agent.py
git commit -m "Add content agent generation engine"
```

---

### Task 4: Business Content API

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_business_content_agent.py`

**Interfaces:**
- Consumes:
  - `get_current_business_context(request: Request) -> dict` or existing auth helper equivalent
  - `generate_content_article`
  - `airtable_client` content repository helpers
- Produces routes:
  - `GET /api/business/content`
  - `POST /api/business/content/generate`
  - `GET /api/business/content/{slug}`
  - `PUT /api/business/content/{slug}`
  - `POST /api/business/content/{slug}/publish`
  - `POST /api/business/content/{slug}/unpublish`
  - `POST /api/business/content/{slug}/archive`

- [ ] **Step 1: Write failing route tests**

```python
def test_business_content_list_requires_authenticated_business(client):
    response = client.get("/api/business/content")
    assert response.status_code in {401, 403}
```

```python
def test_publish_marks_content_published_for_business(monkeypatch, client, auth_headers):
    async def fake_update(business_slug, slug, updates):
        assert business_slug == "aifiesta"
        assert updates["Status"] == "published"
        assert updates["Published_At"]
        return {"slug": slug, "business_slug": business_slug, "status": "published", "title": "Post"}

    monkeypatch.setattr(airtable_client, "update_content_post_airtable", fake_update)
    response = client.post("/api/business/content/post-slug/publish", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "published"
```

- [ ] **Step 2: Run tests to verify failures**

Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement models and routes**

Add Pydantic models for generate/update requests and content post responses. Use the existing authenticated business context pattern from other business CRM endpoints. Enforce business slug isolation on every content route.

- [ ] **Step 4: Run route tests**

Expected: PASS for business content routes.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_business_content_agent.py
git commit -m "Add business content API"
```

---

### Task 5: Public Published Content API and SSR HTML

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_business_content_agent.py`

**Interfaces:**
- Produces:
  - `GET /api/business/public/{business_slug}/content`
  - `GET /api/business/public/{business_slug}/content/{content_slug}`
  - server HTML for `/business/public/{business_slug}/blog/{content_slug}`

- [ ] **Step 1: Write failing public visibility tests**

```python
async def test_public_content_lists_only_published(monkeypatch):
    async def fake_list(business_slug, include_archived=False, published_only=False):
        assert published_only is True
        return [{"slug": "published-post", "status": "published", "title": "Published"}]

    monkeypatch.setattr(airtable_client, "list_content_posts_airtable", fake_list)
    response = client.get("/api/business/public/aifiesta/content")

    assert response.status_code == 200
    assert response.json()["posts"][0]["slug"] == "published-post"
```

```python
def test_public_content_html_contains_article_and_schema(monkeypatch):
    # Mock published content detail and assert response.text includes Content_HTML and application/ld+json.
```

- [ ] **Step 2: Run tests to verify failures**

Expected: FAIL because public content routes/HTML do not exist.

- [ ] **Step 3: Implement public endpoints and HTML renderer**

Keep `/business/public/:slug/blog/:contentSlug` as the public detail URL. For published persisted content, render saved `Content_HTML` and `Schema_JSON` in server HTML. If no persisted content is found, retain the legacy generated story fallback during migration.

- [ ] **Step 4: Run tests**

Expected: PASS for public content visibility and SSR HTML tests.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_business_content_agent.py
git commit -m "Publish content agent posts publicly"
```

---

### Task 6: CRM Content Agent Page and Nav

**Files:**
- Modify: `frontend/src/App.js`
- Modify: `frontend/src/components/business/DashboardLayout.jsx`
- Create: `frontend/src/pages/business/ContentAgentPage.jsx`

**Interfaces:**
- Consumes:
  - `GET /api/business/content`
  - `POST /api/business/content/generate`
  - `POST /api/business/content/{slug}/publish`
  - `POST /api/business/content/{slug}/unpublish`
  - `POST /api/business/content/{slug}/archive`

- [ ] **Step 1: Add route and nav tests if the current frontend test harness supports component tests**

Expected behaviors:

```javascript
expect(screen.getByTestId("nav-content-agent")).toHaveTextContent("Content Agent");
expect(screen.getByTestId("content-agent-page")).toBeInTheDocument();
```

- [ ] **Step 2: Implement route and nav**

Import `ContentAgentPage` in `frontend/src/App.js`, add route `/business/content` inside `DashboardLayout`, and add a `Content Agent` nav item under `Amplification` using a suitable Lucide icon such as `Newspaper` or `FileText`.

- [ ] **Step 3: Implement page**

Use the existing CRM visual language: dense operational cards/table, no large hero. Include Generate Draft, Preview, Publish, Unpublish, Archive actions. Show empty, loading, list, and error states.

- [ ] **Step 4: Build frontend**

Run: `PATH=/Users/Apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH DISABLE_ESLINT_PLUGIN=true ./node_modules/.bin/craco build` from `frontend`.

Expected: Compiled successfully.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.js frontend/src/components/business/DashboardLayout.jsx frontend/src/pages/business/ContentAgentPage.jsx
git commit -m "Add CRM content agent page"
```

---

### Task 7: Public Business Page Integration

**Files:**
- Modify: `frontend/src/components/business/CaseStudies.jsx`
- Modify: `frontend/src/pages/CaseStudyPage.jsx`
- Test: frontend build

**Interfaces:**
- Consumes:
  - `GET /api/business/public/{business_slug}/content`
  - `GET /api/business/public/{business_slug}/content/{content_slug}`

- [ ] **Step 1: Update public stories section data fetch**

`CaseStudies.jsx` should fetch persisted published content first. If the new endpoint returns no posts, it can display existing `case_studies` fallback from the page payload.

- [ ] **Step 2: Update detail page fetch**

`CaseStudyPage.jsx` should fetch the persisted public content endpoint first and fall back to the legacy case-study endpoint if needed.

- [ ] **Step 3: Verify route compatibility**

Confirm `/business/public/aifiesta/blog/ai-fiesta-reviewer-story-1` still loads. Confirm a persisted post slug also loads at the same route shape.

- [ ] **Step 4: Build frontend**

Run frontend build.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/business/CaseStudies.jsx frontend/src/pages/CaseStudyPage.jsx
git commit -m "Show published content on public business pages"
```

---

### Task 8: End-to-End Verification

**Files:**
- No code changes unless verification finds bugs.

- [ ] **Step 1: Run backend tests**

Run: `/Users/Apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m pytest backend/tests/test_business_content_agent.py backend/tests/test_public_business_pages.py -q`

If local pytest is unavailable, record the dependency blocker and run `PYTHONPYCACHEPREFIX=/tmp/uplaud-pycache python3 -m py_compile backend/server.py backend/airtable_client.py backend/tests/test_business_content_agent.py`.

- [ ] **Step 2: Run frontend build**

Run frontend production build.

- [ ] **Step 3: Manual smoke test with local server if feasible**

Check:

- `/business/content` renders behind login.
- Generate draft produces `needs_review` or `draft` with quality report.
- Publish changes status to `published`.
- `/business/public/:slug` shows the published article.
- `/business/public/:slug/blog/:contentSlug` renders article HTML and schema.

- [ ] **Step 4: Final commit if verification fixes were needed**

```bash
git add <fixed-files>
git commit -m "Verify content agent workflow"
```
