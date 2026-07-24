"""Referral Agent outreach prompt regression tests.

Verify that:
  (a) email_body and linkedin_message explicitly say "your contact <Referrer>" on first mention
  (b) when referrer_testimonial >= 40 chars, email_body contains a real quoted excerpt
      whose words overlap materially with the testimonial itself (not a generic paraphrase).
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
EMAIL = "dcameron@payrewards.com"
PASSWORD = "P@yRew@rds123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def leads(token):
    r = requests.get(f"{BASE_URL}/api/warm-leads", headers={"Authorization": f"Bearer {token}"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return data if isinstance(data, list) else data.get("leads", [])


def _run(token, lead_id):
    r = requests.post(
        f"{BASE_URL}/api/warm-leads/{lead_id}/agent-run",
        headers={"Authorization": f"Bearer {token}"},
        params={"force": "true"},
        timeout=180,
    )
    assert r.status_code == 200, f"{r.status_code} {r.text[:400]}"
    return r.json()


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9\s]", " ", (s or "").lower())


def _has_your_contact(text: str, referrer: str) -> bool:
    if not text:
        return False
    pat = re.compile(rf"your\s+contact,?\s+{re.escape(referrer)}", re.IGNORECASE)
    return bool(pat.search(text))


def _extract_quoted(text: str):
    # extract quoted excerpts (straight or curly quotes)
    return re.findall(r'[""\"]([^""\"]{15,})[""\"]', text or "")


def _word_overlap(quote: str, source: str, min_run: int = 4) -> bool:
    """Return True if quote contains at least a `min_run` consecutive-word run from source."""
    q_words = _norm(quote).split()
    s_norm = " " + " ".join(_norm(source).split()) + " "
    for i in range(0, len(q_words) - min_run + 1):
        run = " " + " ".join(q_words[i : i + min_run]) + " "
        if run in s_norm:
            return True
    return False


# Pick up to 3 leads with strong testimonial (>=40 chars) to test
def _strong_leads(leads):
    strong = [l for l in leads if len((l.get("referrer_testimonial") or "").strip()) >= 40]
    return strong[:3]


def test_at_least_two_strong_leads_available(leads):
    strong = _strong_leads(leads)
    assert len(strong) >= 2, f"Need >=2 leads with strong testimonials; got {len(strong)}"


@pytest.mark.parametrize("idx", [0, 1, 2])
def test_outreach_your_contact_and_real_quote(token, leads, idx):
    strong = _strong_leads(leads)
    if idx >= len(strong):
        pytest.skip(f"Only {len(strong)} strong leads available")
    lead = strong[idx]
    lead_id = lead["id"]
    referrer = (lead.get("referrer_name") or "").strip()
    testimonial = (lead.get("referrer_testimonial") or "").strip()

    plan = _run(token, lead_id)
    outreach = plan.get("outreach") or plan
    email_body = outreach.get("email_body") or ""
    linkedin = outreach.get("linkedin_message") or ""

    # (a) email
    assert _has_your_contact(email_body, referrer), (
        f"Lead {lead.get('name')}: email_body missing 'your contact {referrer}'.\nBODY:\n{email_body}"
    )
    # (c) linkedin
    assert _has_your_contact(linkedin, referrer), (
        f"Lead {lead.get('name')}: linkedin_message missing 'your contact {referrer}'.\nMSG:\n{linkedin}"
    )

    # (b) real quoted excerpt from testimonial
    quotes = _extract_quoted(email_body)
    assert quotes, (
        f"Lead {lead.get('name')}: no quoted excerpt found in email_body.\nBODY:\n{email_body}"
    )
    overlap_ok = any(_word_overlap(q, testimonial, min_run=4) for q in quotes)
    assert overlap_ok, (
        f"Lead {lead.get('name')}: quotes {quotes!r} do not have a 4+ consecutive-word overlap "
        f"with the referrer testimonial. Testimonial: {testimonial[:200]!r}"
    )
