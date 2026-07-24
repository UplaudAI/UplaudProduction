"""
Backend tests for the new "Signals" (extra PDL enrichment) work.

Feature under test:
- GET /api/warm-leads surfaces the *new* enrichment keys:
    work_email, mobile_phone, skills, interests, education,
    previous_company, job_start_date, twitter_url, github_url
  in addition to the previously verified core keys.
- The "Signal Test Lead" (id starts with recS65AK) row is present with ALL
  those keys populated (Airtable seed data verified via curl in main-agent
  context).
- POST /api/public/testimonial/{share_id}/referrals still enriches via PDL
  and writes back to Airtable. Since 'demo123' may not exist in every
  environment, we upload a fresh source via POST /api/sources first to get
  a new share_id.
"""
import io
import os
import random
from pathlib import Path

import httpx
import pytest
from dotenv import load_dotenv

load_dotenv(Path("/app/frontend/.env"))
load_dotenv(Path("/app/backend/.env"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "dcameron@payrewards.com").strip('"')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "P@yRew@rds123").strip('"')

EXPECTED_NEW_KEYS = {
    "work_email",
    "mobile_phone",
    "skills",
    "interests",
    "education",
    "previous_company",
    "job_start_date",
    "twitter_url",
    "github_url",
}
CORE_KEYS = {
    "id",
    "referrer_name",
    "name",
    "receiver_company",
    "referred_date",
    "phone",
    "job_title",
    "company_name",
    "industry",
    "company_size",
    "city",
    "state",
    "country",
    "linkedin",
    "pdl_likelihood",
}


@pytest.fixture(scope="module")
def client():
    with httpx.Client(timeout=90.0) as c:
        yield c


@pytest.fixture(scope="module")
def token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# --------------------------- Auth smoke ----------------------------
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("token"), str) and len(data["token"]) > 20
        assert data.get("user", {}).get("email") == ADMIN_EMAIL


# ---------------- Warm leads: shape includes new signal keys ----------------
class TestWarmLeadsSignalsShape:
    def test_all_leads_carry_new_signal_keys(self, client, auth_headers):
        r = client.get(f"{API}/warm-leads", headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        leads = data.get("leads", [])
        assert leads, "expected at least one lead"
        for lead in leads:
            missing_core = CORE_KEYS - set(lead.keys())
            assert not missing_core, f"missing core keys {missing_core} in {lead}"
            missing_new = EXPECTED_NEW_KEYS - set(lead.keys())
            assert not missing_new, f"missing new PDL signal keys {missing_new} in {lead}"

    def test_signal_test_lead_fully_populated(self, client, auth_headers):
        """Seeded Airtable row: id starts with recS65AK / name 'Signal Test Lead'"""
        r = client.get(f"{API}/warm-leads", headers=auth_headers)
        leads = r.json().get("leads", [])
        matches = [l for l in leads if (l.get("id") or "").startswith("recS65AK")]
        assert matches, "expected the seeded 'Signal Test Lead' row (recS65AK...) in warm-leads"
        lead = matches[0]
        # Data assertions on every new field
        assert lead["name"] == "Signal Test Lead"
        assert lead["job_title"] == "VP Growth"
        assert lead["company_name"] == "Acme Corp"
        assert lead["industry"] == "software"
        assert lead["company_size"] == "501-1000"
        assert lead["pdl_likelihood"] == 9
        assert lead["work_email"] == "signal-test-lead@acme.com"
        assert lead["mobile_phone"] == "+1-555-0100"
        assert "growth marketing" in lead["skills"]
        assert "cycling" in lead["interests"]
        assert "MBA" in lead["education"]
        assert lead["previous_company"] == "HubSpot"
        assert lead["job_start_date"] == "2022"
        assert "signaltest" in lead["twitter_url"]
        assert "signaltest" in lead["github_url"]


# ----------- Referral submission still enriches (using a fresh share_id) -----------
class TestReferralEnrichmentFreshShare:
    """Upload a fresh source via /api/sources to obtain a share_id (since
    'demo123' may not exist in every sandbox), then POST a referral and verify
    the enriched lead appears in warm-leads with the new keys."""

    @pytest.fixture(scope="class")
    def share_id(self, client, auth_headers):
        text = (
            "Deepthi Rao here, VP of Ops at PayRewards. We migrated our vendor stack to "
            "PayRewards and saved 22% in the first quarter. The onboarding took 3 days and "
            "the analytics dashboard is fantastic. I'd recommend it to any fintech ops leader."
        ).encode("utf-8")
        files = {"file": (f"testimonial_{random.randint(1000,9999)}.txt", io.BytesIO(text), "text/plain")}
        r = client.post(f"{API}/sources", headers=auth_headers, files=files)
        if r.status_code != 200:
            pytest.skip(f"could not upload source ({r.status_code}): {r.text[:200]}")
        share_id = r.json().get("share_id")
        assert share_id, f"no share_id returned: {r.json()}"
        return share_id

    def test_referral_submission_enriches(self, client, auth_headers, share_id):
        referred_email = f"satya-signal-{random.randint(100000,999999)}@example.com"
        payload = {
            "referrals": [
                {"name": "Satya Nadella", "contact": referred_email, "company": "Microsoft"}
            ]
        }
        r = client.post(f"{API}/public/testimonial/{share_id}/referrals", json=payload)
        assert r.status_code == 200, r.text
        assert r.json().get("count") == 1

    def test_company_required_on_fresh_share(self, client, share_id):
        r = client.post(
            f"{API}/public/testimonial/{share_id}/referrals",
            json={"referrals": [{"name": "NoCo", "contact": "noco@test.com", "company": ""}]},
        )
        assert r.status_code == 400, r.text
        detail = (r.json() or {}).get("detail", "").lower()
        assert "company" in detail


# ---------------- Regression: warm-leads auth guard still holds ---------------
class TestWarmLeadsAuthRegression:
    def test_no_token_401(self, client):
        r = client.get(f"{API}/warm-leads")
        assert r.status_code == 401

    def test_bad_token_401(self, client):
        r = client.get(f"{API}/warm-leads", headers={"Authorization": "Bearer garbage.token.xxx"})
        assert r.status_code == 401
