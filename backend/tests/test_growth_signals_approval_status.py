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
import server  # noqa: E402


def test_send_approval_preserves_approved_status_from_airtable_record():
    rec = {"fields": {"Testimonial_Status": "approved"}}

    assert _approval_status_after_send(None, rec) == "approved"


def test_send_approval_preserves_approved_status_from_temp_doc():
    doc = {"testimonial_status": "approved"}

    assert _approval_status_after_send(doc, None) == "approved"


def test_send_approval_marks_non_approved_as_sent():
    rec = {"fields": {"Testimonial_Status": "draft"}}

    assert _approval_status_after_send(None, rec) == "sent"


def test_anonymous_publish_uses_verified_prospect_placeholder_for_demo():
    assert server.anonymous_reviewer_label("Pre-Sales Demo") == "Verified Prospect"
    assert server.anonymous_reviewer_label("Discovery") == "Verified Prospect"


def test_anonymous_publish_uses_verified_customer_placeholder_for_customer_feedback():
    assert server.anonymous_reviewer_label("Post Sales Testimonial") == "Verified Customer"
    assert server.anonymous_reviewer_label("Customer Feedback") == "Verified Customer"


def test_growth_signal_public_doc_marks_anonymous_publish_without_losing_real_speaker():
    doc = server._growth_signal_record_to_pub_doc(
        {
            "id": "rec_anon",
            "fields": {
                "Source_Id": "src_anon",
                "Share_Id": "share_anon",
                "Business_Name": "Uplaud",
                "Company": "Prospect Co",
                "Person": "Jane Buyer",
                "Role": "Founder",
                "Call_Type": "Pre-Sales Demo",
                "Testimonial_Draft": "The ongoing compliance workflow makes sense.",
                "Testimonial_Status": "anonymous_published",
            },
        }
    )

    assert doc["testimonial_status"] == "anonymous_published"
    assert doc["anonymous_reviewer_name"] == "Verified Prospect"
    assert doc["insights"]["speaker_name"] == "Jane Buyer"
