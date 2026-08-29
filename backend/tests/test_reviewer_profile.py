"""Tests for the reviewer profile endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://customer-reviews-hub.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---------- GET /api/reviewer/{slug} ----------
class TestReviewerProfile:
    def test_ananya_aggregated_across_two_businesses(self, s):
        r = s.get(f"{API}/reviewer/ananya-iyer")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["reviewer_slug"] == "ananya-iyer"
        assert d["reviewer_name"] == "Ananya Iyer"
        assert d["total_reviews"] == 2
        assert d["avg_rating_given"] == 4.0
        assert d["bio"].startswith("Product manager")
        assert d["instagram_url"] == "https://instagram.com/ananya.iyer"
        assert d["linkedin_url"] == "https://linkedin.com/in/ananya-iyer-pm"
        assert d["follower_count"] == 342
        assert d["reviewer_title"] == "Product Manager, Fintrail"
        assert d["member_since"] == "2026-06-13"
        biz_slugs = sorted(b["slug"] for b in d["businesses_reviewed"])
        assert biz_slugs == ["ai-fiesta", "the-solved-skin"]
        biz_names = sorted(b["name"] for b in d["businesses_reviewed"])
        assert biz_names == ["AI Fiesta", "The Solved Skin"]
        # reviews carry business_name and business_audience (new field for showBusinessTag)
        for rv in d["reviews"]:
            assert "business_name" in rv
            assert "business_audience" in rv
            assert rv["business_audience"] in ("b2b", "b2c")
        assert len(d["reviews"]) == 2
        # businesses_reviewed carries audience (new field)
        for b in d["businesses_reviewed"]:
            assert "audience" in b
            assert b["audience"] in ("b2b", "b2c")

    def test_marcus_chen_verified_demo(self, s):
        r = s.get(f"{API}/reviewer/marcus-chen")
        assert r.status_code == 200
        d = r.json()
        # Should have a demo review on ai-fiesta (b2b)
        demo_reviews = [rv for rv in d["reviews"] if rv.get("verification_type") == "demo"]
        assert len(demo_reviews) >= 1
        assert any(rv["business_slug"] == "ai-fiesta" for rv in demo_reviews)
        # verified_demo_count reflects it
        assert d["verified_demo_count"] >= 1
        # business_audience for ai-fiesta review should be b2b
        af = [rv for rv in d["reviews"] if rv["business_slug"] == "ai-fiesta"]
        assert af and af[0]["business_audience"] == "b2b"

    def test_shweta_no_seeded_profile(self, s):
        r = s.get(f"{API}/reviewer/shweta")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["reviewer_name"] == "Shweta"
        assert d["bio"] == ""
        assert d["instagram_url"] is None
        assert d["linkedin_url"] is None
        assert d["follower_count"] == 0
        assert d["total_reviews"] >= 1

    def test_rohit_has_seeded_bio(self, s):
        r = s.get(f"{API}/reviewer/rohit-sharma")
        assert r.status_code == 200
        d = r.json()
        assert d["bio"].startswith("Featured in a Solved Skin")
        assert d["instagram_url"] == "https://instagram.com/rohit.sharma"

    def test_nonexistent_returns_404(self, s):
        r = s.get(f"{API}/reviewer/nonexistent-slug-xyz")
        assert r.status_code == 404


# ---------- POST follow / unfollow ----------
class TestFollowFlow:
    def test_follow_unfollow_ananya(self, s):
        before = s.get(f"{API}/reviewer/ananya-iyer").json()["follower_count"]
        r1 = s.post(f"{API}/reviewer/ananya-iyer/follow")
        assert r1.status_code == 200
        assert r1.json()["follower_count"] == before + 1
        r2 = s.post(f"{API}/reviewer/ananya-iyer/unfollow")
        assert r2.status_code == 200
        assert r2.json()["follower_count"] == before

    def test_unfollow_never_negative(self, s):
        # shweta has no seeded profile -> starts at 0
        r = s.post(f"{API}/reviewer/shweta/unfollow")
        assert r.status_code == 200
        assert r.json()["follower_count"] == 0
        # follow then unfollow twice
        s.post(f"{API}/reviewer/shweta/follow")
        s.post(f"{API}/reviewer/shweta/unfollow")
        r2 = s.post(f"{API}/reviewer/shweta/unfollow")
        assert r2.json()["follower_count"] == 0


# ---------- Regression: business pages ----------
class TestBusinessRegression:
    def test_solved_skin_ok(self, s):
        assert s.get(f"{API}/business/the-solved-skin").status_code == 200
        assert s.get(f"{API}/business/the-solved-skin/reviews").status_code == 200
        assert s.get(f"{API}/business/the-solved-skin/stats").status_code == 200
        assert s.get(f"{API}/business/the-solved-skin/case-studies").status_code == 200

    def test_ai_fiesta_ok(self, s):
        assert s.get(f"{API}/business/ai-fiesta").status_code == 200
        assert s.get(f"{API}/business/ai-fiesta/reviews").status_code == 200
        assert s.get(f"{API}/business/ai-fiesta/stats").status_code == 200
        assert s.get(f"{API}/business/ai-fiesta/case-studies").status_code == 200
