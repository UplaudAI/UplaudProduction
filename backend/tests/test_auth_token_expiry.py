"""Tests to verify the JWT token expiry bug fix.
- ACCESS_TOKEN_HOURS is now 168h (7 days)
- Invalid/expired token returns 401 with proper detail
- Wrong login credentials return 401 (from login endpoint, no token involved)
"""
import os
import jwt
import time
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "http://localhost:8001"
if not BASE_URL.startswith("http"):
    BASE_URL = "http://localhost:8001"

# Read the same JWT secret used by backend
JWT_SECRET = None
try:
    with open("/app/backend/.env") as f:
        for line in f:
            if line.startswith("JWT_SECRET="):
                JWT_SECRET = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
except Exception:
    pass

EMAIL = "dcameron@payrewards.com"
PASSWORD = "P@yRew@rds123"


def _login():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    return data["token"]


def test_login_returns_token_with_7day_expiry():
    token = _login()
    # decode without verification to inspect exp
    payload = jwt.decode(token, options={"verify_signature": False})
    exp_ts = payload["exp"]
    now_ts = datetime.now(timezone.utc).timestamp()
    delta_hours = (exp_ts - now_ts) / 3600.0
    # Should be ~168h; allow 165-170 window
    assert 160 < delta_hours <= 170, f"expected ~168h expiry, got {delta_hours:.2f}h"


def test_valid_token_accesses_protected_endpoint():
    token = _login()
    r = requests.get(f"{BASE_URL}/api/warm-leads", headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert r.status_code == 200, f"warm-leads with valid token: {r.status_code} {r.text[:200]}"


def test_invalid_token_returns_401():
    r = requests.get(f"{BASE_URL}/api/warm-leads", headers={"Authorization": "Bearer garbage.token.string"}, timeout=15)
    assert r.status_code == 401
    detail = r.json().get("detail", "")
    assert "Invalid" in detail or "token" in detail.lower()


def test_expired_token_returns_401():
    """Craft a JWT that is already expired using the same secret."""
    if not JWT_SECRET:
        import pytest
        pytest.skip("JWT_SECRET not readable")
    expired_payload = {
        "sub": "nonexistent-user",
        "email": EMAIL,
        "type": "access",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    expired = jwt.encode(expired_payload, JWT_SECRET, algorithm="HS256")
    r = requests.get(f"{BASE_URL}/api/warm-leads", headers={"Authorization": f"Bearer {expired}"}, timeout=15)
    assert r.status_code == 401
    detail = r.json().get("detail", "")
    assert "expired" in detail.lower(), f"expected 'expired' in detail, got: {detail}"


def test_no_token_returns_401():
    r = requests.get(f"{BASE_URL}/api/warm-leads", timeout=15)
    assert r.status_code == 401


def test_wrong_password_returns_401_from_login():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": "wrong-pass"}, timeout=15)
    assert r.status_code == 401


def test_upload_source_with_valid_token():
    """Regression: normal upload path works."""
    token = _login()
    files = {"file": ("TEST_expiry_check.txt", b"Client call transcript. Customer said they love the product. Signed up for pro plan.", "text/plain")}
    r = requests.post(f"{BASE_URL}/api/sources", files=files, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    assert r.status_code in (200, 201), f"POST /api/sources: {r.status_code} {r.text[:200]}"
    src = r.json()
    assert "id" in src
