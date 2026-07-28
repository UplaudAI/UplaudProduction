"""
Backend tests for the new company-name + PDL enrichment work
(iteration 4).

Feature under test:
- POST /api/public/testimonial/{share_id}/referrals now requires each referral row
  to include a non-empty `company` (400 otherwise).
- On success, the referee's first/last name + company are sent to People Data Labs
  Person Enrichment (real API call, key in backend/.env), and enriched fields
  (job_title, company_name, industry, company_size, linkedin, pdl_likelihood,
  city/state/country) are written to the Airtable User row + linked to the
  Circles record.
- GET /api/warm-leads now surfaces those enriched fields inside each lead dict.
"""

import os
import random

import httpx
import pytest

from live_integration import require_live_backend_url

pytestmark = pytest.mark.live_integration
BASE_URL = require_live_backend_url()
API = f"{BASE_URL}/api"
SHARE_ID = "demo123"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "dcameron@payrewards.com").strip('"')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "P@yRew@rds123").strip('"')


@pytest.fixture(scope="module")
def client():
    with httpx.Client(timeout=60.0) as c:
        yield c


@pytest.fixture(scope="module")
def token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ----------------- Validation: company field is required ---------------------
class TestReferralCompanyRequired:
    def test_missing_company_returns_400(self, client):
        r = client.post(
            f"{API}/public/testimonial/{SHARE_ID}/referrals",
            json={"referrals": [{"name": "No Company Person", "contact": "nocompany@test.com", "company": ""}]},
        )
        assert r.status_code == 400, r.text
        detail = (r.json() or {}).get("detail", "").lower()
        assert "company" in detail, f"Expected 'company' in error detail, got: {detail}"

    def test_whitespace_only_company_returns_400(self, client):
        r = client.post(
            f"{API}/public/testimonial/{SHARE_ID}/referrals",
            json={"referrals": [{"name": "WS Company", "contact": "ws@test.com", "company": "   "}]},
        )
        assert r.status_code == 400, r.text

    def test_missing_company_key_returns_400(self, client):
        # `company` is optional in the pydantic model but backend enforces non-empty
        r = client.post(
            f"{API}/public/testimonial/{SHARE_ID}/referrals",
            json={"referrals": [{"name": "NoKey", "contact": "nokey@test.com"}]},
        )
        assert r.status_code == 400, r.text

    def test_mixed_batch_one_missing_company_returns_400(self, client):
        r = client.post(
            f"{API}/public/testimonial/{SHARE_ID}/referrals",
            json={
                "referrals": [
                    {"name": "Ok Person", "contact": "ok@test.com", "company": "OkCo"},
                    {"name": "Bad Person", "contact": "bad@test.com", "company": ""},
                ]
            },
        )
        assert r.status_code == 400, r.text


# ----------------- Successful enrichment via PDL ------------------------------
class TestReferralEnrichmentFlow:
    """
    Submit a real, findable public figure and confirm the enrichment fields
    appear on GET /api/warm-leads. This is a REAL PDL call, so tolerate the
    latency (a few seconds).
    """

    @pytest.fixture(scope="class")
    def referred_name(self):
        return "Satya Nadella"

    @pytest.fixture(scope="class")
    def referred_email(self):
        # Random suffix to avoid unique-key collisions on repeated pytest runs
        return f"satya-test-{random.randint(100000, 999999)}@example.com"

    def test_submit_enrichable_referral(self, client, referred_name, referred_email):
        payload = {
            "referrals": [
                {"name": referred_name, "contact": referred_email, "company": "Microsoft"}
            ]
        }
        r = client.post(f"{API}/public/testimonial/{SHARE_ID}/referrals", json=payload)
        assert r.status_code == 200, r.text
        assert r.json().get("count") == 1

    def test_enriched_lead_appears_in_warm_leads(self, client, token, referred_name):
        r = client.get(f"{API}/warm-leads", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, r.text
        leads = r.json().get("leads", [])
        matches = [l for l in leads if l.get("name", "").strip().lower() == referred_name.lower()]
        assert matches, f"Expected a lead named '{referred_name}' in warm-leads, got names: {[l.get('name') for l in leads]}"

        # Grab the most recently added Satya row (there may be several from prior test runs).
        # Any of them should have enriched fields set — PDL enrichment is real & shared user record.
        got_enrichment = False
        for lead in matches:
            job_title = lead.get("job_title") or ""
            company = lead.get("company_name") or ""
            industry = lead.get("industry") or ""
            size = lead.get("company_size") or ""
            linkedin = lead.get("linkedin") or ""
            likelihood = lead.get("pdl_likelihood")
            if any([job_title, company, industry, size, linkedin, likelihood]):
                got_enrichment = True
                # If enrichment is present at all, most core fields should be non-empty
                # for a globally-known figure like Satya Nadella.
                assert job_title, f"expected job_title for Satya, got lead={lead}"
                assert company, f"expected company_name for Satya, got lead={lead}"
                assert industry, f"expected industry for Satya, got lead={lead}"
                break
        assert got_enrichment, (
            f"None of the {len(matches)} Satya rows had any PDL enrichment fields set: {matches}"
        )

    def test_warm_lead_row_shape_includes_enrichment_keys(self, client, token):
        """Every lead row shape from the backend should carry the enrichment keys (even if empty)."""
        r = client.get(f"{API}/warm-leads", headers={"Authorization": f"Bearer {token}"})
        data = r.json()
        assert data["leads"], "no leads returned"
        required = {
            "id", "referrer_name", "name", "receiver_company", "referred_date", "phone",
            "job_title", "company_name", "industry", "company_size", "city", "state",
            "country", "linkedin", "pdl_likelihood",
        }
        for lead in data["leads"]:
            missing = required - set(lead.keys())
            assert not missing, f"Lead is missing keys {missing}: {lead}"


# ----------------- Regression: existing referral endpoints still work ---------
class TestReferralRegression:
    def test_public_get_testimonial_still_ok(self, client):
        r = client.get(f"{API}/public/testimonial/{SHARE_ID}")
        assert r.status_code == 200
        assert r.json()["share_id"] == SHARE_ID

    def test_referral_bad_share_still_404(self, client):
        r = client.post(
            f"{API}/public/testimonial/nope-share-xyz/referrals",
            json={"referrals": [{"name": "X", "contact": "x@y.com", "company": "Y"}]},
        )
        assert r.status_code == 404

    def test_referral_empty_batch_still_400(self, client):
        r = client.post(
            f"{API}/public/testimonial/{SHARE_ID}/referrals",
            json={"referrals": [{"name": "", "contact": "", "company": ""}]},
        )
        assert r.status_code == 400
