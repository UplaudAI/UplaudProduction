import os
import sys
import types
from pathlib import Path

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

from server import record_to_source_out, source_to_out  # noqa: E402


def test_record_to_source_out_exposes_airtable_business_name_as_brand():
    source = record_to_source_out(
        {
            "id": "rec_123",
            "createdTime": "2026-08-07T12:00:00Z",
            "fields": {
                "Business_Name": "Scalis",
                "Source_Id": "src_123",
                "Company": "Atrios",
                "Person": "Deepthi Rao",
            },
        }
    )

    assert source.brand == "Scalis"
    assert source.model_dump()["brand"] == "Scalis"


def test_record_to_source_out_falls_back_to_logged_in_business_name():
    source = record_to_source_out(
        {
            "id": "rec_456",
            "createdTime": "2026-08-07T12:00:00Z",
            "fields": {
                "Source_Id": "src_456",
                "Company": "Atrios",
                "Person": "Deepthi Rao",
            },
        },
        business_name="Kintsugi",
    )

    assert source.brand == "Kintsugi"
    assert source.model_dump()["brand"] == "Kintsugi"


def test_source_to_out_exposes_temp_source_brand():
    source = source_to_out(
        {
            "id": "src_temp",
            "filename": "demo.txt",
            "file_type": "txt",
            "client_name": "Atrios",
            "brand": "Kintsugi",
            "word_count": 100,
            "status": "uploaded",
            "created_at": "2026-08-07T12:00:00Z",
        }
    )

    assert source.brand == "Kintsugi"
    assert source.model_dump()["brand"] == "Kintsugi"
