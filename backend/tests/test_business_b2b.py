"""Backend tests for Uplaud business pages: B2B (ai-fiesta) and B2C (the-solved-skin) regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to reading frontend env
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- AI Fiesta (B2B) ----------
class TestAIFiestaBusiness:
    def test_get_business(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["slug"] == "ai-fiesta"
        assert data["name"] == "AI Fiesta"
        assert data["audience"] == "b2b"
        assert data["vertical"] == "saas"
        assert data["claimed"] is True
        assert data["verified"] is True
        assert "top_praise" in data and "side-by-side" in data["top_praise"].lower()

    def test_get_stats(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/stats")
        assert r.status_code == 200
        data = r.json()
        assert data["trust_score"] == 91
        assert data["unique_reviewers"] == 312
        assert data["total_referrals"] == 96
        assert data["total_reviews"] == 348
        assert "side-by-side" in data.get("top_praise", "").lower()
        assert "rating_distribution" in data
        assert "sentiment" in data
        assert isinstance(data.get("keywords"), list) and len(data["keywords"]) > 0

    def test_get_reviews(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/reviews")
        assert r.status_code == 200
        data = r.json()
        reviews = data["reviews"]
        assert len(reviews) >= 12
        # verify demo reviewers
        demo_names = {rv["reviewer_name"] for rv in reviews if rv.get("verification_type") == "demo"}
        for expected in ["Marcus Chen", "Priya Menon", "Sara Thomas", "Rohan Bakshi"]:
            assert expected in demo_names, f"{expected} should be verification_type=demo"
        # verify reviewer_title present
        titles = [rv.get("reviewer_title", "") for rv in reviews]
        assert any("Loop Studios" in t for t in titles)
        assert any("Nimbus Labs" in t for t in titles)
        # verify purchase type exists
        purchase = [rv for rv in reviews if rv.get("verification_type") == "purchase"]
        assert len(purchase) >= 6

    def test_reviews_filter_rating(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/reviews?rating=5")
        assert r.status_code == 200
        for rv in r.json()["reviews"]:
            assert rv["rating"] == 5

    def test_reviews_search(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/reviews?q=side-by-side")
        assert r.status_code == 200
        assert r.json()["count"] >= 1

    def test_reviews_referred_only(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/reviews?referred_only=true")
        assert r.status_code == 200
        for rv in r.json()["reviews"]:
            assert rv["referred"] is True

    def test_case_studies(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/case-studies")
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 3
        slugs = {cs["slug"] for cs in data["case_studies"]}
        assert "how-loop-studios-cut-ai-spend-by-1800-a-month" in slugs
        assert "verlay-migrated-20-engineers-half-the-cost" in slugs
        assert "the-demo-that-convinced-nimbus-labs" in slugs

    def test_case_study_detail(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/case-studies/the-demo-that-convinced-nimbus-labs")
        assert r.status_code == 200
        cs = r.json()
        assert cs["title"].startswith("The 30-minute demo")
        assert "Nimbus Labs" in cs["hero_quote_author"]
        assert "<p>" in cs["body_html"]

    def test_submit_review(self, api):
        payload = {
            "reviewer_name": "TEST_QA Bot",
            "rating": 5,
            "text": "TEST_ Great B2B experience, side-by-side comparison rocks.",
            "emoji": "🚀",
        }
        r = api.post(f"{BASE_URL}/api/business/ai-fiesta/reviews", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["review"]["reviewer_name"] == "TEST_QA Bot"
        assert data["review"]["business_slug"] == "ai-fiesta"
        assert "_id" not in data["review"]

        # Verify persistence via GET
        r2 = api.get(f"{BASE_URL}/api/business/ai-fiesta/reviews?q=TEST_")
        assert r2.status_code == 200
        assert any(rv["reviewer_name"] == "TEST_QA Bot" for rv in r2.json()["reviews"])


# ---------- The Solved Skin (B2C regression) ----------
class TestSolvedSkinRegression:
    def test_get_business(self, api):
        r = api.get(f"{BASE_URL}/api/business/the-solved-skin")
        assert r.status_code == 200
        data = r.json()
        assert data["audience"] == "b2c"
        assert data["vertical"] == "health-wellness"
        assert data["trust_score"] == 94
        assert "acne" in data["top_praise"].lower()

    def test_stats_top_praise(self, api):
        r = api.get(f"{BASE_URL}/api/business/the-solved-skin/stats")
        assert r.status_code == 200
        data = r.json()
        assert data["trust_score"] == 94
        assert data["unique_reviewers"] == 612
        assert "acne" in data.get("top_praise", "").lower()

    def test_reviews_all_purchase(self, api):
        r = api.get(f"{BASE_URL}/api/business/the-solved-skin/reviews")
        assert r.status_code == 200
        reviews = r.json()["reviews"]
        assert len(reviews) >= 12
        # All seeded should be purchase (default). Ignore any TEST_ posted rows.
        seeded = [rv for rv in reviews if not rv["reviewer_name"].startswith("TEST_")]
        for rv in seeded:
            assert rv.get("verification_type", "purchase") == "purchase"

    def test_case_studies_count(self, api):
        r = api.get(f"{BASE_URL}/api/business/the-solved-skin/case-studies")
        assert r.status_code == 200
        assert r.json()["count"] == 3


# ---------- Error handling ----------
class TestErrors:
    def test_404_business(self, api):
        r = api.get(f"{BASE_URL}/api/business/nope-does-not-exist-xyz")
        assert r.status_code == 404

    def test_404_case_study(self, api):
        r = api.get(f"{BASE_URL}/api/business/ai-fiesta/case-studies/no-such-cs")
        assert r.status_code == 404
