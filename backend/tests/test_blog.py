import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://voice-to-campaign.preview.emergentagent.com").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "P@yRew@rds123")

@pytest.fixture(scope="module")
def admin_headers():
    return {"X-Admin-Token": ADMIN_PASSWORD}

def test_blog_list_public():
    r = requests.get(f"{BASE_URL}/api/blog?limit=5", timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "posts" in data
    assert len(data["posts"]) > 0
    post = data["posts"][0]
    assert "title" in post
    assert "slug" in post
    assert "excerpt" in post
    assert "content" in post
    assert "author" in post
    assert "published" in post
    assert "created_at" in post

def test_blog_detail_public():
    # Fetch first post
    r_list = requests.get(f"{BASE_URL}/api/blog?limit=1", timeout=10)
    assert r_list.status_code == 200
    slug = r_list.json()["posts"][0]["slug"]
    
    r_detail = requests.get(f"{BASE_URL}/api/blog/{slug}", timeout=10)
    assert r_detail.status_code == 200, r_detail.text
    post = r_detail.json()
    assert post["slug"] == slug
    assert "title" in post

def test_blog_detail_not_found():
    r = requests.get(f"{BASE_URL}/api/blog/non-existent-slug-12345", timeout=10)
    assert r.status_code == 404

def test_blog_admin_unauthorized():
    r = requests.get(f"{BASE_URL}/api/admin/blog", headers={"X-Admin-Token": "wrong-token"}, timeout=10)
    assert r.status_code == 401

def test_blog_crud_flow(admin_headers):
    # 1. Create a post
    payload = {
        "title": "Test Blog Post Created by Test",
        "slug": "test-blog-post-temp",
        "excerpt": "This is a temporary test excerpt.",
        "content": "This is a temporary test markdown content.",
        "cover_image": "https://example.com/test.jpg",
        "tag": "Test",
        "author": "Test Author",
        "published": True
    }
    r_create = requests.post(f"{BASE_URL}/api/blog", json=payload, headers=admin_headers, timeout=10)
    assert r_create.status_code == 200, r_create.text
    post = r_create.json()
    assert post["slug"] == "test-blog-post-temp"
    assert post["title"] == payload["title"]
    
    # 2. Get the post in admin list
    r_list = requests.get(f"{BASE_URL}/api/admin/blog?limit=10", headers=admin_headers, timeout=10)
    assert r_list.status_code == 200
    posts = r_list.json()["posts"]
    assert any(p["slug"] == "test-blog-post-temp" for p in posts)
    
    # 3. Update the post
    payload_update = {
        "title": "Test Blog Post UPDATED",
        "slug": "test-blog-post-temp",
        "excerpt": "This is an updated test excerpt.",
        "content": "This is an updated test markdown content.",
        "cover_image": "https://example.com/test-updated.jpg",
        "tag": "Test-Updated",
        "author": "Test Author Updated",
        "published": True
    }
    r_update = requests.put(f"{BASE_URL}/api/blog/test-blog-post-temp", json=payload_update, headers=admin_headers, timeout=10)
    assert r_update.status_code == 200, r_update.text
    post_updated = r_update.json()
    assert post_updated["title"] == "Test Blog Post UPDATED"
    
    # 4. Delete the post
    r_delete = requests.delete(f"{BASE_URL}/api/blog/test-blog-post-temp", headers=admin_headers, timeout=10)
    assert r_delete.status_code == 200, r_delete.text
    
    # Verify deleted
    r_check = requests.get(f"{BASE_URL}/api/blog/test-blog-post-temp", timeout=10)
    assert r_check.status_code == 404

def test_admin_upload(admin_headers):
    files = {"file": ("test_upload_image.png", b"fake-image-content-1234", "image/png")}
    r = requests.post(f"{BASE_URL}/api/admin/upload", files=files, headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    assert "url" in r.json()
    assert r.json()["url"].startswith("/uploads/")
