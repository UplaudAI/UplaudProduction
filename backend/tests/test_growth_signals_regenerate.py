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


def test_review_source_label_from_call_type():
    assert server.review_source_for_call_type("Demo") == "Pre-Sales Demo"
    assert server.review_source_for_call_type("Discovery") == "Pre-Sales Demo"
    assert server.review_source_for_call_type("Feedback") == "Post Sales Testimonial"
    assert server.review_source_for_call_type("Renewal") == "Post Sales Testimonial"
    assert server.review_source_for_call_type("") == ""


async def _fake_generate_insights(*_args, **_kwargs):
    return {
        "company_name": "AI Fiesta",
        "speaker_name": "Anand Pandey",
        "speaker_role": "Customer",
        "sentiment_label": "Mixed",
        "signal_score": 82,
        "call_type": "Feedback",
        "summary": "Customer shared multilingual feedback about AI Fiesta.",
        "motivations": ["Compare premium AI model responses."],
        "pain_points": ["Response quality sometimes differs from original models."],
        "buying_signals": ["Customer has used the product since launch."],
        "objections": [],
        "customer_language": ["I started using AI Fiesta when it launched."],
        "product_feedback": ["Improve transparency around which model answers each prompt."],
        "faqs": [],
        "testimonial": "I've used AI Fiesta since launch and value the model comparison, while wanting clearer response transparency.",
    }


class _FakeRequest:
    base_url = "https://www.uplaud.ai/"


@pytest.mark.asyncio
async def test_analyze_source_does_not_create_public_uplaud_record(monkeypatch):
    source_id = "src_multilingual"
    server.TEMP_SOURCES.clear()
    server.TEMP_SOURCES[source_id] = {
        "id": source_id,
        "owner": "user_123",
        "filename": "multilingual-feedback.pdf",
        "file_type": "pdf",
        "client_name": "Anand Pandey",
        "brand": "AI Fiesta",
        "conversation_code": "CV_001",
        "source_name": "Upload",
        "duration_min": 12,
        "transcript": "Hindi and English feedback about AI Fiesta in one conversation.",
        "word_count": 120,
        "status": "uploaded",
        "created_at": "2026-08-31T00:00:00+00:00",
        "insights": None,
        "testimonial_draft": None,
        "testimonial_is_verbatim": True,
        "share_id": "share_multilingual",
        "testimonial_status": "draft",
        "approved_at": None,
        "approval_requested_at": None,
    }
    created_public_records = []

    async def fake_resolve_current_business_name(*_args, **_kwargs):
        return "AI Fiesta"

    async def fake_upsert_growth_signal(*_args, **_kwargs):
        return None

    async def fake_create_uplaud_record(*args, **kwargs):
        created_public_records.append((args, kwargs))
        return "rec_public"

    monkeypatch.setattr(server, "generate_insights", _fake_generate_insights)
    monkeypatch.setattr(server, "resolve_current_business_name", fake_resolve_current_business_name)
    monkeypatch.setattr(server.airtable_client, "upsert_growth_signal", fake_upsert_growth_signal)
    monkeypatch.setattr(server.airtable_client, "create_uplaud_record", fake_create_uplaud_record)

    out = await server.analyze_source(
        source_id,
        _FakeRequest(),
        current={"id": "user_123", "email": "owner@example.com"},
    )

    assert out.status == "analyzed"
    assert out.testimonial_draft
    assert created_public_records == []


@pytest.mark.asyncio
async def test_approval_writes_review_source_to_public_uplaud_record(monkeypatch):
    source_id = "src_approved"
    share_id = "share_approved"
    server.TEMP_SOURCES.clear()
    server.TEMP_SOURCES[source_id] = {
        "id": source_id,
        "owner": "user_123",
        "filename": "feedback.pdf",
        "file_type": "pdf",
        "client_name": "Anand Pandey",
        "brand": "AI Fiesta",
        "conversation_code": "CV_001",
        "source_name": "Upload",
        "duration_min": 12,
        "transcript": "Post-sales feedback about AI Fiesta.",
        "word_count": 120,
        "status": "analyzed",
        "created_at": "2026-08-31T00:00:00+00:00",
        "insights": {"speaker_name": "Anand Pandey", "call_type": "Feedback"},
        "testimonial_draft": "AI Fiesta helps me compare models, with room for better transparency.",
        "testimonial_is_verbatim": False,
        "share_id": share_id,
        "testimonial_status": "sent",
        "approved_at": None,
        "approval_requested_at": None,
    }
    created_public_records = []

    async def fake_update_growth_signal_by_source_id(*_args, **_kwargs):
        return True

    async def fake_find_or_create_user(*_args, **_kwargs):
        return "rec_user"

    async def fake_create_uplaud_record(*args, **kwargs):
        created_public_records.append((args, kwargs))
        return "rec_public"

    monkeypatch.setattr(server.airtable_client, "update_growth_signal_by_source_id", fake_update_growth_signal_by_source_id)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_find_or_create_user)
    monkeypatch.setattr(server.airtable_client, "create_uplaud_record", fake_create_uplaud_record)

    out = await server.public_approve_testimonial(share_id, _FakeRequest())

    assert out.status == "approved"
    assert created_public_records
    assert created_public_records[0][1]["review_source"] == "Post Sales Testimonial"
