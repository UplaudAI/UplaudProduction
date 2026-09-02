import sys
import types
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

motor_module = types.ModuleType("motor")
motor_asyncio_module = types.ModuleType("motor.motor_asyncio")


class _FakeAsyncIOMotorClient:
    def __init__(self, *args, **kwargs):
        pass

    def __getitem__(self, _name):
        return None


motor_asyncio_module.AsyncIOMotorClient = _FakeAsyncIOMotorClient
motor_module.motor_asyncio = motor_asyncio_module
sys.modules.setdefault("motor", motor_module)
sys.modules.setdefault("motor.motor_asyncio", motor_asyncio_module)

import airtable_client  # noqa: E402
import server  # noqa: E402


client = TestClient(server.app)


def _mock_airtable(monkeypatch):
    async def fake_get(table, params=None):
        if table == airtable_client.TABLE_BUSINESS:
            raise AssertionError("public business pages must not read the Business table")
        if table == airtable_client.TABLE_UPLAUD:
            if (params or {}).get("offset") == "next_page":
                return {
                    "records": [
                        {
                            "id": "rec_marshall_review",
                            "createdTime": "2026-08-27T12:00:00Z",
                            "fields": {
                                "business_name": "Marshall",
                                "Uplaud": "Marshall delivered a strong customer experience.",
                                "Uplaud Score": 5,
                                "Name_Creator": ["Priya Menon"],
                                "Review_Source": "Uplaud",
                                "Date_Added": "2026-08-27",
                            },
                        }
                    ]
                }
            return {
                "offset": "next_page",
                "records": [
                    {
                        "id": "rec_review_1",
                        "createdTime": "2026-06-20T12:00:00Z",
                        "fields": {
                            "business_name": "AIFiesta",
                            "Uplaud": "The side-by-side model comparison helped us pick the right answer.",
                            "Uplaud Score": 5,
                            "Name_Creator": ["Priya Menon"],
                            "Review_Source": "Uplaud",
                            "Date_Added": "2026-06-20",
                        },
                    },
                    {
                        "id": "rec_review_2",
                        "createdTime": "2026-06-18T12:00:00Z",
                        "fields": {
                            "business_name": "AIFiesta",
                            "Uplaud": "The team onboarding was straightforward.",
                            "Uplaud Score": 4,
                            "Name_Creator": ["Rohan Bakshi"],
                            "Review_Source": "Uplaud",
                            "Date_Added": "2026-06-18",
                        },
                    },
                ]
            }
        return {"records": []}

    async def fake_list_circles_by_business(business_name):
        if business_name == "AIFiesta":
            return [
                {"id": "circle_1", "referrer_name": "Priya Menon"},
                {"id": "circle_2", "referrer_name": "Unrelated Referrer"},
                {"id": "circle_3", "referrer_name": ""},
            ]
        if business_name == "Marshall":
            return [{"id": "circle_4", "referrer_name": "Casey"}]
        return []

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(airtable_client, "list_circles_by_business", fake_list_circles_by_business)
    monkeypatch.setattr(server, "db", None)


def test_get_public_business_from_airtable(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "AI Fiesta"
    assert data["total_reviews"] == 2
    assert data["avg_rating"] == 4.5


def test_get_public_business_page_payload_uses_single_airtable_lookup(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/page")

    assert response.status_code == 200
    data = response.json()
    assert data["business"]["name"] == "AI Fiesta"
    assert data["stats"]["total_reviews"] == 2
    assert data["stats"]["total_referrals"] == 3
    assert len(data["reviews"]) == 2
    assert len(data["top_reviews"]) == 2
    assert data["case_studies"][0]["hero_quote_author"] == "Priya Menon"


def test_public_business_html_is_crawlable(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/business/public/ai-fiesta")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "<title>AI Fiesta Reviews | Uplaud</title>" in response.text
    assert '<meta property="og:site_name" content="Uplaud" />' in response.text
    assert '<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />' in response.text
    assert "application/ld+json" in response.text
    assert "The side-by-side model comparison helped us pick the right answer." in response.text
    assert "Average rating" in response.text


def test_public_business_html_rewrite_fallback_is_crawlable(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/index.py?path=business/public/ai-fiesta")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "<link rel=\"canonical\" href=\"http://testserver/business/public/ai-fiesta\" />" in response.text
    assert "The side-by-side model comparison helped us pick the right answer." in response.text


def test_robots_txt_points_to_sitemap(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/index.py?path=robots.txt")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "User-agent: *" in response.text
    assert "Allow: /" in response.text
    assert "Sitemap: http://testserver/sitemap.xml" in response.text


def test_sitemap_xml_lists_public_business_pages(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/index.py?path=sitemap.xml")

    assert response.status_code == 200
    assert "application/xml" in response.headers["content-type"]
    assert "<loc>http://testserver/business/public/ai-fiesta</loc>" in response.text
    assert "<loc>http://testserver/business/public/marshall</loc>" in response.text


def test_get_public_business_reviews_from_uplaud_table(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/reviews?rating=5&q=side-by-side")

    assert response.status_code == 200
    reviews = response.json()["reviews"]
    assert len(reviews) == 1
    assert reviews[0]["reviewer_name"] == "Priya Menon"
    assert reviews[0]["text"].startswith("The side-by-side")
    assert reviews[0]["referred"] is True


def test_public_business_reviews_only_mark_matching_circle_referrers(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/reviews")

    assert response.status_code == 200
    referred_by_name = {
        review["reviewer_name"]: review["referred"]
        for review in response.json()["reviews"]
    }
    assert referred_by_name["Priya Menon"] is True
    assert referred_by_name["Rohan Bakshi"] is False


def test_review_source_is_channel_not_reviewer_title():
    review = server.public_review_from_uplaud(
        {
            "id": "rec_review",
            "customer": "Anand Pandey",
            "body": "AI Fiesta helps me compare models.",
            "rating": 5,
            "source": "Post Sales Testimonial",
            "date_added": "2026-08-31",
        },
        "aifiesta",
    )

    assert review["channel"] == "Post Sales Testimonial"
    assert review["reviewer_title"] == ""


def test_get_public_reviewer_reviews(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/reviewer/priya-menon")

    assert response.status_code == 200
    data = response.json()
    assert data["business"]["name"] == "Uplaud"
    assert data["reviewer"]["name"] == "Priya Menon"
    assert data["reviewer"]["slug"] == "priya-menon"
    assert data["stats"]["total_reviews"] == 2
    assert data["stats"]["avg_rating"] == 5.0
    assert len(data["reviews"]) == 2
    assert {review["business_name"] for review in data["reviews"]} == {"AI Fiesta", "Marshall"}
    assert [item["name"] for item in data["businesses_reviewed"]] == ["AI Fiesta", "Marshall"]
    assert data["reviews"][0]["reviewer_name"] == "Priya Menon"


def test_legacy_public_business_reviewer_route_still_works(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/reviewers/priya-menon")

    assert response.status_code == 200
    data = response.json()
    assert data["business"]["name"] == "AI Fiesta"
    assert data["reviewer"]["slug"] == "priya-menon"
    assert data["stats"]["total_reviews"] == 2


def test_unknown_public_business_reviewer_404(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/reviewer/not-a-reviewer")

    assert response.status_code == 404


def test_get_public_business_stats_counts_reviews_and_circles(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/stats")

    assert response.status_code == 200
    data = response.json()
    assert data["total_reviews"] == 2
    assert data["total_referrals"] == 3
    assert len(data["keywords"]) >= 3


def test_public_business_stats_builds_positive_adjective_word_cloud():
    stats = server.public_stats_from_reviews(
        {"avg_rating": 4.5, "trust_score": 90},
        [
            {"rating": 5, "reviewer_name": "Priya", "text": "The excellent model comparison felt helpful and fast."},
            {"rating": 4, "reviewer_name": "Rohan", "text": "Helpful onboarding and reliable results."},
            {"rating": 2, "reviewer_name": "Casey", "text": "Slow and confusing setup."},
        ],
        referral_count=0,
    )

    words = {item["word"]: item["count"] for item in stats["keywords"]}
    assert words["helpful"] == 2
    assert words["excellent"] == 1
    assert words["reliable"] == 1
    assert "slow" not in words


def test_get_public_business_case_study_from_uplaud_review(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/case-studies")

    assert response.status_code == 200
    story = response.json()["case_studies"][0]
    detail = client.get(f"/api/business/public/ai-fiesta/case-studies/{story['slug']}")
    assert detail.status_code == 200
    assert detail.json()["hero_quote_author"] == "Priya Menon"


def test_unknown_public_business_404(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/not-a-business")

    assert response.status_code == 404


def test_get_public_business_from_uplaud_table_when_business_row_missing(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/marshall")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Marshall"
    assert data["total_reviews"] == 1
