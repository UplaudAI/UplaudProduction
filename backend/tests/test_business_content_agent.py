import asyncio
from pathlib import Path
import sys
import types

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

try:
    import airtable_client
except ModuleNotFoundError as exc:
    if exc.name != "httpx":
        raise
    sys.modules["httpx"] = types.SimpleNamespace(AsyncClient=object)
    import airtable_client

import server


@pytest.fixture()
def client():
    server.app.dependency_overrides.clear()
    with TestClient(server.app) as test_client:
        yield test_client
    server.app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers():
    return {"Authorization": "Bearer local-test-token"}


@pytest.fixture()
def authenticated_business():
    async def fake_current_user(request: server.Request):
        return {
            "id": "user_1",
            "email": "owner@aifiesta.ai",
            "name": "Owner",
            "role": "business",
            "company": "AI Fiesta",
            "approved": True,
            "selected_brand_domain": "aifiesta.ai",
        }

    server.app.dependency_overrides[server.get_current_user] = fake_current_user
    return fake_current_user


def _record(record_id="rec_content", **field_overrides):
    fields = {
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
        "Research_Packet_JSON": "{\"sources\":[{\"name\":\"Public source\"}]}",
        "Source_Review_IDs": "rec1,rec2",
        "Source_Signal_IDs": "sig1, sig2",
        "SEO_Score": 82,
        "AEO_Score": 84,
        "Quality_Score": 86,
        "Quality_Report_JSON": "{\"score\":86}",
        "Schema_JSON": "{\"@context\":\"https://schema.org\"}",
        "Published_At": "",
        "Updated_At": "2026-09-02T20:00:00Z",
        "Created_At": "2026-09-02T20:00:00Z",
    }
    fields.update(field_overrides)
    return {"id": record_id, "createdTime": "2026-09-02T20:00:00Z", "fields": fields}


def _publishable_post(**overrides):
    post = airtable_client.record_to_content_post(_record(Status="published"))
    post.update(overrides)
    return post


def test_business_content_list_requires_authenticated_business(client):
    response = client.get("/api/business/content")

    assert response.status_code in {401, 403}


def test_business_content_list_returns_posts_for_authenticated_business(
    monkeypatch, client, auth_headers, authenticated_business
):
    async def fake_business_slug(current, request):
        return "aifiesta"

    async def fake_list(business_slug, include_archived=False, published_only=False):
        assert business_slug == "aifiesta"
        assert include_archived is False
        assert published_only is False
        return [_publishable_post(status="needs_review")]

    monkeypatch.setattr(server, "resolve_current_business_slug", fake_business_slug)
    monkeypatch.setattr(airtable_client, "list_content_posts_airtable", fake_list)

    response = client.get("/api/business/content", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["posts"][0]["business_slug"] == "aifiesta"


def test_business_content_generate_persists_generated_post_for_business(
    monkeypatch, client, auth_headers, authenticated_business
):
    async def fake_business_slug(current, request):
        return "aifiesta"

    async def fake_generate(business_slug, request):
        assert business_slug == "aifiesta"
        assert request.content_type == "Case Study"
        return _publishable_post(
            status="needs_review",
            slug="generated-post",
            content_type=request.content_type,
            buyer_question=request.buyer_question,
        )

    async def fake_create(post):
        assert post["business_slug"] == "aifiesta"
        assert post["slug"] == "generated-post"
        return post

    monkeypatch.setattr(server, "resolve_current_business_slug", fake_business_slug)
    monkeypatch.setattr(server, "generate_content_article", fake_generate)
    monkeypatch.setattr(airtable_client, "create_content_post_airtable", fake_create)

    response = client.post(
        "/api/business/content/generate",
        headers=auth_headers,
        json={"content_type": "Case Study", "buyer_question": "Is AI Fiesta worth it?"},
    )

    assert response.status_code == 200
    assert response.json()["slug"] == "generated-post"
    assert response.json()["status"] == "needs_review"


def test_business_content_get_fetches_post_for_business(monkeypatch, client, auth_headers, authenticated_business):
    async def fake_business_slug(current, request):
        return "aifiesta"

    async def fake_get(business_slug, slug, published_only=False):
        assert business_slug == "aifiesta"
        assert slug == "post-slug"
        assert published_only is False
        return _publishable_post(slug=slug, status="needs_review")

    monkeypatch.setattr(server, "resolve_current_business_slug", fake_business_slug)
    monkeypatch.setattr(airtable_client, "get_content_post_airtable", fake_get)

    response = client.get("/api/business/content/post-slug", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["slug"] == "post-slug"


def test_business_content_update_sends_allowed_fields_for_business(
    monkeypatch, client, auth_headers, authenticated_business
):
    async def fake_business_slug(current, request):
        return "aifiesta"

    async def fake_update(business_slug, slug, updates):
        assert business_slug == "aifiesta"
        assert slug == "post-slug"
        assert updates == {"title": "Updated title", "reviewer_notes": "Ready"}
        return _publishable_post(slug=slug, title=updates["title"], reviewer_notes=updates["reviewer_notes"])

    monkeypatch.setattr(server, "resolve_current_business_slug", fake_business_slug)
    monkeypatch.setattr(airtable_client, "update_content_post_airtable", fake_update)

    response = client.put(
        "/api/business/content/post-slug",
        headers=auth_headers,
        json={"title": "Updated title", "reviewer_notes": "Ready"},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated title"


def test_publish_marks_content_published_for_business(monkeypatch, client, auth_headers, authenticated_business):
    async def fake_business_slug(current, request):
        return "aifiesta"

    async def fake_update(business_slug, slug, updates):
        assert business_slug == "aifiesta"
        assert updates["status"] == "published"
        assert updates["published_at"]
        return {"slug": slug, "business_slug": business_slug, "status": "published", "title": "Post"}

    monkeypatch.setattr(server, "resolve_current_business_slug", fake_business_slug)
    monkeypatch.setattr(airtable_client, "update_content_post_airtable", fake_update)
    response = client.post("/api/business/content/post-slug/publish", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "published"


def test_business_content_unpublish_marks_content_approved_for_business(
    monkeypatch, client, auth_headers, authenticated_business
):
    async def fake_business_slug(current, request):
        return "aifiesta"

    async def fake_update(business_slug, slug, updates):
        assert business_slug == "aifiesta"
        assert updates == {"status": "approved", "published_at": ""}
        return {"slug": slug, "business_slug": business_slug, "status": "approved", "title": "Post"}

    monkeypatch.setattr(server, "resolve_current_business_slug", fake_business_slug)
    monkeypatch.setattr(airtable_client, "update_content_post_airtable", fake_update)

    response = client.post("/api/business/content/post-slug/unpublish", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_business_content_archive_marks_content_archived_for_business(
    monkeypatch, client, auth_headers, authenticated_business
):
    async def fake_business_slug(current, request):
        return "aifiesta"

    async def fake_update(business_slug, slug, updates):
        assert business_slug == "aifiesta"
        assert updates == {"status": "archived"}
        return {"slug": slug, "business_slug": business_slug, "status": "archived", "title": "Post"}

    monkeypatch.setattr(server, "resolve_current_business_slug", fake_business_slug)
    monkeypatch.setattr(airtable_client, "update_content_post_airtable", fake_update)

    response = client.post("/api/business/content/post-slug/archive", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "archived"


def test_public_content_lists_only_published(monkeypatch, client):
    async def fake_list(business_slug, include_archived=False, published_only=False):
        assert business_slug == "aifiesta"
        assert include_archived is False
        assert published_only is True
        return [_publishable_post(slug="published-post", status="published", title="Published")]

    monkeypatch.setattr(airtable_client, "list_content_posts_airtable", fake_list)

    response = client.get("/api/business/public/aifiesta/content")

    assert response.status_code == 200
    body = response.json()
    assert body["posts"][0]["slug"] == "published-post"
    assert body["posts"][0]["status"] == "published"


def test_public_content_get_returns_only_published_post(monkeypatch, client):
    async def fake_get(business_slug, content_slug, published_only=False):
        assert business_slug == "aifiesta"
        assert content_slug == "published-post"
        assert published_only is True
        return _publishable_post(slug="published-post", status="published", title="Published")

    monkeypatch.setattr(airtable_client, "get_content_post_airtable", fake_get)

    response = client.get("/api/business/public/aifiesta/content/published-post")

    assert response.status_code == 200
    assert response.json()["slug"] == "published-post"
    assert response.json()["status"] == "published"


def test_public_content_html_contains_article_and_schema(monkeypatch, client):
    async def fake_get(business_slug, content_slug, published_only=False):
        assert business_slug == "aifiesta"
        assert content_slug == "published-post"
        assert published_only is True
        return _publishable_post(
            slug="published-post",
            status="published",
            title="Published AI Fiesta Guide",
            meta_description="A published AI Fiesta buyer guide.",
            buyer_question="Is AI Fiesta worth it?",
            content_html="<article><h1>Published AI Fiesta Guide</h1><p>Answer first for buyers.</p></article>",
            schema={"@context": "https://schema.org", "@type": "Article", "headline": "Published AI Fiesta Guide"},
            updated_at="2026-09-02T20:00:00Z",
        )

    monkeypatch.setattr(airtable_client, "get_content_post_airtable", fake_get)

    response = client.get("/business/public/aifiesta/blog/published-post")

    assert response.status_code == 200
    assert "Published AI Fiesta Guide" in response.text
    assert "Answer first for buyers." in response.text
    assert 'type="application/ld+json"' in response.text
    assert '"@type": "Article"' in response.text


def test_public_content_html_sanitizes_dangerous_markup(monkeypatch, client):
    async def fake_get(business_slug, content_slug, published_only=False):
        return _publishable_post(
            slug="published-post",
            status="published",
            title="Published AI Fiesta Guide",
            content_html=(
                '<article><h1 onclick="alert(1)">Guide</h1>'
                '<script>alert("xss")</script>'
                '<p>Useful content.</p>'
                '<a href="javascript:alert(1)">Bad link</a></article>'
            ),
            schema={"@context": "https://schema.org", "@type": "Article", "headline": "Guide"},
        )

    monkeypatch.setattr(airtable_client, "get_content_post_airtable", fake_get)

    response = client.get("/business/public/aifiesta/blog/published-post")

    assert response.status_code == 200
    assert "<script>alert" not in response.text
    assert "onclick=" not in response.text
    assert "javascript:alert" not in response.text
    assert "<p>Useful content.</p>" in response.text


def test_public_content_html_preserves_legacy_case_study_fallback(monkeypatch, client):
    async def fake_get(business_slug, content_slug, published_only=False):
        assert published_only is True
        return None

    async def fake_case_studies(business_slug):
        assert business_slug == "aifiesta"
        return {
            "case_studies": [
                {
                    "slug": "legacy-story",
                    "title": "Legacy customer story",
                    "excerpt": "A generated public case study from reviews.",
                    "body_html": "<p>Legacy story body.</p>",
                    "published": "2026-09-02",
                }
            ]
        }

    monkeypatch.setattr(airtable_client, "get_content_post_airtable", fake_get)
    monkeypatch.setattr(server, "get_public_case_studies", fake_case_studies)

    response = client.get("/business/public/aifiesta/blog/legacy-story")

    assert response.status_code == 200
    assert "Legacy customer story" in response.text
    assert "Legacy story body." in response.text
    assert 'type="application/ld+json"' in response.text


def test_record_to_content_post_maps_quality_and_research_fields():
    post = airtable_client.record_to_content_post(_record())

    assert post["business_slug"] == "aifiesta"
    assert post["status"] == "needs_review"
    assert post["quality_score"] == 86
    assert post["source_review_ids"] == ["rec1", "rec2"]
    assert post["source_signal_ids"] == ["sig1", "sig2"]
    assert post["content_brief"]["template"] == "case-study"


def test_record_to_content_post_returns_empty_dict_for_invalid_json_fields():
    post = airtable_client.record_to_content_post(
        _record(
            Content_Brief_JSON="{bad",
            Research_Packet_JSON="[]",
            Quality_Report_JSON="",
            Schema_JSON="{bad",
        )
    )

    assert post["content_brief"] == {}
    assert post["research_packet"] == {}
    assert post["quality_report"] == {}
    assert post["schema"] == {}


def test_content_post_to_fields_serializes_json_and_source_ids():
    fields = airtable_client._content_post_to_fields(
        _publishable_post(
            content_brief={"template": "case-study"},
            research_packet={"sources": [{"name": "Source"}]},
            source_review_ids=["rec1", "rec2"],
            source_signal_ids=["sig1"],
            quality_report={"score": 86},
            schema={"@context": "https://schema.org"},
        )
    )

    assert fields["Content_Brief_JSON"] == '{"template": "case-study"}'
    assert fields["Research_Packet_JSON"] == '{"sources": [{"name": "Source"}]}'
    assert fields["Source_Review_IDs"] == "rec1,rec2"
    assert fields["Source_Signal_IDs"] == "sig1"
    assert fields["Schema_JSON"] == '{"@context": "https://schema.org"}'


def test_content_post_to_fields_rejects_invalid_published_posts():
    with pytest.raises(ValueError, match="quality_score must be at least 80"):
        airtable_client._content_post_to_fields(_publishable_post(quality_score=79))

    with pytest.raises(ValueError, match="schema is required"):
        airtable_client._content_post_to_fields(_publishable_post(schema={}))


def test_list_content_posts_uses_content_posts_table_and_filters_archived(monkeypatch):
    calls = []

    async def fake_get(table, params):
        calls.append((table, params))
        return {"records": [_record(Status="archived")]}

    monkeypatch.setattr(airtable_client, "_get", fake_get)

    posts = asyncio.run(airtable_client.list_content_posts_airtable("aifiesta"))

    assert posts == []
    assert calls[0][0] == airtable_client.TABLE_CONTENT_POSTS
    assert '{Status}!="archived"' in calls[0][1]["filterByFormula"]


def test_list_content_posts_published_only_filters_quality_in_formula_and_after_mapping(monkeypatch):
    async def fake_get(table, params):
        assert table == airtable_client.TABLE_CONTENT_POSTS
        assert '{Status}="published"' in params["filterByFormula"]
        assert "{Quality_Score}>=80" in params["filterByFormula"]
        return {
            "records": [
                _record("rec_good", Status="published", Quality_Score=86),
                _record("rec_low", Status="published", Quality_Score=60),
                _record("rec_no_schema", Status="published", Schema_JSON=""),
            ]
        }

    monkeypatch.setattr(airtable_client, "_get", fake_get)

    posts = asyncio.run(airtable_client.list_content_posts_airtable("aifiesta", published_only=True))

    assert [post["id"] for post in posts] == ["rec_good"]


def test_get_content_post_published_only_filters_quality_in_formula_and_after_mapping(monkeypatch):
    async def fake_get(table, params):
        assert table == airtable_client.TABLE_CONTENT_POSTS
        assert '{Status}="published"' in params["filterByFormula"]
        assert "{Quality_Score}>=80" in params["filterByFormula"]
        return {"records": [_record(Status="published", Quality_Score=86, Schema_JSON="")]}

    monkeypatch.setattr(airtable_client, "_get", fake_get)

    post = asyncio.run(airtable_client.get_content_post_airtable("aifiesta", "is-ai-fiesta-worth-it", published_only=True))

    assert post is None


def test_create_content_post_uses_content_posts_table_and_serialized_fields(monkeypatch):
    calls = []

    async def fake_create(table, fields):
        calls.append((table, fields))
        return _record(**fields)

    monkeypatch.setattr(airtable_client, "_create", fake_create)

    post = asyncio.run(airtable_client.create_content_post_airtable(_publishable_post()))

    assert post["status"] == "published"
    assert calls[0][0] == airtable_client.TABLE_CONTENT_POSTS
    assert calls[0][1]["Research_Packet_JSON"] == '{"sources": [{"name": "Public source"}]}'


def test_create_content_post_raises_for_invalid_published_post():
    with pytest.raises(ValueError, match="meta_description is required"):
        asyncio.run(airtable_client.create_content_post_airtable(_publishable_post(meta_description="")))


def test_update_content_post_looks_up_by_business_and_slug_then_updates_content_posts(monkeypatch):
    calls = []

    async def fake_get(table, params):
        calls.append(("get", table, params))
        return {"records": [_record(Status="needs_review")]}

    async def fake_update(table, record_id, fields):
        calls.append(("update", table, record_id, fields))
        return _record(record_id, **fields)

    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(airtable_client, "_update", fake_update)

    post = asyncio.run(
        airtable_client.update_content_post_airtable(
            "aifiesta",
            "is-ai-fiesta-worth-it",
            {"status": "published", "schema": {"@context": "https://schema.org"}},
        )
    )

    assert post["status"] == "published"
    assert calls[0][1] == airtable_client.TABLE_CONTENT_POSTS
    assert 'LOWER({Business_Slug})="aifiesta"' in calls[0][2]["filterByFormula"]
    assert 'LOWER({Slug})="is-ai-fiesta-worth-it"' in calls[0][2]["filterByFormula"]
    assert calls[1][1] == airtable_client.TABLE_CONTENT_POSTS
    assert calls[1][2] == "rec_content"
    assert "Created_At" not in calls[1][3]


def test_update_content_post_raises_for_invalid_published_update(monkeypatch):
    async def fake_get(table, params):
        return {"records": [_record(Status="needs_review")]}

    monkeypatch.setattr(airtable_client, "_get", fake_get)

    with pytest.raises(ValueError, match="content_html is required"):
        asyncio.run(
            airtable_client.update_content_post_airtable(
                "aifiesta",
                "is-ai-fiesta-worth-it",
                {"status": "published", "content_html": ""},
            )
        )


def test_gather_content_sources_returns_reviews_and_growth_signals(monkeypatch):
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

    sources = asyncio.run(server.gather_content_sources("aifiesta"))

    assert sources["business"]["name"] == "AI Fiesta"
    assert sources["reviews"][0]["id"] == "rec1"
    assert sources["growth_signals"][0]["id"] == "sig1"


def test_gather_content_sources_queries_growth_signals_with_airtable_business_name(monkeypatch):
    queried_names = []

    async def fake_public_page_payload(slug):
        return {
            "business": {
                "name": "AI Fiesta",
                "slug": "aifiesta",
                "airtable_business_name": "AI Fiesta Inc.",
            },
            "reviews": [],
            "stats": {},
        }

    async def fake_signals(business_name):
        queried_names.append(business_name)
        return []

    monkeypatch.setattr(server, "public_page_payload", fake_public_page_payload)
    monkeypatch.setattr(airtable_client, "list_growth_signals_by_business", fake_signals)

    asyncio.run(server.gather_content_sources("aifiesta"))

    assert queried_names == ["AI Fiesta Inc."]


def test_gather_content_sources_queries_growth_signals_with_business_name_fallback(monkeypatch):
    queried_names = []

    async def fake_public_page_payload(slug):
        return {
            "business": {"name": "AI Fiesta", "slug": "aifiesta"},
            "reviews": [],
            "stats": {},
        }

    async def fake_signals(business_name):
        queried_names.append(business_name)
        return []

    monkeypatch.setattr(server, "public_page_payload", fake_public_page_payload)
    monkeypatch.setattr(airtable_client, "list_growth_signals_by_business", fake_signals)

    asyncio.run(server.gather_content_sources("aifiesta"))

    assert queried_names == ["AI Fiesta"]


def test_gather_content_sources_raises_404_for_missing_public_business(monkeypatch):
    async def fake_public_page_payload(slug):
        return None

    monkeypatch.setattr(server, "public_page_payload", fake_public_page_payload)

    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(server.gather_content_sources("missing"))

    assert exc.value.status_code == 404


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


def test_content_quality_gate_rejects_low_scores():
    article = {"quality_score": 79, "status": "needs_review"}

    status = server.content_status_from_quality(article)

    assert status == "draft"


def test_content_quality_gate_rejects_hard_failures():
    article = {
        "quality_score": 91,
        "quality_report": {"hard_failures": ["missing public research"]},
    }

    status = server.content_status_from_quality(article)

    assert status == "draft"


def test_generate_content_article_rewrites_once_when_quality_score_is_low(monkeypatch):
    sources = {
        "business": {"name": "AI Fiesta", "slug": "aifiesta", "category": "AI productivity"},
        "reviews": [{"id": "rec1", "reviewer_name": "Anand", "text": "Model comparison helped.", "rating": 5}],
        "growth_signals": [{"id": "sig1", "pain_points": ["hard to compare model outputs"]}],
    }
    responses = [
        '{"sources":[{"name":"Google Search Central","url":"https://developers.google.com/search","tier":1,"claim":"Helpful content should serve readers."}]}',
        '{"title":"Is AI Fiesta worth it for comparing AI models?","slug":"is-ai-fiesta-worth-it","excerpt":"A research-backed guide.","meta_description":"AI Fiesta reviews and public research show who benefits most from model comparison workflows.","content_html":"<article><h1>Is AI Fiesta worth it?</h1><p>Answer first.</p></article>","faq":[{"question":"Who is it for?","answer":"Teams comparing model outputs."}],"source_attribution":[{"name":"Google Search Central","url":"https://developers.google.com/search"}],"seo_score":78,"aeo_score":77}',
        '{"quality_score":79,"seo_score":78,"aeo_score":77,"reviewer_notes":"Needs stronger evidence.","quality_report":{"score":79}}',
        '{"title":"Is AI Fiesta worth it for comparing AI models?","slug":"is-ai-fiesta-worth-it","excerpt":"A stronger research-backed guide.","meta_description":"AI Fiesta reviews and public research show who benefits most from model comparison workflows.","content_html":"<article><h1>Is AI Fiesta worth it?</h1><p>Answer first with public research and customer evidence.</p></article>","faq":[{"question":"Who is it for?","answer":"Teams comparing model outputs."}],"source_attribution":[{"name":"Google Search Central","url":"https://developers.google.com/search"}],"seo_score":84,"aeo_score":85}',
        '{"quality_score":86,"seo_score":84,"aeo_score":85,"reviewer_notes":"Ready for review.","quality_report":{"score":86}}',
    ]
    prompts = []

    async def fake_sources(slug):
        return sources

    def fake_call(system, user, temperature=0.2):
        prompts.append(user)
        return responses.pop(0)

    async def fake_research_call(user):
        prompts.append(user)
        return server._parse_json(responses.pop(0))

    monkeypatch.setattr(server, "openai_client", object())
    monkeypatch.setattr(server, "gather_content_sources", fake_sources)
    monkeypatch.setattr(server, "_call_openai", fake_call)
    monkeypatch.setattr(server, "_call_content_research_json", fake_research_call)

    request = server.ContentGenerateRequest(
        content_type="Case Study",
        buyer_question="Is AI Fiesta worth it for comparing AI models?",
        source_review_ids=["rec1"],
    )

    article = asyncio.run(server.generate_content_article("aifiesta", request))

    assert article["status"] == "needs_review"
    assert article["quality_score"] == 86
    assert article["content_brief"]["buyer_question"] == "Is AI Fiesta worth it for comparing AI models?"
    assert article["source_review_ids"] == ["rec1"]
    assert article["source_signal_ids"] == ["sig1"]
    assert article["schema"]["@type"] == "BlogPosting"
    assert any("rewrite" in prompt.lower() for prompt in prompts)


def test_generate_content_article_uses_search_and_reviewer_score_is_authoritative(monkeypatch):
    sources = {
        "business": {"name": "AI Fiesta", "slug": "aifiesta", "category": "AI productivity"},
        "reviews": [{"id": "rec1", "reviewer_name": "Anand", "text": "Model comparison helped.", "rating": 5}],
        "growth_signals": [],
    }
    responses = [
        '{"title":"Is AI Fiesta worth it?","slug":"is-ai-fiesta-worth-it","excerpt":"A guide.","meta_description":"AI Fiesta reviews and public research for buyers comparing AI model workflows.","content_html":"<article><h1>Is AI Fiesta worth it?</h1><p>TL;DR: It helps buyers compare AI models.</p></article>","faq":[],"source_attribution":[{"name":"Google Search Central","url":"https://developers.google.com/search"}],"seo_score":91,"aeo_score":92,"quality_score":99}',
        '{"quality_score":0,"seo_score":0,"aeo_score":0,"reviewer_notes":"Unsupported.","quality_report":{"score":0,"hard_failures":["unsupported claims"]}}',
        '{"title":"Is AI Fiesta worth it?","slug":"is-ai-fiesta-worth-it","excerpt":"A revised guide.","meta_description":"AI Fiesta reviews and public research for buyers comparing AI model workflows.","content_html":"<article><h1>Is AI Fiesta worth it?</h1><p>TL;DR: It helps buyers compare AI models.</p></article>","faq":[],"source_attribution":[{"name":"Google Search Central","url":"https://developers.google.com/search"}],"seo_score":82,"aeo_score":83}',
        '{"quality_score":0,"seo_score":0,"aeo_score":0,"reviewer_notes":"Still unsupported.","quality_report":{"score":0,"hard_failures":["unsupported claims"]}}',
    ]
    search_calls = []

    async def fake_sources(slug):
        return sources

    def fake_search(prompt):
        search_calls.append(prompt)
        return '{"sources":[{"name":"Google Search Central","url":"https://developers.google.com/search","tier":1,"claim":"Helpful content should serve readers."}]}'

    def fake_call(system, user, temperature=0.2):
        return responses.pop(0)

    monkeypatch.setattr(server, "openai_client", object())
    monkeypatch.setattr(server, "gather_content_sources", fake_sources)
    monkeypatch.setattr(server, "_call_openai_web_search", fake_search)
    monkeypatch.setattr(server, "_call_openai", fake_call)

    request = server.ContentGenerateRequest(
        content_type="Case Study",
        buyer_question="Is AI Fiesta worth it?",
        source_review_ids=["rec1"],
    )

    article = asyncio.run(server.generate_content_article("aifiesta", request))

    assert search_calls
    assert article["status"] == "draft"
    assert article["quality_score"] == 0
    assert article["quality_report"]["hard_failures"] == ["unsupported claims"]
