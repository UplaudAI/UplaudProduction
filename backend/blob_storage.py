"""Small, testable boundary around the official Vercel Blob Python SDK."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any

try:
    from vercel.blob import AsyncBlobClient
except ImportError:  # The dependency is installed in deployed environments.
    AsyncBlobClient = None


logger = logging.getLogger("uplaud.blob")

_FALSE_VALUES = {"0", "false", "no", "off"}
_RECEIPT_KEYS = {"share_id", "source_id", "testimonial", "approved_at"}
_RECEIPT_ID = re.compile(r"[A-Za-z0-9_-]{1,256}\Z")
MAX_APPROVAL_RECEIPT_BYTES = 64 * 1024


class BlobStorageError(RuntimeError):
    """A sanitized Blob operation failure."""


class BlobStorageUnavailable(BlobStorageError):
    """Blob storage is disabled, unconfigured, or temporarily unavailable."""


class InvalidApprovalReceipt(BlobStorageError):
    """A persisted approval receipt is malformed or belongs to another source."""


def _storage_enabled() -> bool:
    setting = os.environ.get("BLOB_STORAGE_ENABLED", "true").strip().lower()
    return setting not in _FALSE_VALUES


def _token_for(access: str) -> str:
    if not _storage_enabled():
        raise BlobStorageUnavailable("Blob storage is unavailable.")
    scoped_name = (
        "BLOB_PRIVATE_READ_WRITE_TOKEN"
        if access == "private"
        else "BLOB_PUBLIC_READ_WRITE_TOKEN"
    )
    other_name = (
        "BLOB_PUBLIC_READ_WRITE_TOKEN"
        if access == "private"
        else "BLOB_PRIVATE_READ_WRITE_TOKEN"
    )
    token = os.environ.get(scoped_name)
    if not token:
        raise BlobStorageUnavailable("Blob storage is unavailable.")
    if token == os.environ.get(other_name):
        raise BlobStorageUnavailable("Blob storage is unavailable.")
    return token


def _new_client(access: str):
    if AsyncBlobClient is None:
        raise BlobStorageUnavailable("Blob storage is unavailable.")
    try:
        return AsyncBlobClient(token=_token_for(access))
    except BlobStorageError:
        raise
    except Exception:
        raise BlobStorageUnavailable("Blob storage is unavailable.") from None


async def _close_client(client: Any) -> None:
    close = getattr(client, "aclose", None)
    if close is not None:
        try:
            await close()
        except Exception:
            logger.warning("Vercel Blob client cleanup failed")


def _safe_component(value: str, fallback: str) -> str:
    basename = (value or "").replace("\\", "/").rsplit("/", 1)[-1]
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "-", basename).lstrip(".")
    return sanitized[:180] or fallback


def _mapped_error(exc: Exception) -> BlobStorageError:
    unavailable_names = {
        "BlobAccessError",
        "BlobClientTokenExpiredError",
        "BlobNoTokenProvidedError",
        "BlobServiceNotAvailable",
        "BlobServiceRateLimited",
        "BlobStoreNotFoundError",
        "BlobStoreSuspendedError",
    }
    if exc.__class__.__name__ in unavailable_names:
        return BlobStorageUnavailable("Blob storage is unavailable.")
    return BlobStorageError("Blob operation failed.")


async def _store(
    pathname: str,
    content: bytes,
    *,
    access: str,
    content_type: str,
    add_random_suffix: bool,
) -> str:
    client = _new_client(access)
    try:
        result = await client.put(
            pathname,
            content,
            access=access,
            content_type=content_type,
            add_random_suffix=add_random_suffix,
            overwrite=False,
        )
        url = getattr(result, "url", "")
        if not isinstance(url, str) or not url:
            raise BlobStorageError("Blob upload returned an invalid result.")
        return url
    except BlobStorageError:
        raise
    except Exception as exc:
        logger.warning("Vercel Blob upload failed")
        raise _mapped_error(exc) from None
    finally:
        await _close_client(client)


async def store_source(
    source_id: str,
    filename: str,
    content: bytes,
    content_type: str,
) -> str:
    """Create a private source Blob once and reconcile safe same-ID retries."""
    safe_source_id = _safe_component(source_id, "source")
    safe_filename = _safe_component(filename, "upload.bin")
    pathname = f"sources/{safe_source_id}/{safe_filename}"
    client = _new_client("private")
    try:
        try:
            result = await client.put(
                pathname,
                content,
                access="private",
                content_type=content_type or "application/octet-stream",
                add_random_suffix=False,
                overwrite=False,
            )
        except Exception as put_error:
            # A conflict or lost response is safe to reconcile because source IDs
            # have deterministic create-once paths. Size/path checks prevent a
            # different object from being silently adopted.
            try:
                existing = await client.head(pathname)
            except Exception:
                logger.warning("Vercel Blob source create failed")
                raise _mapped_error(put_error) from None
            existing_path = getattr(existing, "pathname", "")
            existing_size = getattr(existing, "size", None)
            existing_url = getattr(existing, "url", "")
            if (
                existing_path != pathname
                or existing_size != len(content)
                or not isinstance(existing_url, str)
                or not existing_url
            ):
                logger.warning("Vercel Blob source reconciliation failed")
                raise BlobStorageError("Blob operation failed.") from None
            return existing_url
        url = getattr(result, "url", "")
        if not isinstance(url, str) or not url:
            raise BlobStorageError("Blob upload returned an invalid result.")
        return url
    except BlobStorageError:
        raise
    except Exception as exc:
        logger.warning("Vercel Blob source upload failed")
        raise _mapped_error(exc) from None
    finally:
        await _close_client(client)


async def store_blog_image(
    filename: str,
    content: bytes,
    content_type: str,
) -> str:
    """Store a public blog image with a safe, collision-resistant pathname."""
    safe_filename = _safe_component(filename, "image.bin")
    return await _store(
        f"blog/{safe_filename}",
        content,
        access="public",
        content_type=content_type or "application/octet-stream",
        add_random_suffix=True,
    )


def _validate_timestamp(value: Any) -> bool:
    if not isinstance(value, str) or not value:
        return False
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return parsed.tzinfo is not None


def _validate_receipt(
    value: Any, *, expected_share_id: str, expected_source_id: str
) -> dict:
    if not isinstance(value, dict) or set(value) != _RECEIPT_KEYS:
        raise InvalidApprovalReceipt("Approval receipt is invalid.")
    if (
        value.get("share_id") != expected_share_id
        or value.get("source_id") != expected_source_id
        or not isinstance(value.get("testimonial"), str)
        or not value["testimonial"].strip()
        or not _validate_timestamp(value.get("approved_at"))
    ):
        raise InvalidApprovalReceipt("Approval receipt is invalid.")
    return dict(value)


async def _receipt_content(result: Any) -> bytes:
    declared_size = getattr(result, "size", None)
    if isinstance(declared_size, int) and declared_size > MAX_APPROVAL_RECEIPT_BYTES:
        raise InvalidApprovalReceipt("Approval receipt is invalid.")
    content = getattr(result, "content", None)
    if isinstance(content, str):
        encoded = content.encode("utf-8")
        if len(encoded) > MAX_APPROVAL_RECEIPT_BYTES:
            raise InvalidApprovalReceipt("Approval receipt is invalid.")
        return encoded
    if isinstance(content, (bytes, bytearray, memoryview)):
        encoded = bytes(content)
        if len(encoded) > MAX_APPROVAL_RECEIPT_BYTES:
            raise InvalidApprovalReceipt("Approval receipt is invalid.")
        return encoded
    stream = getattr(result, "stream", None)
    if stream is not None:
        chunks = []
        size = 0
        async for chunk in stream:
            encoded = bytes(chunk)
            size += len(encoded)
            if size > MAX_APPROVAL_RECEIPT_BYTES:
                raise InvalidApprovalReceipt("Approval receipt is invalid.")
            chunks.append(encoded)
        return b"".join(chunks)
    raise InvalidApprovalReceipt("Approval receipt is invalid.")


async def _load_receipt(
    client: Any,
    pathname: str,
    *,
    share_id: str,
    source_id: str,
) -> dict | None:
    try:
        result = await client.get(pathname, access="private", use_cache=False)
    except Exception as exc:
        is_not_found = exc.__class__.__name__ == "BlobNotFoundError"
        if is_not_found or "not_found" in str(exc).lower():
            return None
        raise _mapped_error(exc) from None
    if result is None:
        return None
    if getattr(result, "status_code", 200) != 200:
        raise InvalidApprovalReceipt("Approval receipt is invalid.")
    try:
        decoded = json.loads((await _receipt_content(result)).decode("utf-8"))
    except InvalidApprovalReceipt:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise InvalidApprovalReceipt("Approval receipt is invalid.") from None
    return _validate_receipt(
        decoded,
        expected_share_id=share_id,
        expected_source_id=source_id,
    )


async def get_or_create_approval_receipt(
    *,
    share_id: str,
    source_id: str,
    testimonial: str,
    approved_at: str | None = None,
) -> dict:
    """Atomically freeze the first approval snapshot for one public share ID."""
    if not _RECEIPT_ID.fullmatch(share_id or ""):
        raise InvalidApprovalReceipt("Approval receipt identity is invalid.")
    if not _RECEIPT_ID.fullmatch(source_id or ""):
        raise InvalidApprovalReceipt("Approval receipt identity is invalid.")
    testimonial = (testimonial or "").strip()
    timestamp = approved_at or datetime.now(timezone.utc).isoformat()
    candidate = _validate_receipt(
        {
            "share_id": share_id,
            "source_id": source_id,
            "testimonial": testimonial,
            "approved_at": timestamp,
        },
        expected_share_id=share_id,
        expected_source_id=source_id,
    )
    pathname = f"approvals/{share_id}.json"
    body = json.dumps(candidate, sort_keys=True, separators=(",", ":")).encode("utf-8")
    if len(body) > MAX_APPROVAL_RECEIPT_BYTES:
        raise InvalidApprovalReceipt("Approval receipt is invalid.")
    client = _new_client("private")
    try:
        try:
            await client.put(
                pathname,
                body,
                access="private",
                content_type="application/json",
                add_random_suffix=False,
                overwrite=False,
            )
            return candidate
        except Exception as put_error:
            # SDK 0.5.x maps an already-existing pathname to a generic Blob
            # error. Reading after any failed create safely covers both that
            # conflict and the case where the create committed before a lost
            # response, without ever overwriting the first receipt.
            existing = await _load_receipt(
                client,
                pathname,
                share_id=share_id,
                source_id=source_id,
            )
            if existing is not None:
                return existing
            logger.warning("Vercel Blob approval receipt create failed")
            raise _mapped_error(put_error) from None
    finally:
        await _close_client(client)
