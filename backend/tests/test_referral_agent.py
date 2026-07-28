"""
Backend tests for the new Referral Agent feature.

Endpoints under test:
- GET /api/warm-leads → each lead has an 'agent_plan' key (null or dict).
- POST /api/warm-leads/{lead_id}/agent-run
    - First call generates a plan (real OpenAI web_search + draft, ~5-15s).
    - Second call without ?force=true returns the SAME cached plan (generated_at unchanged).
    - ?force=true regenerates (new generated_at).
    - Non-existent lead → 404.
- POST /api/warm-leads/{lead_id}/agent-plan/{approve|skip}
    - Approve/Skip toggles status; missing plan → 404.
"""

import os

import httpx
import pytest

from live_integration import require_live_backend_url

pytestmark = pytest.mark.live_integration
BASE_URL = require_live_backend_url()
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "dcameron@payrewards.com").strip('"')
ADMIN_PASSWORD = os.environ.get("TEST_PASSWORD", "").strip('"')

# Agent-run can take 5-15s due to OpenAI web_search + draft calls
LLM_TIMEOUT = 90.0


@pytest.fixture(scope="module")
def client():
    with httpx.Client(timeout=LLM_TIMEOUT) as c:
        yield c


@pytest.fixture(scope="module")
def token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def warm_leads(client, auth_headers):
    r = client.get(f"{API}/warm-leads", headers=auth_headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "leads" in data
    return data["leads"]


# --------- Section 1: GET /warm-leads exposes agent_plan --------------------

class TestWarmLeadsAgentPlanShape:
    def test_warm_leads_returns_leads_list(self, warm_leads):
        assert isinstance(warm_leads, list)
        assert len(warm_leads) > 0, "Need at least 1 warm lead seeded to test agent plan wiring"

    def test_every_lead_has_agent_plan_key(self, warm_leads):
        for l in warm_leads:
            assert "agent_plan" in l, f"lead {l.get('id')} missing agent_plan key"

    def test_agent_plan_is_null_or_dict(self, warm_leads):
        for l in warm_leads:
            ap = l.get("agent_plan")
            assert ap is None or isinstance(ap, dict), f"lead {l.get('id')} agent_plan wrong type: {type(ap)}"

    def test_cached_agent_plan_has_expected_shape(self, warm_leads):
        """If any lead already has a cached agent_plan, verify its shape."""
        planned = [l for l in warm_leads if l.get("agent_plan")]
        if not planned:
            pytest.skip("No cached agent plans yet — shape check will run after generation")
        for l in planned:
            ap = l["agent_plan"]
            for k in ("lead_id", "status", "research_summary", "email_subject",
                      "email_body", "linkedin_message", "next_action", "generated_at"):
                assert k in ap, f"agent_plan missing key {k} for lead {l['id']}"
            assert ap["status"] in ("pending", "approved", "skipped")
            assert isinstance(ap["next_action"], dict)
            assert "label" in ap["next_action"] and "cta" in ap["next_action"]
            assert ap["next_action"]["cta"] in ("Send Email", "Send LinkedIn InMail")


# --------- Section 2: agent-run generation + caching + force -----------------

class TestAgentRun:
    def test_agent_run_unauthenticated(self, client, warm_leads):
        lead_id = warm_leads[0]["id"]
        r = client.post(f"{API}/warm-leads/{lead_id}/agent-run")
        assert r.status_code == 401

    def test_agent_run_nonexistent_lead_404(self, client, auth_headers):
        r = client.post(
            f"{API}/warm-leads/rec_TEST_does_not_exist_12345/agent-run",
            headers=auth_headers,
        )
        assert r.status_code == 404, r.text

    def test_agent_run_returns_valid_plan(self, client, auth_headers, warm_leads):
        """First call: either returns cached plan or generates a new one."""
        lead_id = warm_leads[0]["id"]
        r = client.post(f"{API}/warm-leads/{lead_id}/agent-run", headers=auth_headers)
        assert r.status_code == 200, r.text
        plan = r.json()
        assert plan["lead_id"] == lead_id
        assert plan["status"] in ("pending", "approved", "skipped")
        assert isinstance(plan["email_body"], str) and len(plan["email_body"]) > 20
        assert isinstance(plan["email_subject"], str) and len(plan["email_subject"]) > 3
        assert plan["next_action"]["cta"] in ("Send Email", "Send LinkedIn InMail")
        assert plan["next_action"]["label"]
        assert plan["generated_at"]

    def test_agent_run_second_call_returns_cached(self, client, auth_headers, warm_leads):
        """Second call without force should return the SAME generated_at (cached)."""
        lead_id = warm_leads[0]["id"]
        r1 = client.post(f"{API}/warm-leads/{lead_id}/agent-run", headers=auth_headers)
        assert r1.status_code == 200
        first_ts = r1.json()["generated_at"]

        r2 = client.post(f"{API}/warm-leads/{lead_id}/agent-run", headers=auth_headers)
        assert r2.status_code == 200
        second_ts = r2.json()["generated_at"]
        assert first_ts == second_ts, "Cached plan generated_at should not change without ?force=true"

    def test_agent_run_force_regenerates(self, client, auth_headers, warm_leads):
        """?force=true should regenerate and produce a new generated_at."""
        lead_id = warm_leads[0]["id"]
        # baseline
        r1 = client.post(f"{API}/warm-leads/{lead_id}/agent-run", headers=auth_headers)
        assert r1.status_code == 200
        first_ts = r1.json()["generated_at"]

        r2 = client.post(f"{API}/warm-leads/{lead_id}/agent-run?force=true", headers=auth_headers)
        assert r2.status_code == 200, r2.text
        second_ts = r2.json()["generated_at"]
        assert second_ts != first_ts, "force=true should produce a new generated_at"


# --------- Section 3: approve / skip -----------------------------------------

class TestAgentPlanApproveSkip:
    def test_approve_unauthenticated(self, client, warm_leads):
        lead_id = warm_leads[0]["id"]
        r = client.post(f"{API}/warm-leads/{lead_id}/agent-plan/approve")
        assert r.status_code == 401

    def test_approve_missing_plan_404(self, client, auth_headers):
        """A lead id that has no plan cached should 404 with a clear message."""
        r = client.post(
            f"{API}/warm-leads/rec_TEST_no_plan_yet_zzz/agent-plan/approve",
            headers=auth_headers,
        )
        assert r.status_code == 404
        # backend uses either "detail" or "message"; both accepted
        body = r.json()
        assert "detail" in body or "message" in body

    def test_approve_then_skip_flow(self, client, auth_headers, warm_leads):
        """End-to-end: ensure plan exists → approve → verify status → skip → verify status."""
        # Ensure a plan exists (uses cached if already generated)
        lead_id = warm_leads[0]["id"]
        r = client.post(f"{API}/warm-leads/{lead_id}/agent-run", headers=auth_headers)
        assert r.status_code == 200

        # Approve
        r_a = client.post(f"{API}/warm-leads/{lead_id}/agent-plan/approve", headers=auth_headers)
        assert r_a.status_code == 200, r_a.text
        assert r_a.json()["status"] == "approved"

        # Verify status persisted via GET /warm-leads
        r_g = client.get(f"{API}/warm-leads", headers=auth_headers)
        matching = [l for l in r_g.json()["leads"] if l["id"] == lead_id][0]
        assert matching["agent_plan"]["status"] == "approved"

        # Skip
        r_s = client.post(f"{API}/warm-leads/{lead_id}/agent-plan/skip", headers=auth_headers)
        assert r_s.status_code == 200, r_s.text
        assert r_s.json()["status"] == "skipped"

    def test_invalid_action_returns_404(self, client, auth_headers, warm_leads):
        lead_id = warm_leads[0]["id"]
        r = client.post(
            f"{API}/warm-leads/{lead_id}/agent-plan/burninate",
            headers=auth_headers,
        )
        assert r.status_code == 404
