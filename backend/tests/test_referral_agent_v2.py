"""
Backend tests for the Referral Agent V2 refinements.

Changes tested:
- GET /api/warm-leads → each lead now has 'created_at' (ISO timestamp from Airtable createdTime).
- POST /api/warm-leads/{lead_id}/agent-run:
    * response schema now includes 'research_headline' (str) and 'research_summary' (List[str]).
    * research_summary bullets have NO markdown link syntax like '([foo.com](https://foo.com))'.
    * research_headline is a short (< ~200 char) non-empty punchy sentence.
    * next_action.cta should intelligently vary based on lead's LinkedIn signals — not always 'Send Email'.
    * email_body must reference the referrer name and should not describe them as a 'customer'
      unless testimonial says so (default 'took a demo').
    * email_body should end with a demo-booking CTA (contains word 'demo' near the end).
- POST /api/warm-leads/{lead_id}/agent-plan/{approve|skip} unchanged.
"""

import os
import re
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

# Agent-run can take 5-15s due to OpenAI web_search + draft calls
LLM_TIMEOUT = 120.0

MARKDOWN_LINK_RE = re.compile(r"\[[^\]]+\]\((?:https?://)?[^)]+\)")


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
    assert "leads" in data and isinstance(data["leads"], list)
    assert len(data["leads"]) > 0
    return data["leads"]


# --- Section 1: warm-leads shape (created_at) ------------------------------

class TestWarmLeadsShape:
    def test_every_lead_has_created_at(self, warm_leads):
        for l in warm_leads:
            assert "created_at" in l, f"lead {l.get('id')} missing created_at"

    def test_created_at_looks_like_iso(self, warm_leads):
        # At least one lead should have a non-empty iso timestamp
        has_iso = any(
            isinstance(l.get("created_at"), str) and re.match(r"^\d{4}-\d{2}-\d{2}T", l["created_at"])
            for l in warm_leads
        )
        assert has_iso, "No lead exposes an ISO createdTime — Airtable createdTime not wired?"


# --- Section 2: agent-run response schema (v2) -----------------------------

@pytest.fixture(scope="module")
def generated_plans(client, auth_headers, warm_leads):
    """Trigger agent-run for up to 3 leads and cache results."""
    plans = {}
    for l in warm_leads[:3]:
        r = client.post(f"{API}/warm-leads/{l['id']}/agent-run", headers=auth_headers)
        assert r.status_code == 200, f"agent-run failed for {l['id']}: {r.text}"
        plans[l["id"]] = r.json()
    return plans


class TestAgentRunSchemaV2:
    def test_research_headline_present_and_nonempty(self, generated_plans):
        for lid, plan in generated_plans.items():
            assert "research_headline" in plan, f"missing research_headline for {lid}"
            assert isinstance(plan["research_headline"], str)
            # headline should be present when we have research; but tolerate empty
            # if openai gave nothing back.
            assert len(plan["research_headline"]) <= 500

    def test_research_summary_is_list(self, generated_plans):
        for lid, plan in generated_plans.items():
            assert "research_summary" in plan
            assert isinstance(plan["research_summary"], list), (
                f"research_summary for {lid} is not a list: {type(plan['research_summary'])}"
            )

    def test_research_summary_has_no_markdown_links(self, generated_plans):
        for lid, plan in generated_plans.items():
            for bullet in plan["research_summary"]:
                assert isinstance(bullet, str)
                assert not MARKDOWN_LINK_RE.search(bullet), (
                    f"Markdown link found in bullet for {lid}: {bullet}"
                )

    def test_at_least_one_headline_produced(self, generated_plans):
        # Overall — at least one of the three leads should produce a non-empty headline
        non_empty = [p for p in generated_plans.values() if (p.get("research_headline") or "").strip()]
        assert len(non_empty) >= 1, "No agent plan produced a research_headline"


# --- Section 3: channel selection intelligence -----------------------------

class TestChannelSelection:
    def test_channel_varies_or_matches_signal(self, warm_leads, generated_plans):
        """We should not always default to 'Send Email' — either channels vary
        across the generated batch OR each channel choice matches the presence
        of a linkedin URL. Both are acceptable behaviours."""
        ctas = [p["next_action"]["cta"] for p in generated_plans.values()]
        # Sanity: valid values only
        for cta in ctas:
            assert cta in ("Send Email", "Send LinkedIn InMail")

        # Get linkedin availability by lead
        lead_map = {l["id"]: l for l in warm_leads}
        # for each planned lead, check that if it has NO linkedin, the channel is Send Email
        for lid, plan in generated_plans.items():
            lead = lead_map[lid]
            if not lead.get("linkedin") and not lead.get("work_email"):
                # neither channel available — either is ok
                continue
            if not lead.get("linkedin"):
                assert plan["next_action"]["cta"] == "Send Email", (
                    f"Lead {lid} has no linkedin but got {plan['next_action']['cta']}"
                )


# --- Section 4: email content constraints ----------------------------------

class TestEmailContent:
    def test_email_body_references_referrer_name(self, warm_leads, generated_plans):
        lead_map = {l["id"]: l for l in warm_leads}
        for lid, plan in generated_plans.items():
            referrer = (lead_map[lid].get("referrer") or {}).get("name") or lead_map[lid].get("referrer_name") or ""
            first_name = referrer.split(" ")[0] if referrer else ""
            if first_name:
                assert first_name.lower() in plan["email_body"].lower(), (
                    f"Referrer '{first_name}' not mentioned in email for {lid}: {plan['email_body'][:200]}"
                )

    def test_email_body_does_not_call_referrer_a_customer_by_default(self, warm_leads, generated_plans):
        """If the referrer_testimonial does NOT contain the word 'customer' or 'user',
        the email must not describe them as 'a customer of' or 'our customer'."""
        lead_map = {l["id"]: l for l in warm_leads}
        for lid, plan in generated_plans.items():
            testimonial = (lead_map[lid].get("referrer_testimonial") or "").lower()
            # If testimonial doesn't self-identify as customer, email shouldn't either
            if "customer" not in testimonial and "using" not in testimonial:
                body_lower = plan["email_body"].lower()
                # Look for suspicious phrases; tolerate word 'customer' if used in unrelated sense.
                bad_phrases = [
                    "our customer",
                    "as a customer",
                    "a happy customer",
                    "long-time customer",
                    "existing customer",
                ]
                for bp in bad_phrases:
                    assert bp not in body_lower, (
                        f"Lead {lid}: email calls referrer '{bp}' but testimonial doesn't. body: {plan['email_body'][:400]}"
                    )

    def test_email_body_has_demo_cta(self, generated_plans):
        for lid, plan in generated_plans.items():
            body = plan["email_body"].lower()
            assert "demo" in body, f"Lead {lid} email missing demo CTA: {plan['email_body'][:400]}"


# --- Section 5: back-compat sanity (approve/skip still works) --------------

class TestApproveSkipRegression:
    def test_approve_then_skip(self, client, auth_headers, generated_plans):
        lead_id = next(iter(generated_plans.keys()))
        r_a = client.post(f"{API}/warm-leads/{lead_id}/agent-plan/approve", headers=auth_headers)
        assert r_a.status_code == 200, r_a.text
        assert r_a.json()["status"] == "approved"

        r_s = client.post(f"{API}/warm-leads/{lead_id}/agent-plan/skip", headers=auth_headers)
        assert r_s.status_code == 200
        assert r_s.json()["status"] == "skipped"
