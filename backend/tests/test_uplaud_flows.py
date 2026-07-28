"""
Backend regression tests for the Uplaud Growth Engine testimonial approval flow.

Covers:
- Health
- Business login (JWT auth)
- Public testimonial GET / edit / approve
- Referral submission (email + phone contacts)
- Public /api/events/log endpoint (fire-and-forget analytics)

Uses the public preview URL from REACT_APP_BACKEND_URL. Airtable writes are
best-effort / side effects and validated only via HTTP 200 responses (backend
swallows Airtable failures per spec).
"""

import os
import time
import uuid

import httpx
import pytest

from live_integration import require_live_backend_url

pytestmark = pytest.mark.live_integration
BASE_URL = require_live_backend_url()
API = f"{BASE_URL}/api"

SHARE_ID = "demo123"

ADMIN_EMAIL = "dcameron@payrewards.com"
ADMIN_PASSWORD = os.environ.get("TEST_PASSWORD", "")


@pytest.fixture(scope="module")
def client():
    with httpx.Client(timeout=30.0) as c:
        yield c


# ------------------------- Health --------------------------------------------
class TestHealth:
    def test_api_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("message")


# ------------------------- Auth ----------------------------------------------
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["company"]

    def test_login_bad_password(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self, client):
        r = client.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------------------- Public testimonial page -------------------------------
class TestPublicTestimonial:
    def test_get_demo123(self, client):
        r = client.get(f"{API}/public/testimonial/{SHARE_ID}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["share_id"] == SHARE_ID
        assert data["brand"] == "PayRewards"
        assert data["speaker_name"]
        assert data["testimonial"]

    def test_get_missing_share_returns_404(self, client):
        r = client.get(f"{API}/public/testimonial/definitely-does-not-exist-xyz")
        assert r.status_code == 404

    def test_edit_and_revert_testimonial(self, client):
        # Grab current text
        orig = client.get(f"{API}/public/testimonial/{SHARE_ID}").json()["testimonial"]
        new_text = orig + " " + uuid.uuid4().hex[:6]
        # PUT edit
        r = client.put(f"{API}/public/testimonial/{SHARE_ID}", json={"testimonial_draft": new_text})
        # If already approved from a previous run, edit is locked -> 400. Handle both cases.
        if r.status_code == 400:
            pytest.skip("Testimonial already approved (locked); edit test skipped")
        assert r.status_code == 200, r.text
        assert r.json()["testimonial"] == new_text
        # GET to confirm persisted
        r2 = client.get(f"{API}/public/testimonial/{SHARE_ID}")
        assert r2.json()["testimonial"] == new_text
        # Revert
        r3 = client.put(f"{API}/public/testimonial/{SHARE_ID}", json={"testimonial_draft": orig})
        assert r3.status_code == 200
        assert r3.json()["testimonial"] == orig

    def test_approve_testimonial(self, client):
        r = client.post(f"{API}/public/testimonial/{SHARE_ID}/approve")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "approved"
        assert data["approved_at"]
        # GET again to confirm persisted status
        r2 = client.get(f"{API}/public/testimonial/{SHARE_ID}")
        assert r2.json()["status"] == "approved"

    def test_edit_locked_after_approval(self, client):
        r = client.put(
            f"{API}/public/testimonial/{SHARE_ID}",
            json={"testimonial_draft": "tampered"},
        )
        assert r.status_code == 400


# ------------------------- Referrals -----------------------------------------
class TestReferrals:
    def test_submit_referrals_email_and_phone(self, client):
        payload = {
            "referrals": [
                {"name": "TEST Priya Sharma", "contact": "TEST_priya@example.com"},
                {"name": "TEST Alex Chen", "contact": "+1-415-555-0199"},
            ]
        }
        r = client.post(f"{API}/public/testimonial/{SHARE_ID}/referrals", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["count"] == 2

    def test_submit_referrals_linkedin(self, client):
        payload = {
            "referrals": [
                {"name": "TEST LinkedIn Friend", "contact": "https://linkedin.com/in/testuser"},
            ]
        }
        r = client.post(f"{API}/public/testimonial/{SHARE_ID}/referrals", json=payload)
        assert r.status_code == 200
        assert r.json()["count"] == 1

    def test_submit_referrals_empty_400(self, client):
        r = client.post(
            f"{API}/public/testimonial/{SHARE_ID}/referrals",
            json={"referrals": [{"name": "", "contact": ""}]},
        )
        assert r.status_code == 400

    def test_submit_referrals_missing_share_404(self, client):
        r = client.post(
            f"{API}/public/testimonial/nope-share-id/referrals",
            json={"referrals": [{"name": "X", "contact": "x@y.com"}]},
        )
        assert r.status_code == 404


# ------------------------- Event log ------------------------------------------
class TestEventLog:
    def test_log_event_success(self, client):
        r = client.post(
            f"{API}/events/log",
            json={
                "event": "TEST_pytest_event",
                "page": "testimonial",
                "share_id": SHARE_ID,
                "details": "pytest smoke",
            },
        )
        assert r.status_code == 200, r.text
        assert r.json() == {"ok": True}

    def test_log_event_minimal_body(self, client):
        r = client.post(f"{API}/events/log", json={"event": "TEST_minimal"})
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_log_event_missing_event_422(self, client):
        r = client.post(f"{API}/events/log", json={})
        assert r.status_code == 422


# ------------------------- Regression: pre-existing endpoints ------------------
class TestRegression:
    def test_analyze_without_openai_key_returns_503(self, client):
        # Need an auth token
        tok = client.post(
            f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        ).json()["token"]
        # Create a dummy source first via file upload
        files = {"file": ("test.txt", b"Some transcript content mentioning the customer.", "text/plain")}
        r = client.post(
            f"{API}/sources", headers={"Authorization": f"Bearer {tok}"}, files=files
        )
        assert r.status_code == 200
        sid = r.json()["id"]
        # Now try to analyze - expect 503 because OPENAI_API_KEY is empty (per env)
        r2 = client.post(
            f"{API}/sources/{sid}/analyze",
            headers={"Authorization": f"Bearer {tok}"},
        )
        assert r2.status_code == 503, f"Expected 503 without OPENAI key, got {r2.status_code}: {r2.text}"

    def test_social_generate_falls_back_without_key(self, client):
        r = client.post(
            f"{API}/social/generate",
            json={
                "testimonial": "PayRewards helped us launch faster.",
                "attribution": "Jane Doe, Head of Ops, Acme",
                "company": "PayRewards",
                "pov": "customer",
                "channels": ["linkedin", "instagram", "x"],
            },
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["pov"] == "customer"
        for ch in ("linkedin", "instagram", "x"):
            assert ch in data["channels"]
            assert data["channels"][ch]["quote"]
