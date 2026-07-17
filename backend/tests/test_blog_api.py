"""Backend blog module + leads regression tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-acquisition-hub-2.preview.emergentagent.com').rstrip('/')
ADMIN_TOKEN = "uplaud-admin-c9f7e2a1"
SEED_SLUG = "why-word-of-mouth-converts-5x-better-than-paid-ads"
TEST_SLUG = "ai-acquisition-hub-2"  # slug used by admin CRUD flow per problem statement


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers():
    return {"X-Admin-Token": ADMIN_TOKEN, "Content-Type": "application/json"}


# --- Blog: Public GETs ---
class TestBlogPublic:
    def test_latest_returns_seed_post(self, api):
        r = api.get(f"{BASE_URL}/api/blog/latest?limit=3")
        assert r.status_code == 200
        data = r.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)
        slugs = [p.get("slug") for p in data["posts"]]
        assert SEED_SLUG in slugs, f"Expected seed post in latest, got slugs: {slugs}"

    def test_get_seed_post_by_slug(self, api):
        r = api.get(f"{BASE_URL}/api/blog/{SEED_SLUG}")
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == SEED_SLUG
        assert "title" in d and d["title"]
        assert "excerpt" in d and d["excerpt"]
        assert "content" in d and d["content"]
        assert d.get("tag") == "Growth"
        assert d.get("published") is True

    def test_list_blog_ok(self, api):
        r = api.get(f"{BASE_URL}/api/blog?limit=20")
        assert r.status_code == 200
        assert "posts" in r.json()

    def test_get_missing_slug_404(self, api):
        r = api.get(f"{BASE_URL}/api/blog/definitely-does-not-exist-slug-xyz")
        assert r.status_code == 404


# --- Blog: Admin Auth ---
class TestBlogAdminAuth:
    def test_post_without_token_401(self, api):
        payload = {"title": "TEST_no_token", "excerpt": "x", "content": "x"}
        r = api.post(f"{BASE_URL}/api/blog", json=payload)
        assert r.status_code == 401

    def test_post_wrong_token_401(self, api):
        payload = {"title": "TEST_wrong_token", "excerpt": "x", "content": "x"}
        r = api.post(f"{BASE_URL}/api/blog", json=payload, headers={"X-Admin-Token": "wrong-token-xxx"})
        assert r.status_code == 401

    def test_admin_list_without_token_401(self, api):
        r = api.get(f"{BASE_URL}/api/admin/blog")
        assert r.status_code == 401

    def test_admin_list_with_token_200(self, api):
        r = api.get(f"{BASE_URL}/api/admin/blog", headers={"X-Admin-Token": ADMIN_TOKEN})
        assert r.status_code == 200
        assert "posts" in r.json()


# --- Blog: Admin CRUD End-to-End ---
class TestBlogAdminCRUD:
    def test_full_crud_flow(self, api, admin_headers):
        # Cleanup pre-existing test slug in case of prior failed run
        api.delete(f"{BASE_URL}/api/blog/{TEST_SLUG}", headers=admin_headers)

        # CREATE with explicit slug
        create_payload = {
            "title": "TEST AI Acquisition Hub 2",
            "slug": TEST_SLUG,
            "excerpt": "Test excerpt for admin crud flow",
            "content": "# Hello\n\nSome **content** here.",
            "tag": "TestTag",
            "author": "TEST Bot",
            "published": True,
        }
        r = api.post(f"{BASE_URL}/api/blog", json=create_payload, headers=admin_headers)
        assert r.status_code == 201, f"Create failed: {r.status_code} {r.text}"
        created = r.json()
        assert created["slug"] == TEST_SLUG
        assert created["title"] == "TEST AI Acquisition Hub 2"
        assert created["tag"] == "TestTag"
        assert "id" in created

        # Verify GET by slug
        r = api.get(f"{BASE_URL}/api/blog/{TEST_SLUG}")
        assert r.status_code == 200
        assert r.json()["title"] == "TEST AI Acquisition Hub 2"

        # UPDATE
        upd_payload = {
            "title": "TEST AI Acquisition Hub 2 Updated",
            "slug": TEST_SLUG,
            "excerpt": "Updated excerpt",
            "content": "Updated body",
            "tag": "TestTagUpd",
            "author": "TEST Bot",
            "published": True,
        }
        r = api.put(f"{BASE_URL}/api/blog/{TEST_SLUG}", json=upd_payload, headers=admin_headers)
        assert r.status_code == 200, f"Update failed: {r.status_code} {r.text}"
        updated = r.json()
        assert updated["title"] == "TEST AI Acquisition Hub 2 Updated"
        assert updated["excerpt"] == "Updated excerpt"

        # Verify update persisted
        r = api.get(f"{BASE_URL}/api/blog/{TEST_SLUG}")
        assert r.status_code == 200
        assert r.json()["title"] == "TEST AI Acquisition Hub 2 Updated"

        # DELETE
        r = api.delete(f"{BASE_URL}/api/blog/{TEST_SLUG}", headers=admin_headers)
        assert r.status_code == 204

        # Verify deletion
        r = api.get(f"{BASE_URL}/api/blog/{TEST_SLUG}")
        assert r.status_code == 404

        # Verify not in list
        r = api.get(f"{BASE_URL}/api/blog?limit=50")
        assert r.status_code == 200
        slugs = [p["slug"] for p in r.json()["posts"]]
        assert TEST_SLUG not in slugs


# --- Regression: Leads ---
class TestLeadsRegression:
    def test_create_lead_still_works(self, api):
        payload = {
            "name": "TEST Regression User",
            "email": "test-regression@example.com",
            "company": "TEST Co",
            "message": "Blog regression test lead",
        }
        r = api.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 201, f"Lead create failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("email_sent") is True, f"Expected email_sent=true, got: {data}"
        assert "id" in data


# --- Admin Upload endpoint (fal.ai balance is exhausted; wiring / auth / MIME only) ---
class TestAdminUpload:
    def _png_bytes(self):
        # 1x1 transparent PNG
        import base64
        return base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        )

    def test_upload_without_token_401(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            files={"file": ("t.png", self._png_bytes(), "image/png")},
        )
        assert r.status_code == 401, f"expected 401, got {r.status_code} {r.text}"

    def test_upload_wrong_token_401(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers={"X-Admin-Token": "totally-wrong"},
            files={"file": ("t.png", self._png_bytes(), "image/png")},
        )
        assert r.status_code == 401, f"expected 401, got {r.status_code} {r.text}"

    def test_upload_bad_mime_400(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers={"X-Admin-Token": ADMIN_TOKEN},
            files={"file": ("t.txt", b"hello world", "text/plain")},
        )
        assert r.status_code == 400, f"expected 400 for text/plain, got {r.status_code} {r.text}"
        detail = (r.json() or {}).get("detail", "")
        assert "Unsupported" in detail or "unsupported" in detail.lower()

    def test_upload_empty_image_400(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers={"X-Admin-Token": ADMIN_TOKEN},
            files={"file": ("empty.png", b"", "image/png")},
        )
        assert r.status_code == 400, f"expected 400 for empty file, got {r.status_code} {r.text}"

    def test_upload_valid_png_wiring(self):
        """
        With a valid PNG + correct token + allowed MIME, the request should reach fal.ai.
        Because the fal.ai account has zero balance, expected result is 502 (CDN upload failed).
        Any 2xx is also acceptable (would mean balance was topped up).
        We assert that we did NOT get 400/401/413/503 — meaning our wiring/auth/validation
        passed and the failure (if any) is strictly upstream.
        """
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers={"X-Admin-Token": ADMIN_TOKEN},
            files={"file": ("t.png", self._png_bytes(), "image/png")},
            timeout=120,
        )
        assert r.status_code not in (400, 401, 413, 503), (
            f"Wiring broken: {r.status_code} {r.text}"
        )
        assert r.status_code in (201, 502), (
            f"Unexpected status: {r.status_code} {r.text}"
        )
        if r.status_code == 502:
            # Confirm the failure was routed through fal.ai path.
            # Note: response body may be an HTML error page from the ingress rather than the
            # backend's JSON detail, so we accept either shape.
            body_text = r.text or ""
            try:
                detail = (r.json() or {}).get("detail", "")
            except Exception:
                detail = body_text
            assert (
                "CDN upload failed" in detail
                or "fal" in detail.lower()
                or "502" in body_text
                or "bad gateway" in body_text.lower()
            ), f"expected fal.ai/CDN error on 502, got: {detail!r} / body={body_text[:200]!r}"

