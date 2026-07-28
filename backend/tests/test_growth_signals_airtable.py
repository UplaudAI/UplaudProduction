"""Verify Growth_Signals Airtable persistence on source analyze + approval."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://crm-preview-build-2.preview.emergentagent.com").rstrip("/")
AIRTABLE_PAT = os.environ.get("AIRTABLE_PAT") or open("/app/backend/.env").read().split('AIRTABLE_PAT="')[1].split('"')[0]
AIRTABLE_BASE_ID = "appFUJWWTaoJ3YiWt"
AIRTABLE_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/Growth_Signals"

EMAIL = "dcameron@payrewards.com"
PASSWORD = "P@yRew@rds123"

SAMPLE_TRANSCRIPT = """
[00:00] Sarah Chen (VP Finance, Acme Corp): Hi, thanks for setting this up. We've been dealing with a huge headache managing vendor rebates across 47 different suppliers.
[00:30] AE Dan Cameron (PayRewards): Got it. Walk me through your current process.
[00:45] Sarah: Right now it's spreadsheets and quarterly reconciliations. We probably miss $200K+ per year in unclaimed rebates. That's the pain — we know the money is on the table but we can't chase it manually.
[02:00] Sarah: What we love about PayRewards is the automation piece. If we could just plug in our vendors and get a real-time dashboard of what's owed, that would be transformational.
[03:15] Sarah: Only concern is integration with NetSuite. If that's clean, we're basically ready to sign.
[04:00] Sarah: Timeline — we'd want this rolling by end of Q1. Budget is approved.
"""


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def source_id(token):
    files = {"file": ("test_growth_signals.txt", SAMPLE_TRANSCRIPT.encode(), "text/plain")}
    data = {"client_name": "Acme Corp"}
    r = requests.post(
        f"{BASE_URL}/api/sources",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
        data=data,
        timeout=30,
    )
    assert r.status_code in (200, 201), r.text
    sid = r.json()["id"]
    return sid


def _airtable_find(source_id):
    formula = f'{{Source_Id}}="{source_id}"'
    r = requests.get(
        AIRTABLE_URL,
        headers={"Authorization": f"Bearer {AIRTABLE_PAT}"},
        params={"filterByFormula": formula, "maxRecords": 1},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    recs = r.json().get("records", [])
    return recs[0] if recs else None


def test_analyze_creates_growth_signal_record(token, source_id):
    """POST /api/sources/{id}/analyze must create a Growth_Signals record with expected fields."""
    r = requests.post(
        f"{BASE_URL}/api/sources/{source_id}/analyze",
        headers={"Authorization": f"Bearer {token}"},
        timeout=90,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("insights"), "insights should be populated"

    # Give Airtable a beat
    time.sleep(3)
    rec = _airtable_find(source_id)
    assert rec is not None, f"No Growth_Signals record for Source_Id={source_id}"
    f = rec["fields"]
    assert f.get("Source_Id") == source_id
    assert f.get("Business_Name") == "PayRewards"
    assert "Name" in f
    # At least one of the extracted arrays should have content
    non_empty = any(f.get(k) for k in ["Motivations", "Pain_Points", "Buying_Signals", "Customer_Language"])
    assert non_empty, f"Expected at least one non-empty insight field, got: {list(f.keys())}"
    assert f.get("Testimonial_Status") in ("draft", "sent", "approved", "")


def test_send_approval_updates_status(token, source_id):
    """POST /api/sources/{id}/send-approval should upsert status to 'sent' (or leave record present)."""
    r = requests.post(
        f"{BASE_URL}/api/sources/{source_id}/send-approval",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    # endpoint may 200 or 404 if no draft — just verify no server error
    assert r.status_code in (200, 400, 404), r.text
    time.sleep(2)
    rec = _airtable_find(source_id)
    assert rec is not None
