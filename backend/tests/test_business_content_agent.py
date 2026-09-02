import asyncio
from pathlib import Path
import sys
import types

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

try:
    import airtable_client
except ModuleNotFoundError as exc:
    if exc.name != "httpx":
        raise
    sys.modules["httpx"] = types.SimpleNamespace(AsyncClient=object)
    import airtable_client

import server


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

    monkeypatch.setattr(server, "openai_client", object())
    monkeypatch.setattr(server, "gather_content_sources", fake_sources)
    monkeypatch.setattr(server, "_call_openai", fake_call)

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
