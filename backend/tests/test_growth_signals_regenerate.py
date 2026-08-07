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

from server import _growth_signal_record_to_regen_doc  # noqa: E402


def test_regen_doc_uses_all_available_growth_signal_fields_as_context():
    doc = _growth_signal_record_to_regen_doc(
        {
            "id": "rec_123",
            "fields": {
                "Name": "Atrios demo",
                "Company": "Atrios",
                "Person": "Deepthi Rao",
                "Testimonial_Draft": "The product felt seamless and intuitive.",
                "Motivations": "Needed a better hiring workflow.",
                "Pain_Points": "Everything else felt clunky.",
                "Buying_Signals": "I am excited to refer it to friends.",
                "Customer_Language": "one of the best I've seen so far",
                "Product_Feedback": "Pricing model is reasonable.",
                "FAQs": "Can we use unlimited seats?",
                "Testimonial_Status": "sent",
                "Share_Id": "share_123",
            },
        },
        source_id="src_123",
        owner_id="user_123",
        business_name="Scalis",
    )

    assert doc["brand"] == "Scalis"
    assert doc["share_id"] == "share_123"
    assert doc["testimonial_status"] == "sent"
    assert "Existing testimonial" in doc["transcript"]
    assert "Everything else felt clunky." in doc["transcript"]
    assert "one of the best I've seen so far" in doc["transcript"]
    assert "Can we use unlimited seats?" in doc["transcript"]
