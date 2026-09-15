import os
import sys
import types
from pathlib import Path

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "uplaud_test")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

motor_module = types.ModuleType("motor")
motor_asyncio_module = types.ModuleType("motor.motor_asyncio")


class _FakeAsyncIOMotorClient:
    def __init__(self, *args, **kwargs):
        pass

    def __getitem__(self, _name):
        return None


motor_asyncio_module.AsyncIOMotorClient = _FakeAsyncIOMotorClient
motor_module.motor_asyncio = motor_asyncio_module
sys.modules.setdefault("motor", motor_module)
sys.modules.setdefault("motor.motor_asyncio", motor_asyncio_module)

import server  # noqa: E402


class _FakeRequest:
    base_url = "https://www.uplaud.ai/"
    headers = {}
    cookies = {}


class _FakeResponse:
    def __init__(self, data, status_code=200):
        self._data = data
        self.status_code = status_code
        self.text = str(data)

    def json(self):
        return self._data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.text)


class _FakeAsyncClient:
    calls = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False

    async def post(self, url, data=None, headers=None, timeout=None):
        self.calls.append(("POST", url, data, headers, timeout))
        return _FakeResponse(
            {
                "access_token": "access_123",
                "refresh_token": "refresh_123",
                "expires_in": 3600,
            }
        )


class _FakeConnections:
    def __init__(self):
        self.records = {}

    async def update_one(self, query, update, upsert=False):
        key = query["owner"]
        self.records[key] = {**self.records.get(key, {}), **update["$set"]}

    async def find_one(self, query, projection=None):
        return self.records.get(query["owner"])


class _FakeDb:
    def __init__(self):
        self.fathom_connections = _FakeConnections()


def test_fathom_authorization_url_contains_signed_state(monkeypatch):
    monkeypatch.setenv("FATHOM_CLIENT_ID", "client_123")
    monkeypatch.setenv("FATHOM_REDIRECT_URI", "https://www.uplaud.ai/api/integrations/fathom/callback")

    current = {
        "id": "user_123",
        "email": "buyer@example.com",
        "selected_brand_domain": "example.com",
    }

    url = server.build_fathom_authorization_url(current, _FakeRequest())

    assert "client_id=client_123" in url
    assert "redirect_uri=https%3A%2F%2Fwww.uplaud.ai%2Fapi%2Fintegrations%2Ffathom%2Fcallback" in url
    assert "scope=public_api" in url
    state = url.split("state=", 1)[1].split("&", 1)[0]
    decoded = server.decode_fathom_state(state)
    assert decoded["owner"] == "user_123"
    assert decoded["email"] == "buyer@example.com"
    assert decoded["brand_domain"] == "example.com"


@pytest.mark.asyncio
async def test_fathom_callback_exchanges_and_persists_tokens(monkeypatch):
    monkeypatch.setenv("FATHOM_CLIENT_ID", "client_123")
    monkeypatch.setenv("FATHOM_CLIENT_SECRET", "secret_123")
    monkeypatch.setenv("FATHOM_REDIRECT_URI", "https://www.uplaud.ai/api/integrations/fathom/callback")
    monkeypatch.setattr(server.httpx, "AsyncClient", _FakeAsyncClient)
    fake_db = _FakeDb()
    monkeypatch.setattr(server, "db", fake_db)

    current = {"id": "user_123", "email": "buyer@example.com", "selected_brand_domain": "example.com"}
    state = server.encode_fathom_state(current, _FakeRequest())

    connection = await server.complete_fathom_oauth("code_123", state, _FakeRequest())

    assert connection["owner"] == "user_123"
    assert connection["access_token"] == "access_123"
    assert connection["refresh_token"] == "refresh_123"
    assert connection["brand_domain"] == "example.com"
    assert fake_db.fathom_connections.records["user_123"]["provider"] == "fathom"


def test_fathom_meeting_to_source_doc_formats_transcript():
    doc = server.fathom_meeting_to_source_doc(
        {
            "recording_id": 42,
            "meeting_title": "Acme demo",
            "recording_start_time": "2026-09-11T17:00:00Z",
            "recording_end_time": "2026-09-11T17:30:00Z",
            "calendar_invitees": [{"name": "Jane Buyer", "email": "jane@acme.com", "is_external": True}],
            "transcript": [
                {"timestamp": "00:00:01", "speaker": {"display_name": "Jane Buyer"}, "text": "This solves our onboarding problem."}
            ],
        },
        owner="user_123",
        business_name="Uplaud",
    )

    assert doc["source_name"] == "Fathom"
    assert doc["client_name"] == "Jane Buyer"
    assert doc["brand"] == "Uplaud"
    assert doc["filename"] == "Fathom - Acme demo.txt"
    assert "[00:00:01] Jane Buyer: This solves our onboarding problem." in doc["transcript"]
    assert doc["duration_min"] == 30


@pytest.mark.asyncio
async def test_fathom_connection_survives_without_mongo_via_cookie(monkeypatch):
    monkeypatch.setattr(server, "db", None)
    monkeypatch.setattr(server, "TEMP_FATHOM_CONNECTIONS", {})
    connection = {
        "provider": "fathom",
        "owner": "user_123",
        "email": "buyer@example.com",
        "brand_domain": "example.com",
        "access_token": "access_123",
        "refresh_token": "refresh_123",
        "expires_at": int(server.time.time()) + 3600,
        "connected_at": "2026-09-14T00:00:00+00:00",
        "last_sync_at": None,
        "synced_count": 0,
    }
    cookie_value = server.encode_fathom_connection_cookie(connection)
    request = _FakeRequest()
    request.cookies = {server.FATHOM_CONNECTION_COOKIE: cookie_value}

    restored = await server.get_fathom_connection("user_123", request)

    assert restored["owner"] == "user_123"
    assert restored["access_token"] == "access_123"


@pytest.mark.asyncio
async def test_fathom_disconnect_clears_connection_without_mongo(monkeypatch):
    monkeypatch.setattr(server, "db", None)
    monkeypatch.setattr(server, "TEMP_FATHOM_CONNECTIONS", {"user_123": {"owner": "user_123"}})

    await server.delete_fathom_connection("user_123")

    assert "user_123" not in server.TEMP_FATHOM_CONNECTIONS


@pytest.mark.asyncio
async def test_fathom_auto_sync_preference_updates_connection(monkeypatch):
    monkeypatch.setattr(server, "db", None)
    monkeypatch.setattr(server, "TEMP_FATHOM_CONNECTIONS", {})
    connection = {
        "provider": "fathom",
        "owner": "user_123",
        "email": "buyer@example.com",
        "brand_domain": "example.com",
        "access_token": "access_123",
        "refresh_token": "refresh_123",
        "expires_at": int(server.time.time()) + 3600,
        "connected_at": "2026-09-14T00:00:00+00:00",
        "last_sync_at": None,
        "synced_count": 0,
    }

    updated = await server.update_fathom_auto_sync(connection, enabled=True)

    assert updated["auto_sync_enabled"] is True
    assert updated["auto_sync_interval_hours"] == 2
