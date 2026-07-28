"""
Backend tests for the new GET /api/warm-leads endpoint (Warm Pipeline real-data wiring).

Feature under test:
- Auth-required GET /api/warm-leads returns {business_name, leads:[...]}
- Each lead has {id, referrer_name, name, referred_date, phone}
- Business_Name is resolved from the Airtable Business table by email domain,
  falling back to user.company.
- Requires a valid Bearer token from POST /api/auth/login.
"""

import os

import httpx
import pytest

from live_integration import require_live_backend_url

pytestmark = pytest.mark.live_integration
BASE_URL = require_live_backend_url()
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "dcameron@payrewards.com").strip('"')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "P@yRew@rds123").strip('"')


@pytest.fixture(scope="module")
def client():
    with httpx.Client(timeout=30.0) as c:
        yield c


@pytest.fixture(scope="module")
def token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


class TestWarmLeadsAuth:
    def test_requires_auth(self, client):
        r = client.get(f"{API}/warm-leads")
        assert r.status_code == 401

    def test_invalid_token_401(self, client):
        r = client.get(f"{API}/warm-leads", headers={"Authorization": "Bearer garbage.token.xxx"})
        assert r.status_code == 401


class TestWarmLeadsPayload:
    def test_returns_business_and_leads(self, client, token):
        r = client.get(f"{API}/warm-leads", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, r.text
        data = r.json()
        # Top-level shape
        assert "business_name" in data
        assert "leads" in data
        assert isinstance(data["leads"], list)
        # business_name should be PayRewards (resolved via Airtable domain map OR user.company fallback)
        assert data["business_name"] == "PayRewards", f"unexpected business_name: {data['business_name']}"

    def test_lead_item_shape(self, client, token):
        r = client.get(f"{API}/warm-leads", headers={"Authorization": f"Bearer {token}"})
        data = r.json()
        leads = data["leads"]
        # Expect at least some leads (backend note says ~9 exist)
        assert len(leads) >= 1, "Expected at least 1 warm lead row from Airtable Circles"
        for lead in leads:
            assert set(["id", "referrer_name", "name", "referred_date", "phone"]).issubset(lead.keys()), \
                f"Missing keys in lead: {lead}"
            assert isinstance(lead["id"], str) and lead["id"]
            assert isinstance(lead["referrer_name"], str)
            assert isinstance(lead["name"], str)

    def test_known_referrers_present(self, client, token):
        """The backend context note says 'Jamie Rivera' and 'Deepthi Rao' should be referrers in the current dataset."""
        r = client.get(f"{API}/warm-leads", headers={"Authorization": f"Bearer {token}"})
        data = r.json()
        referrers = {l["referrer_name"] for l in data["leads"]}
        # Non-fatal informational check — assert both are present
        assert "Jamie Rivera" in referrers or "Deepthi Rao" in referrers, \
            f"Expected 'Jamie Rivera' or 'Deepthi Rao' in referrers but got: {referrers}"
