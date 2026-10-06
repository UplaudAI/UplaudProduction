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


def test_fathom_meeting_type_uses_external_flags_and_domains():
    assert server.fathom_meeting_type(
        {
            "calendar_invitees": [
                {"email": "teammate@uplaud.ai", "is_external": False},
                {"email": "buyer@acme.com", "is_external": True},
            ]
        },
        "uplaud.ai",
    ) == "external"

    assert server.fathom_meeting_type(
        {
            "calendar_invitees": [
                {"email": "deepthi@uplaud.ai", "is_external": False},
                {"email": "teammate@uplaud.ai", "is_external": False},
            ]
        },
        "uplaud.ai",
    ) == "internal"

    assert server.fathom_meeting_type({"calendar_invitees": [{"name": "No Email"}]}, "uplaud.ai") == "unknown"


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


@pytest.mark.asyncio
async def test_fetch_fathom_meetings_paginates_until_limit(monkeypatch):
    calls = []

    class FakeResponse:
        def __init__(self, payload, status_code=200):
            self._payload = payload
            self.status_code = status_code
            self.text = str(payload)

        def json(self):
            return self._payload

        def raise_for_status(self):
            if self.status_code >= 400:
                raise RuntimeError(self.text)

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return False

        async def get(self, url, headers=None, params=None, timeout=None):
            calls.append((url, params or {}))
            if url.endswith("/meetings"):
                if not (params or {}).get("cursor"):
                    return FakeResponse(
                        {
                            "items": [
                                {"recording_id": "1", "meeting_title": "First"},
                                {"recording_id": "2", "meeting_title": "Second"},
                            ],
                            "next_cursor": "cursor_2",
                        }
                    )
                return FakeResponse(
                    {
                        "items": [{"recording_id": "3", "meeting_title": "Third"}],
                    }
                )
            return FakeResponse({"transcript": [{"speaker": {"display_name": "A"}, "text": "Hello."}]})

    async def fake_refresh(connection):
        return {"access_token": "token", "expires_at": int(server.time.time()) + 3600}

    monkeypatch.setattr(server, "refresh_fathom_connection", fake_refresh)
    monkeypatch.setattr(server.httpx, "AsyncClient", FakeClient)

    meetings = await server.fetch_fathom_meetings({"owner": "user_123"}, limit=3)

    assert [meeting["recording_id"] for meeting in meetings] == ["1", "2", "3"]
    meeting_calls = [params for url, params in calls if url.endswith("/meetings")]
    assert meeting_calls == [{"limit": 3}, {"limit": 1, "cursor": "cursor_2"}]


@pytest.mark.asyncio
async def test_fetch_fathom_meetings_fetches_transcript_using_fallback_id(monkeypatch):
    calls = []

    class FakeResponse:
        def __init__(self, payload, status_code=200):
            self._payload = payload
            self.status_code = status_code
            self.text = str(payload)

        def json(self):
            return self._payload

        def raise_for_status(self):
            if self.status_code >= 400:
                raise RuntimeError(self.text)

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return False

        async def get(self, url, headers=None, params=None, timeout=None):
            calls.append(url)
            if url.endswith("/meetings"):
                return FakeResponse(
                    {
                        "items": [
                            {
                                "id": "abc123",
                                "meeting_title": "Demo with transcript",
                            }
                        ]
                    }
                )
            if url.endswith("/recordings/abc123/transcript"):
                return FakeResponse(
                    {
                        "transcript": [
                            {
                                "timestamp": "00:00:01",
                                "speaker": {"display_name": "Buyer"},
                                "text": "This transcript should be found.",
                            }
                        ]
                    }
                )
            return FakeResponse({}, status_code=404)

    async def fake_refresh(connection):
        return {"access_token": "token", "expires_at": int(server.time.time()) + 3600}

    monkeypatch.setattr(server, "refresh_fathom_connection", fake_refresh)
    monkeypatch.setattr(server.httpx, "AsyncClient", FakeClient)

    meetings = await server.fetch_fathom_meetings({"owner": "user_123"}, limit=1)

    assert calls == [
        f"{server.FATHOM_API_BASE}/meetings",
        f"{server.FATHOM_API_BASE}/recordings/abc123/transcript",
    ]
    assert meetings[0]["transcript"][0]["text"] == "This transcript should be found."


@pytest.mark.asyncio
async def test_fathom_expired_connection_does_not_use_auth_401():
    with pytest.raises(server.HTTPException) as exc:
        await server.refresh_fathom_connection({"owner": "user_123", "expires_at": 0})

    assert exc.value.status_code == 409
    assert "Fathom connection has expired" in exc.value.detail


@pytest.mark.asyncio
async def test_fathom_preview_marks_selectable_meetings(monkeypatch):
    server.TEMP_SOURCES.clear()
    server.TEMP_SOURCES["fathom_42"] = {
        "id": "fathom_42",
        "owner": "user_123",
        "source_name": "Fathom",
        "external_id": "42",
        "status": "uploaded",
    }

    async def fake_get_connection(owner, request=None):
        return {"owner": owner, "access_token": "access_123", "expires_at": int(server.time.time()) + 3600}

    async def fake_fetch_meetings(connection, limit=10):
        return [
            {
                "recording_id": 42,
                "meeting_title": "Already synced",
                "calendar_invitees": [{"name": "Jane Buyer", "is_external": True}],
                "transcript": [{"speaker": {"display_name": "Jane"}, "text": "Already here."}],
            },
            {
                "recording_id": 99,
                "meeting_title": "New demo",
                "calendar_invitees": [{"name": "Ravi Buyer", "email": "ravi@acme.com", "is_external": True}],
                "transcript": [{"speaker": {"display_name": "Ravi"}, "text": "This is promising."}],
            },
            {
                "recording_id": 100,
                "meeting_title": "No transcript",
                "calendar_invitees": [{"name": "No Transcript", "is_external": True}],
                "transcript": [],
            },
        ]

    async def fake_growth_signals(current, business_name):
        return []

    monkeypatch.setattr(server, "get_fathom_connection", fake_get_connection)
    monkeypatch.setattr(server, "fetch_fathom_meetings", fake_fetch_meetings)
    monkeypatch.setattr(server, "list_current_user_growth_signals", fake_growth_signals)

    result = await server.preview_fathom_meetings(
        {"id": "user_123", "email": "buyer@example.com"},
        _FakeRequest(),
        limit=10,
    )

    by_id = {item.external_id: item for item in result.meetings}
    assert by_id["42"].already_synced is True
    assert by_id["99"].already_synced is False
    assert by_id["99"].has_transcript is True
    assert by_id["99"].client_email == "ravi@acme.com"
    assert by_id["99"].client_domain == "acme.com"
    assert by_id["99"].word_count == 4
    assert by_id["100"].has_transcript is False


@pytest.mark.asyncio
async def test_import_fathom_meetings_only_imports_selected_ids(monkeypatch):
    server.TEMP_SOURCES.clear()

    async def fake_get_connection(owner, request=None):
        return {
            "owner": owner,
            "access_token": "access_123",
            "expires_at": int(server.time.time()) + 3600,
            "synced_count": 0,
        }

    async def fake_fetch_meetings(connection, limit=10):
        return [
            {
                "recording_id": 101,
                "meeting_title": "Chosen demo",
                "calendar_invitees": [{"name": "Chosen Buyer", "is_external": True}],
                "transcript": [{"speaker": {"display_name": "Chosen"}, "text": "Load this one."}],
            },
            {
                "recording_id": 102,
                "meeting_title": "Skipped demo",
                "calendar_invitees": [{"name": "Skipped Buyer", "is_external": True}],
                "transcript": [{"speaker": {"display_name": "Skipped"}, "text": "Do not load."}],
            },
        ]

    async def fake_business_name(current, request):
        return "Uplaud"

    async def fake_store(connection):
        return None

    async def fake_growth_signals(current, business_name):
        return []

    monkeypatch.setattr(server, "get_fathom_connection", fake_get_connection)
    monkeypatch.setattr(server, "fetch_fathom_meetings", fake_fetch_meetings)
    monkeypatch.setattr(server, "resolve_current_business_name", fake_business_name)
    monkeypatch.setattr(server, "store_fathom_connection", fake_store)
    monkeypatch.setattr(server, "list_current_user_growth_signals", fake_growth_signals)

    result = await server.import_fathom_meetings(
        {"id": "user_123", "email": "buyer@example.com"},
        _FakeRequest(),
        limit=10,
        external_ids=["101"],
    )

    assert result.imported == 1
    assert [source.id for source in result.sources] == ["fathom_101"]
    assert "fathom_101" in server.TEMP_SOURCES
    assert "fathom_102" not in server.TEMP_SOURCES

    server.TEMP_SOURCES.clear()
    empty_result = await server.import_fathom_meetings(
        {"id": "user_123", "email": "buyer@example.com"},
        _FakeRequest(),
        limit=10,
        external_ids=[],
    )
    assert empty_result.imported == 0
    assert server.TEMP_SOURCES == {}


@pytest.mark.asyncio
async def test_fathom_transcript_endpoint_falls_back_to_recording_transcript(monkeypatch):
    server.TEMP_SOURCES.clear()
    updates = []

    async def fake_business_name(current, request):
        return "Ladera"

    async def fake_growth_signals(current, business_name):
        return [
            {
                "id": "rec_123",
                "fields": {
                    "Source_Id": "fathom_987",
                    "Name": "Fathom - Ladera demo.txt",
                    "Business_Name": "Ladera",
                    "Owner_Id": "user_dave",
                    "User": "dave@ladera.ai",
                },
            }
        ]

    async def fake_get_connection(owner, request=None):
        return {
            "owner": owner,
            "access_token": "access_123",
            "expires_at": int(server.time.time()) + 3600,
        }

    async def fake_fetch_recording_transcript(connection, recording_id):
        assert recording_id == "987"
        return [
            {"timestamp": "00:00:01", "speaker": {"display_name": "Dave"}, "text": "This is the missing transcript."}
        ]

    async def fake_update(source_id, owner_id, fields):
        updates.append((source_id, owner_id, fields))
        return True

    monkeypatch.setattr(server, "resolve_current_business_name", fake_business_name)
    monkeypatch.setattr(server, "list_current_user_growth_signals", fake_growth_signals)
    monkeypatch.setattr(server, "get_fathom_connection", fake_get_connection)
    monkeypatch.setattr(server, "fetch_fathom_recording_transcript", fake_fetch_recording_transcript)
    monkeypatch.setattr(server.airtable_client, "update_growth_signal_by_source_id_for_owner", fake_update)

    result = await server.get_source_transcript(
        "fathom_987",
        _FakeRequest(),
        current={"id": "user_dave", "email": "dave@ladera.ai"},
    )

    assert "Dave: This is the missing transcript." in result.transcript
    assert updates == [
        ("fathom_987", "user_dave", {"Transcript_Text": result.transcript})
    ]
