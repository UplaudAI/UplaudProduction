"""Backend API tests for Uplaud Growth Engine."""
import os
import io
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://uplaud-growth-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EMAIL = "dcameron@payrewards.com"
PASSWORD = "P@yRew@rds123"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["email"] == EMAIL
    assert isinstance(data["token"], str) and len(data["token"]) > 20
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Auth ----
def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": "wrong"}, timeout=30)
    assert r.status_code == 401


def test_me_without_token():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401


def test_me_with_token(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == EMAIL
    assert data["company"] == "PayRewards"


# ---- Sources upload/list ----
SAMPLE_TRANSCRIPT = (
    "David (PayRewards): Thanks for joining the demo today. How's things at BrightPath?\n"
    "Sarah (BrightPath): Great, honestly. We've been looking for a customer growth engine like this for months.\n"
    "David: What excites you most about Uplaud?\n"
    "Sarah: The testimonial generation is a game changer! We could 10x our referral pipeline.\n"
    "David: Any concerns?\n"
    "Sarah: Just integration timeline, but the ROI looks fantastic. Let's move forward.\n"
)


@pytest.fixture(scope="session")
def uploaded_source(auth_headers):
    files = {"file": ("TEST_brightpath_demo.txt", io.BytesIO(SAMPLE_TRANSCRIPT.encode()), "text/plain")}
    r = requests.post(f"{API}/sources", headers=auth_headers, files=files, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["file_type"] == "txt"
    assert data["word_count"] > 10
    assert data["status"] == "uploaded"
    assert "id" in data
    return data


def test_upload_and_list(auth_headers, uploaded_source):
    r = requests.get(f"{API}/sources", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    ids = [s["id"] for s in r.json()]
    assert uploaded_source["id"] in ids


def test_analyze_source(auth_headers, uploaded_source):
    sid = uploaded_source["id"]
    r = requests.post(f"{API}/sources/{sid}/analyze", headers=auth_headers, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "analyzed"
    assert data["insights"] is not None
    assert "summary" in data["insights"]
    assert data["testimonial_draft"]


def test_update_testimonial(auth_headers, uploaded_source):
    sid = uploaded_source["id"]
    new_text = "TEST_UPDATED testimonial draft."
    r = requests.put(f"{API}/sources/{sid}/testimonial",
                     headers=auth_headers, json={"testimonial_draft": new_text}, timeout=30)
    assert r.status_code == 200
    assert r.json()["testimonial_draft"] == new_text
    # Verify persistence
    r2 = requests.get(f"{API}/sources/{sid}", headers=auth_headers, timeout=30)
    assert r2.json()["testimonial_draft"] == new_text


def test_email_draft(auth_headers, uploaded_source):
    sid = uploaded_source["id"]
    r = requests.get(f"{API}/sources/{sid}/email-draft", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "subject" in data and "body" in data
    assert data["attachment_name"].endswith(".pdf")


# ---- Public testimonial page + send-approval ----
@pytest.fixture(scope="session")
def approved_source(auth_headers, uploaded_source):
    """Analyze then send-approval on the uploaded source to get share_id."""
    sid = uploaded_source["id"]
    # ensure analyzed (may already be from test_analyze_source but idempotent-ish)
    requests.post(f"{API}/sources/{sid}/analyze", headers=auth_headers, timeout=90)
    r = requests.post(f"{API}/sources/{sid}/send-approval", headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "share_id" in data and data["share_id"]
    assert data["public_path"] == f"/t/{data['share_id']}"
    return {"source_id": sid, "share_id": data["share_id"]}


def test_send_approval_updates_status(auth_headers, approved_source):
    sid = approved_source["source_id"]
    r = requests.get(f"{API}/sources", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    src = next(s for s in r.json() if s["id"] == sid)
    assert src["share_id"] == approved_source["share_id"]
    assert src["testimonial_status"] in ("sent", "approved")
    assert src.get("approval_requested_at")


def test_public_get_testimonial(approved_source):
    sid = approved_source["share_id"]
    r = requests.get(f"{API}/public/testimonial/{sid}", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["share_id"] == sid
    assert data["status"] in ("sent", "draft", "approved")
    assert data["testimonial"]


def test_public_update_testimonial(approved_source):
    sid = approved_source["share_id"]
    new_text = "TEST_public_edited testimonial."
    r = requests.put(f"{API}/public/testimonial/{sid}", json={"testimonial_draft": new_text}, timeout=30)
    assert r.status_code == 200
    assert r.json()["testimonial"] == new_text
    # verify persisted via GET
    r2 = requests.get(f"{API}/public/testimonial/{sid}", timeout=30)
    assert r2.json()["testimonial"] == new_text


def test_public_approve_and_lock(approved_source, auth_headers):
    sid = approved_source["share_id"]
    r = requests.post(f"{API}/public/testimonial/{sid}/approve", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "approved"
    # subsequent edit blocked
    r2 = requests.put(f"{API}/public/testimonial/{sid}", json={"testimonial_draft": "should fail"}, timeout=30)
    assert r2.status_code == 400
    # internal source reflects approved
    r3 = requests.get(f"{API}/sources", headers=auth_headers, timeout=30)
    src = next(s for s in r3.json() if s["id"] == approved_source["source_id"])
    assert src["testimonial_status"] == "approved"
    assert src.get("approved_at")


def test_public_get_invalid_share():
    r = requests.get(f"{API}/public/testimonial/does-not-exist", timeout=30)
    assert r.status_code == 404
