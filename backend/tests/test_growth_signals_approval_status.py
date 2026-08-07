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

from server import _approval_status_after_send  # noqa: E402


def test_send_approval_preserves_approved_status_from_airtable_record():
    rec = {"fields": {"Testimonial_Status": "approved"}}

    assert _approval_status_after_send(None, rec) == "approved"


def test_send_approval_preserves_approved_status_from_temp_doc():
    doc = {"testimonial_status": "approved"}

    assert _approval_status_after_send(doc, None) == "approved"


def test_send_approval_marks_non_approved_as_sent():
    rec = {"fields": {"Testimonial_Status": "draft"}}

    assert _approval_status_after_send(None, rec) == "sent"
