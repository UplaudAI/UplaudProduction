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
from server import _growth_signal_record_to_regen_doc, build_insights_prompt  # noqa: E402


def test_insights_prompt_names_authenticated_business_as_product_being_demoed():
    prompt = build_insights_prompt(
        transcript=(
            "Sydney (Iru AE): I can show you Iru's MDM workflows.\n"
            "Deepthi Rao (Founder, Uplaud): SOC 2 compliance is urgent for us."
        ),
        client_name="Iru + Uplaud AI Introduction",
        business_name="Iru",
    )

    assert "The authenticated Uplaud workspace/business is \"Iru\"." in prompt
    assert "Treat \"Iru\" as the seller/product being evaluated" in prompt
    assert "Never attribute the testimonial to \"Iru\"" in prompt


def test_insights_prompt_preserves_synthesis_while_rejecting_ai_marketing_voice():
    prompt = build_insights_prompt(
        transcript="Deepthi Rao: SOC 2 compliance quickly is crucial for us.",
        client_name="Iru demo",
        business_name="Iru",
    )

    assert "Synthesize the strongest feedback, buying signals, pains, and product reactions" in prompt
    assert "Do NOT merely concatenate a few short quote fragments" in prompt
    assert "Preserve the customer's actual wording and point of view" in prompt
    assert "Avoid polished AI/marketing filler" in prompt


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


def test_review_rating_from_sentiment():
    assert server.review_rating_from_insights({"review_rating": 4}) == 4
    assert server.review_rating_from_insights({"testimonial_rating": "3"}) == 3
    assert server.review_rating_from_insights({"sentiment_label": "Positive"}) == 5
    assert server.review_rating_from_insights({"sentiment_label": "Neutral"}) == 3
    assert server.review_rating_from_insights({"sentiment_label": "Negative"}) == 2
    assert server.review_rating_from_insights({}) == 5


async def _fake_generate_insights(*_args, **_kwargs):
    return {
        "company_name": "AI Fiesta",
        "speaker_name": "Anand Pandey",
        "speaker_role": "Customer",
        "sentiment_label": "Mixed",
        "signal_score": 82,
        "call_type": "Feedback",
        "review_rating": 4,
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
    synced_users = []

    async def fake_resolve_current_business_name(*_args, **_kwargs):
        return "AI Fiesta"

    async def fake_upsert_growth_signal(*_args, **_kwargs):
        return None

    async def fake_create_uplaud_record(*args, **kwargs):
        created_public_records.append((args, kwargs))
        return "rec_public"

    async def fake_find_or_create_user(*args, **kwargs):
        synced_users.append((args, kwargs))
        return "rec_user"

    monkeypatch.setattr(server, "generate_insights", _fake_generate_insights)
    monkeypatch.setattr(server, "resolve_current_business_name", fake_resolve_current_business_name)
    monkeypatch.setattr(server.airtable_client, "upsert_growth_signal", fake_upsert_growth_signal)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_find_or_create_user)
    monkeypatch.setattr(server.airtable_client, "create_uplaud_record", fake_create_uplaud_record)

    out = await server.analyze_source(
        source_id,
        _FakeRequest(),
        current={"id": "user_123", "email": "owner@example.com"},
    )

    assert out.status == "analyzed"
    assert out.testimonial_draft
    assert synced_users
    assert synced_users[0][1]["name"] == "Anand Pandey"
    assert synced_users[0][1]["extra_fields"] == {"Company": "AI Fiesta"}
    assert created_public_records == []


@pytest.mark.asyncio
async def test_analyze_source_passes_authenticated_business_to_insights_generator(monkeypatch):
    source_id = "src_iru_demo"
    server.TEMP_SOURCES.clear()
    server.TEMP_SOURCES[source_id] = {
        "id": source_id,
        "owner": "user_123",
        "filename": "Iru + Uplaud AI Introduction.pdf",
        "file_type": "pdf",
        "client_name": "Iru + Uplaud AI Introduction",
        "brand": "Iru",
        "conversation_code": "CV_002",
        "source_name": "Upload",
        "duration_min": 24,
        "transcript": "Sydney from Iru demos MDM software to Deepthi Rao, Founder of Uplaud.",
        "word_count": 450,
        "status": "uploaded",
        "created_at": "2026-09-08T00:00:00+00:00",
        "insights": None,
        "testimonial_draft": None,
        "testimonial_is_verbatim": True,
        "share_id": "share_iru",
        "testimonial_status": "draft",
        "approved_at": None,
        "approval_requested_at": None,
    }
    calls = []
    upsert_calls = []

    async def fake_resolve_current_business_name(*_args, **_kwargs):
        return "Iru"

    async def fake_generate_insights(*args, **kwargs):
        calls.append((args, kwargs))
        return {
            "company_name": "Uplaud",
            "speaker_name": "Deepthi Rao",
            "speaker_role": "Founder",
            "sentiment_label": "Positive",
            "signal_score": 82,
            "call_type": "Demo",
            "review_rating": 4,
            "summary": "Deepthi evaluated Iru's MDM software for Uplaud.",
            "motivations": ["Needs fast SOC 2 compliance support."],
            "pain_points": ["Compliance readiness is time-sensitive."],
            "buying_signals": ["Asked detailed implementation questions."],
            "objections": [],
            "customer_language": ["SOC 2 compliance is urgent for us."],
            "product_feedback": ["Iru's MDM workflows looked admin-friendly."],
            "faqs": [],
            "testimonial": "Iru's MDM workflows looked promising for our compliance needs.",
        }

    async def fake_upsert_growth_signal(*args, **kwargs):
        upsert_calls.append((args, kwargs))
        return None

    async def fake_find_or_create_user(*_args, **_kwargs):
        return "rec_user"

    monkeypatch.setattr(server, "resolve_current_business_name", fake_resolve_current_business_name)
    monkeypatch.setattr(server, "generate_insights", fake_generate_insights)
    monkeypatch.setattr(server.airtable_client, "upsert_growth_signal", fake_upsert_growth_signal)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_find_or_create_user)

    await server.analyze_source(
        source_id,
        _FakeRequest(),
        current={"id": "user_123", "email": "sydney@iru.com", "name": "Sydney"},
    )

    assert calls
    assert calls[0][1]["business_name"] == "Iru"
    assert upsert_calls
    assert upsert_calls[0][1]["owner_id"] == "user_123"
    assert upsert_calls[0][1]["owner_email"] == "sydney@iru.com"


@pytest.mark.asyncio
async def test_list_sources_queries_growth_signals_by_business_and_owner(monkeypatch):
    server.TEMP_SOURCES.clear()
    queried = []

    async def fake_resolve_current_business_name(*_args, **_kwargs):
        return "Shared Business"

    async def fake_list_growth_signals_by_business_owner(business_name, owner_id):
        queried.append((business_name, owner_id))
        return [
            {
                "id": "rec_user_owned",
                "createdTime": "2026-09-18T00:00:00Z",
                "fields": {
                    "Source_Id": "src_user_owned",
                    "Business_Name": business_name,
                    "Owner_Id": owner_id,
                    "Company": "Buyer Co",
                    "Person": "Buyer",
                },
            }
        ]

    monkeypatch.setattr(server, "resolve_current_business_name", fake_resolve_current_business_name)
    monkeypatch.setattr(
        server.airtable_client,
        "list_growth_signals_by_business_owner",
        fake_list_growth_signals_by_business_owner,
    )

    out = await server.list_sources(
        _FakeRequest(),
        current={"id": "user_abc", "email": "owner@example.com", "name": "Owner"},
    )

    assert queried == [("Shared Business", "user_abc")]
    assert [source.id for source in out] == ["src_user_owned"]


@pytest.mark.asyncio
async def test_analyze_source_keeps_synthesized_customer_voice_testimonial(monkeypatch):
    source_id = "src_customer_voice"
    server.TEMP_SOURCES.clear()
    server.TEMP_SOURCES[source_id] = {
        "id": source_id,
        "owner": "user_123",
        "filename": "Iru demo.pdf",
        "file_type": "pdf",
        "client_name": "Deepthi Rao",
        "brand": "Iru",
        "conversation_code": "CV_003",
        "source_name": "Upload",
        "duration_min": 24,
        "transcript": (
            "Deepthi Rao: SOC 2 compliance quickly is crucial for us, especially with fintech customers waiting. "
            "I'm cautious about AI promises. "
            "I like that it keeps compliance in check continuously, rather than just before audits."
        ),
        "word_count": 450,
        "status": "uploaded",
        "created_at": "2026-09-08T00:00:00+00:00",
        "insights": None,
        "testimonial_draft": None,
        "testimonial_is_verbatim": True,
        "share_id": "share_verbatim",
        "testimonial_status": "draft",
        "approved_at": None,
        "approval_requested_at": None,
    }
    saved = []

    async def fake_resolve_current_business_name(*_args, **_kwargs):
        return "Iru"

    async def fake_generate_insights(*_args, **_kwargs):
        return {
            "company_name": "Uplaud",
            "speaker_name": "Deepthi Rao",
            "speaker_role": "Founder",
            "sentiment_label": "Positive",
            "signal_score": 82,
            "call_type": "Demo",
            "review_rating": 4,
            "summary": "Deepthi evaluated Iru.",
            "motivations": ["Needs fast SOC 2 compliance support."],
            "pain_points": ["Compliance readiness is time-sensitive."],
            "buying_signals": ["Asked detailed implementation questions."],
            "objections": [],
            "customer_language": [
                "SOC 2 compliance quickly is crucial for us, especially with fintech customers waiting.",
                "I'm cautious about AI promises.",
                "I like that it keeps compliance in check continuously, rather than just before audits.",
            ],
            "product_feedback": ["Continuous compliance was appealing."],
            "faqs": [],
            "testimonial": (
                "SOC 2 compliance quickly is crucial for us, especially with fintech customers waiting. "
                "I like that Iru treats it as an ongoing process, not just something we scramble on before audits. "
                "I'm still cautious about AI promises, but having compliance in check continuously makes sense for us. "
                "I want to discuss it with my engineer and understand how it would fit into what we already do."
            ),
        }

    async def fake_upsert_growth_signal(*args, **kwargs):
        saved.append((args, kwargs))
        return None

    async def fake_find_or_create_user(*_args, **_kwargs):
        return "rec_user"

    monkeypatch.setattr(server, "resolve_current_business_name", fake_resolve_current_business_name)
    monkeypatch.setattr(server, "generate_insights", fake_generate_insights)
    monkeypatch.setattr(server.airtable_client, "upsert_growth_signal", fake_upsert_growth_signal)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_find_or_create_user)

    out = await server.analyze_source(
        source_id,
        _FakeRequest(),
        current={"id": "user_123", "email": "sydney@iru.com", "name": "Sydney"},
    )

    assert out.testimonial_is_verbatim is False
    assert out.testimonial_draft == (
        "SOC 2 compliance quickly is crucial for us, especially with fintech customers waiting. "
        "I like that Iru treats it as an ongoing process, not just something we scramble on before audits. "
        "I'm still cautious about AI promises, but having compliance in check continuously makes sense for us. "
        "I want to discuss it with my engineer and understand how it would fit into what we already do."
    )
    assert saved[0][1]["testimonial_draft"] == out.testimonial_draft


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
        "insights": {"speaker_name": "Anand Pandey", "call_type": "Feedback", "review_rating": 4},
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
    assert created_public_records[0][1]["uplaud_score"] == 4
