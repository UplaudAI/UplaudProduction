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
        return {}


motor_asyncio_module.AsyncIOMotorClient = _FakeAsyncIOMotorClient
motor_module.motor_asyncio = motor_asyncio_module
sys.modules.setdefault("motor", motor_module)
sys.modules.setdefault("motor.motor_asyncio", motor_asyncio_module)

import server  # noqa: E402


class _Request:
    headers = {}


def _current():
    return {"id": "user_123", "email": "owner@example.com", "company": "Example"}


@pytest.mark.asyncio
async def test_list_sources_returns_newest_conversations_first(monkeypatch):
    async def fake_business_name(*_args, **_kwargs):
        return "Example"

    async def fake_records(*_args, **_kwargs):
        return [
            {
                "id": "rec_old",
                "fields": {
                    "Source_Id": "old",
                    "Company": "OldCo",
                    "Created_At": "2026-08-01T10:00:00+00:00",
                },
            },
            {
                "id": "rec_new",
                "fields": {
                    "Source_Id": "new",
                    "Company": "NewCo",
                    "Created_At": "2026-10-01T10:00:00+00:00",
                },
            },
        ]

    server.TEMP_SOURCES.clear()
    server.TEMP_SOURCES["mid"] = {
        "id": "mid",
        "owner": "user_123",
        "filename": "mid.txt",
        "file_type": "txt",
        "client_name": "MidCo",
        "brand": "Example",
        "conversation_code": "CV_001",
        "source_name": "Upload",
        "duration_min": 3,
        "transcript": "hello",
        "word_count": 1,
        "status": "uploaded",
        "created_at": "2026-09-01T10:00:00+00:00",
        "share_id": "share_mid",
    }
    monkeypatch.setattr(server, "resolve_current_business_name", fake_business_name)
    monkeypatch.setattr(server, "list_current_user_growth_signals", fake_records)

    sources = await server.list_sources(_Request(), _current())

    assert [source.id for source in sources] == ["new", "mid", "old"]


@pytest.mark.asyncio
async def test_delete_source_removes_temp_source_for_owner(monkeypatch):
    deleted_airtable = []

    async def fake_delete_airtable(source_id, owner_id):
        deleted_airtable.append((source_id, owner_id))
        return False

    server.TEMP_SOURCES.clear()
    server.TEMP_SOURCES["temp_1"] = {
        "id": "temp_1",
        "owner": "user_123",
        "filename": "temp.txt",
    }
    monkeypatch.setattr(
        server.airtable_client,
        "delete_growth_signal_by_source_id_for_owner",
        fake_delete_airtable,
    )

    result = await server.delete_source("temp_1", _Request(), _current())

    assert result == {"deleted": True}
    assert "temp_1" not in server.TEMP_SOURCES
    assert deleted_airtable == [("temp_1", "user_123")]


@pytest.mark.asyncio
async def test_delete_source_deletes_airtable_record_for_owner(monkeypatch):
    deleted_airtable = []

    async def fake_delete_airtable(source_id, owner_id):
        deleted_airtable.append((source_id, owner_id))
        return True

    server.TEMP_SOURCES.clear()
    monkeypatch.setattr(
        server.airtable_client,
        "delete_growth_signal_by_source_id_for_owner",
        fake_delete_airtable,
    )

    result = await server.delete_source("src_1", _Request(), _current())

    assert result == {"deleted": True}
    assert deleted_airtable == [("src_1", "user_123")]
