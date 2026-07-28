"""Unit contracts for the isolated Vercel Blob persistence adapter."""

import asyncio
import io
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image
from starlette.datastructures import Headers
from starlette.requests import Request

import blob_storage
import server


USER = {
    "id": "user-1",
    "email": "owner@scoped.example",
    "name": "Owner",
    "company": "Fallback",
}
BUSINESS = "Scoped Business"
BACKEND_DIR = Path(__file__).resolve().parents[1]


def run(coroutine):
    return asyncio.run(coroutine)


def request():
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/public/testimonial/share-1/approve",
            "headers": [],
            "scheme": "https",
            "server": ("example.test", 443),
        }
    )


def source_record(*, status="sent", draft="Customer-approved words"):
    return {
        "id": "rec-source-1",
        "fields": {
            "Source_Id": "source-1",
            "Business_Name": BUSINESS,
            "Owner_Id": "user-1",
            "Name": "call.txt",
            "File_Type": "txt",
            "Transcript_Text": "Customer says this saves the team hours.",
            "Word_Count": 7,
            "Source_Status": "analyzed",
            "Share_Id": "share-1",
            "Created_At": "2026-07-28T12:00:00+00:00",
            "Company": "Customer Co",
            "Person": "Casey Customer",
            "Testimonial_Draft": draft,
            "Testimonial_Status": status,
        },
    }


def png_bytes():
    output = io.BytesIO()
    Image.new("RGB", (1, 1), "white").save(output, format="PNG")
    return output.getvalue()


class RecordingClient:
    def __init__(self, *, put_result=None, put_error=None, get_result=None):
        self.put_result = put_result or SimpleNamespace(
            url="https://blob.example/file", pathname="stored/file"
        )
        self.put_error = put_error
        self.get_result = get_result
        self.put_calls = []
        self.get_calls = []
        self.delete_calls = []
        self.closed = 0

    async def put(self, pathname, body, **kwargs):
        self.put_calls.append((pathname, body, kwargs))
        if self.put_error:
            raise self.put_error
        return self.put_result

    async def get(self, pathname, **kwargs):
        self.get_calls.append((pathname, kwargs))
        if isinstance(self.get_result, Exception):
            raise self.get_result
        return self.get_result

    async def delete(self, url_or_path):
        self.delete_calls.append(url_or_path)

    async def aclose(self):
        self.closed += 1


def install_client(monkeypatch, client, *, token="blob-token", access="private"):
    token_name = (
        "BLOB_PRIVATE_READ_WRITE_TOKEN"
        if access == "private"
        else "BLOB_PUBLIC_READ_WRITE_TOKEN"
    )
    monkeypatch.setenv(token_name, token)
    other_name = (
        "BLOB_PUBLIC_READ_WRITE_TOKEN"
        if access == "private"
        else "BLOB_PRIVATE_READ_WRITE_TOKEN"
    )
    monkeypatch.delenv(other_name, raising=False)
    monkeypatch.delenv("BLOB_STORAGE_ENABLED", raising=False)
    created_with = []

    def factory(*, token):
        created_with.append(token)
        return client

    monkeypatch.setattr(blob_storage, "AsyncBlobClient", factory)
    return created_with


def test_store_source_uses_private_unique_safe_path_and_content_type(monkeypatch):
    client = RecordingClient()
    created_with = install_client(monkeypatch, client)

    url = run(
        blob_storage.store_source(
            "source-1",
            "../../Customer Call (final).txt",
            b"transcript",
            "text/plain",
        )
    )

    pathname, body, options = client.put_calls[0]
    assert url == "https://blob.example/file"
    assert created_with == ["blob-token"]
    assert pathname.startswith("sources/source-1/")
    assert pathname.endswith("Customer-Call-final-.txt")
    assert ".." not in pathname
    assert body == b"transcript"
    assert options == {
        "access": "private",
        "content_type": "text/plain",
        "add_random_suffix": True,
        "overwrite": False,
    }
    assert client.closed == 1


def test_store_blog_image_uses_public_unique_safe_path(monkeypatch):
    client = RecordingClient(
        put_result=SimpleNamespace(
            url="https://public.blob.example/image", pathname="blog/image.png"
        )
    )
    install_client(monkeypatch, client, access="public")

    url = run(
        blob_storage.store_blog_image(
            "hero image.png", b"png-bytes", "image/png"
        )
    )

    pathname, body, options = client.put_calls[0]
    assert url == "https://public.blob.example/image"
    assert pathname == "blog/hero-image.png"
    assert body == b"png-bytes"
    assert options == {
        "access": "public",
        "content_type": "image/png",
        "add_random_suffix": True,
        "overwrite": False,
    }


@pytest.mark.parametrize("enabled", [None, "0", "false"])
def test_blob_adapter_rejects_missing_token_or_disabled_storage(
    monkeypatch, enabled
):
    monkeypatch.delenv("BLOB_READ_WRITE_TOKEN", raising=False)
    monkeypatch.delenv("VERCEL_BLOB_READ_WRITE_TOKEN", raising=False)
    monkeypatch.delenv("BLOB_PRIVATE_READ_WRITE_TOKEN", raising=False)
    monkeypatch.delenv("BLOB_PUBLIC_READ_WRITE_TOKEN", raising=False)
    if enabled is not None:
        monkeypatch.setenv("BLOB_STORAGE_ENABLED", enabled)

    with pytest.raises(blob_storage.BlobStorageUnavailable):
        run(blob_storage.store_source("source-1", "call.txt", b"x", "text/plain"))


def test_blob_adapter_requires_distinct_access_scoped_store_tokens(monkeypatch):
    client = RecordingClient()
    created_with = []

    def factory(*, token):
        created_with.append(token)
        return client

    monkeypatch.setattr(blob_storage, "AsyncBlobClient", factory)
    monkeypatch.setenv("BLOB_READ_WRITE_TOKEN", "single-fixed-access-store")
    monkeypatch.delenv("BLOB_PRIVATE_READ_WRITE_TOKEN", raising=False)
    monkeypatch.delenv("BLOB_PUBLIC_READ_WRITE_TOKEN", raising=False)

    with pytest.raises(blob_storage.BlobStorageUnavailable):
        run(blob_storage.store_source("source-1", "call.txt", b"x", "text/plain"))

    monkeypatch.setenv("BLOB_PRIVATE_READ_WRITE_TOKEN", "private-store-token")
    monkeypatch.setenv("BLOB_PUBLIC_READ_WRITE_TOKEN", "public-store-token")
    run(blob_storage.store_source("source-1", "call.txt", b"x", "text/plain"))
    run(blob_storage.store_blog_image("hero.png", b"x", "image/png"))

    assert created_with == ["private-store-token", "public-store-token"]


def test_backend_declares_official_vercel_sdk_dependency():
    requirements = (BACKEND_DIR / "requirements.txt").read_text()

    assert "vercel>=0.5.0" in requirements.splitlines()


def test_blob_errors_are_sanitized_and_never_log_token(monkeypatch, caplog):
    token = "super-secret-blob-token"
    client = RecordingClient(put_error=RuntimeError(f"transport leaked {token}"))
    install_client(monkeypatch, client, token=token, access="public")

    with pytest.raises(blob_storage.BlobStorageError) as exc_info:
        run(blob_storage.store_blog_image("hero.png", b"x", "image/png"))

    assert token not in str(exc_info.value)
    assert token not in caplog.text


def test_delete_blob_is_best_effort(monkeypatch):
    client = RecordingClient()
    install_client(monkeypatch, client)

    assert run(blob_storage.delete_blob("https://blob.example/file")) is True
    assert client.delete_calls == ["https://blob.example/file"]

    async def failed_delete(url_or_path):
        raise RuntimeError("delete transport failed")

    client.delete = failed_delete
    assert run(blob_storage.delete_blob("https://blob.example/other")) is False


class AtomicFakeStore:
    """A process-shared fake modeling Blob's overwrite=False atomic create."""

    def __init__(self):
        self.objects = {}
        self.lock = asyncio.Lock()
        self.put_calls = []

    def client(self, *, token):
        store = self

        class Client:
            async def put(self, pathname, body, **kwargs):
                store.put_calls.append((pathname, body, kwargs))
                async with store.lock:
                    if pathname in store.objects:
                        raise RuntimeError("blob_already_exists")
                    store.objects[pathname] = body
                    await asyncio.sleep(0)
                return SimpleNamespace(
                    url=f"https://private.blob.example/{pathname}",
                    pathname=pathname,
                )

            async def get(self, pathname, **kwargs):
                body = store.objects.get(pathname)
                if body is None:
                    raise RuntimeError("not_found")
                return SimpleNamespace(content=body, status_code=200)

            async def delete(self, url_or_path):
                return None

            async def aclose(self):
                return None

        return Client()


def test_approval_receipt_is_private_deterministic_create_once_json(monkeypatch):
    store = AtomicFakeStore()
    monkeypatch.setenv("BLOB_PRIVATE_READ_WRITE_TOKEN", "blob-token")
    monkeypatch.setattr(blob_storage, "AsyncBlobClient", store.client)

    receipt = run(
        blob_storage.get_or_create_approval_receipt(
            share_id="share-1",
            source_id="source-1",
            testimonial="Customer approved words",
            approved_at="2026-07-28T12:30:00+00:00",
        )
    )

    pathname, body, options = store.put_calls[0]
    assert pathname == "approvals/share-1.json"
    assert json.loads(body) == receipt
    assert receipt == {
        "share_id": "share-1",
        "source_id": "source-1",
        "testimonial": "Customer approved words",
        "approved_at": "2026-07-28T12:30:00+00:00",
    }
    assert options == {
        "access": "private",
        "content_type": "application/json",
        "add_random_suffix": False,
        "overwrite": False,
    }


def test_concurrent_different_approvals_return_same_first_receipt(monkeypatch):
    store = AtomicFakeStore()
    monkeypatch.setenv("BLOB_PRIVATE_READ_WRITE_TOKEN", "blob-token")
    monkeypatch.setattr(blob_storage, "AsyncBlobClient", store.client)

    async def approve_both():
        return await asyncio.gather(
            blob_storage.get_or_create_approval_receipt(
                share_id="share-1",
                source_id="source-1",
                testimonial="Approval A",
                approved_at="2026-07-28T12:30:00+00:00",
            ),
            blob_storage.get_or_create_approval_receipt(
                share_id="share-1",
                source_id="source-1",
                testimonial="Approval B",
                approved_at="2026-07-28T12:31:00+00:00",
            ),
        )

    first, second = run(approve_both())

    persisted = json.loads(store.objects["approvals/share-1.json"])
    assert first == second == persisted
    assert persisted["testimonial"] in {"Approval A", "Approval B"}
    assert len(store.objects) == 1


def test_mismatched_existing_approval_receipt_fails_closed(monkeypatch):
    store = AtomicFakeStore()
    store.objects["approvals/share-1.json"] = json.dumps(
        {
            "share_id": "share-1",
            "source_id": "different-source",
            "testimonial": "Tampered words",
            "approved_at": "2026-07-28T12:30:00+00:00",
        }
    ).encode()
    monkeypatch.setenv("BLOB_PRIVATE_READ_WRITE_TOKEN", "blob-token")
    monkeypatch.setattr(blob_storage, "AsyncBlobClient", store.client)

    with pytest.raises(blob_storage.InvalidApprovalReceipt):
        run(
            blob_storage.get_or_create_approval_receipt(
                share_id="share-1",
                source_id="source-1",
                testimonial="Candidate words",
                approved_at="2026-07-28T12:31:00+00:00",
            )
        )


def test_source_upload_stores_private_blob_before_airtable_and_persists_url(
    monkeypatch,
):
    events = []
    persisted = None

    async def fake_business(email):
        return BUSINESS

    async def fake_lookup(share_id):
        if persisted and persisted["fields"]["Share_Id"] == share_id:
            return persisted
        return None

    async def fake_store(source_id, filename, content, content_type):
        events.append(("blob", source_id, filename, content, content_type))
        return "https://private.blob.example/source"

    async def fake_create(**kwargs):
        nonlocal persisted
        events.append(("airtable", dict(kwargs)))
        persisted = source_record(status="draft")
        persisted["fields"].update(
            {
                "Source_Id": kwargs["source_id"],
                "Share_Id": kwargs["share_id"],
                "Source_Status": "uploaded",
                "Testimonial_Status": "draft",
            }
        )
        return persisted

    monkeypatch.setattr(
        server.airtable_client,
        "get_source_business_name_by_email_domain",
        fake_business,
    )
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.blob_storage, "store_source", fake_store)
    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", fake_create)
    upload = UploadFile(
        filename="call.txt",
        file=io.BytesIO(b"Customer says this saves the team hours."),
        headers=Headers({"content-type": "text/plain"}),
    )

    result = run(server.upload_source(upload, current=USER))

    assert [event[0] for event in events] == ["blob", "airtable"]
    assert events[0][2:] == (
        "call.txt",
        b"Customer says this saves the team hours.",
        "text/plain",
    )
    assert events[1][1]["blob_url"] == "https://private.blob.example/source"
    assert result.status == "uploaded"


def test_source_blob_failure_never_creates_airtable_record(monkeypatch):
    writes = []

    async def fake_business(email):
        return BUSINESS

    async def fake_lookup(share_id):
        return None

    async def failed_store(*args, **kwargs):
        raise blob_storage.BlobStorageError("secret SDK transport detail")

    async def unexpected_create(**kwargs):
        writes.append(kwargs)

    monkeypatch.setattr(
        server.airtable_client,
        "get_source_business_name_by_email_domain",
        fake_business,
    )
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.blob_storage, "store_source", failed_store)
    monkeypatch.setattr(
        server.airtable_client, "create_uploaded_source", unexpected_create
    )
    upload = UploadFile(filename="call.txt", file=io.BytesIO(b"usable transcript"))

    with pytest.raises(HTTPException) as exc_info:
        run(server.upload_source(upload, current=USER))

    assert exc_info.value.status_code == 502
    assert "secret SDK transport detail" not in exc_info.value.detail
    assert writes == []


def test_source_airtable_failure_compensates_new_blob(monkeypatch):
    deletes = []

    async def fake_business(email):
        return BUSINESS

    async def fake_lookup(share_id):
        return None

    async def fake_store(*args, **kwargs):
        return "https://private.blob.example/orphan"

    async def failed_create(**kwargs):
        raise RuntimeError("Airtable unavailable")

    async def fake_delete(url):
        deletes.append(url)
        return True

    monkeypatch.setattr(
        server.airtable_client,
        "get_source_business_name_by_email_domain",
        fake_business,
    )
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.blob_storage, "store_source", fake_store)
    monkeypatch.setattr(server.blob_storage, "delete_blob", fake_delete)
    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", failed_create)
    upload = UploadFile(filename="call.txt", file=io.BytesIO(b"usable transcript"))

    with pytest.raises(HTTPException) as exc_info:
        run(server.upload_source(upload, current=USER))

    assert exc_info.value.status_code == 502
    assert deletes == ["https://private.blob.example/orphan"]


def test_admin_upload_returns_durable_public_blob_url(monkeypatch):
    stores = []

    async def fake_store(filename, content, content_type):
        stores.append((filename, content, content_type))
        return "https://public.blob.example/blog/hero-image.png"

    monkeypatch.setattr(server.blob_storage, "store_blog_image", fake_store)
    upload = UploadFile(
        filename="hero-image.png",
        file=io.BytesIO(png_bytes()),
        headers=Headers({"content-type": "image/png"}),
    )

    result = run(server.admin_upload(upload, token="admin"))

    assert result == {"url": "https://public.blob.example/blog/hero-image.png"}
    assert stores == [("hero-image.png", png_bytes(), "image/png")]


@pytest.mark.parametrize(
    ("filename", "content_type", "content"),
    [
        ("hero.png", "image/png", b"<script>alert('not an image')</script>"),
        ("hero.jpg", "image/jpeg", png_bytes()),
    ],
)
def test_admin_upload_rejects_spoofed_or_invalid_image_bytes(
    monkeypatch, filename, content_type, content
):
    stores = []

    async def unexpected_store(*args, **kwargs):
        stores.append((args, kwargs))

    monkeypatch.setattr(server.blob_storage, "store_blog_image", unexpected_store)
    upload = UploadFile(
        filename=filename,
        file=io.BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )

    with pytest.raises(HTTPException) as exc_info:
        run(server.admin_upload(upload, token="admin"))

    assert exc_info.value.status_code == 400
    assert stores == []


@pytest.mark.parametrize(
    ("filename", "content_type"),
    [
        ("hero.svg", "image/svg+xml"),
        ("hero.png", "text/html"),
        ("hero.jpg", "image/png"),
        ("hero", "image/png"),
    ],
)
def test_admin_upload_rejects_invalid_image_mime_or_extension(
    monkeypatch, filename, content_type
):
    stores = []

    async def unexpected_store(*args, **kwargs):
        stores.append((args, kwargs))

    monkeypatch.setattr(server.blob_storage, "store_blog_image", unexpected_store)
    upload = UploadFile(
        filename=filename,
        file=io.BytesIO(b"content"),
        headers=Headers({"content-type": content_type}),
    )

    with pytest.raises(HTTPException) as exc_info:
        run(server.admin_upload(upload, token="admin"))

    assert exc_info.value.status_code == 400
    assert stores == []


def test_admin_upload_rejects_oversize_image_before_blob(monkeypatch):
    stores = []

    async def unexpected_store(*args, **kwargs):
        stores.append((args, kwargs))

    monkeypatch.setattr(server.blob_storage, "store_blog_image", unexpected_store)
    upload = UploadFile(
        filename="hero.png",
        file=io.BytesIO(b"x" * (server.MAX_UPLOAD_BYTES + 1)),
        headers=Headers({"content-type": "image/png"}),
    )

    with pytest.raises(HTTPException) as exc_info:
        run(server.admin_upload(upload, token="admin"))

    assert exc_info.value.status_code == 413
    assert stores == []


def test_admin_blob_failure_is_sanitized(monkeypatch):
    async def failed_store(*args, **kwargs):
        raise blob_storage.BlobStorageUnavailable("secret Blob detail")

    monkeypatch.setattr(server.blob_storage, "store_blog_image", failed_store)
    upload = UploadFile(
        filename="hero.png",
        file=io.BytesIO(png_bytes()),
        headers=Headers({"content-type": "image/png"}),
    )

    with pytest.raises(HTTPException) as exc_info:
        run(server.admin_upload(upload, token="admin"))

    assert exc_info.value.status_code == 503
    assert "secret Blob detail" not in exc_info.value.detail


def test_public_approval_persists_and_reconciles_winning_receipt(monkeypatch):
    sent = source_record(draft="Candidate words")
    persisted = sent
    events = []
    receipt = {
        "share_id": "share-1",
        "source_id": "source-1",
        "testimonial": "First writer words",
        "approved_at": "2026-07-28T12:30:00+00:00",
    }

    async def fake_lookup(share_id):
        return persisted

    async def fake_receipt(**kwargs):
        events.append(("receipt", kwargs))
        return receipt

    async def fake_update(share_id, fields):
        nonlocal persisted
        events.append(("source", dict(fields)))
        persisted = source_record(status="approved", draft="Candidate words")
        persisted["fields"].update(fields)
        return persisted

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        events.append(("uplaud", kwargs))
        return "rec-uplaud"

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(
        server.blob_storage, "get_or_create_approval_receipt", fake_receipt
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    result = run(server.public_approve_testimonial("share-1", request()))

    assert [event[0] for event in events] == ["receipt", "source", "uplaud"]
    assert events[0][1]["testimonial"] == "Candidate words"
    assert events[1][1] == {
        "Testimonial_Status": "approved",
        "Approved_Testimonial": "First writer words",
        "Approved_At": "2026-07-28T12:30:00+00:00",
    }
    assert events[2][1]["testimonial"] == "First writer words"
    assert events[2][1]["date_added"] == "2026-07-28"
    assert result.testimonial == "First writer words"
    assert result.approved_at == "2026-07-28T12:30:00+00:00"


@pytest.mark.parametrize(
    "error",
    [
        blob_storage.BlobStorageUnavailable("down"),
        blob_storage.InvalidApprovalReceipt("mismatch"),
    ],
)
def test_public_approval_fails_closed_when_receipt_unavailable_or_invalid(
    monkeypatch, error
):
    sent = source_record()
    writes = []

    async def fake_lookup(share_id):
        return sent

    async def failed_receipt(**kwargs):
        raise error

    async def unexpected(*args, **kwargs):
        writes.append((args, kwargs))

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(
        server.blob_storage, "get_or_create_approval_receipt", failed_receipt
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", unexpected)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", unexpected)

    with pytest.raises(HTTPException) as exc_info:
        run(server.public_approve_testimonial("share-1", request()))

    assert exc_info.value.status_code in {409, 503}
    assert writes == []
