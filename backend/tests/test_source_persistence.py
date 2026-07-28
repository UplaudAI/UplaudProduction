"""Local contracts for durable, tenant-scoped source persistence."""

import asyncio
import importlib.util
import io

import pytest
from fastapi import HTTPException, UploadFile
from starlette.requests import Request

import airtable_client
import server


USER = {
    "id": "user-1",
    "email": "owner@scoped.example",
    "name": "Owner",
    "company": "Fallback",
}
BUSINESS = "Scoped Business"


def run(coroutine):
    return asyncio.run(coroutine)


def request():
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/sources/source-1/analyze",
            "headers": [],
            "scheme": "https",
            "server": ("example.test", 443),
        }
    )


def record(*, status="uploaded", business=BUSINESS, owner="user-1", transcript=None):
    fields = {
        "Source_Id": "source-1",
        "Business_Name": business,
        "Owner_Id": owner,
        "Name": "customer-call.txt",
        "File_Type": "txt",
        "Word_Count": 8,
        "Source_Status": status,
        "Share_Id": "share-1",
        "Created_At": "2026-07-28T12:00:00+00:00",
    }
    if transcript is not None:
        fields["Transcript_Text"] = transcript
    if status == "analyzed":
        fields.update(
            {
                "Company": "Customer Co",
                "Person": "Casey Customer",
                "Role": "COO",
                "Sentiment": "Positive",
                "Signal_Score": 91,
                "Call_Type": "Demo",
                "Customer_Language": "This saves our team hours.",
                "Testimonial_Draft": "This saves our team hours.",
                "Testimonial_Status": "draft",
            }
        )
    return {"id": "rec-source-1", "createdTime": "2026-07-28T12:00:00.000Z", "fields": fields}


def install_business(monkeypatch):
    async def fake_business_name(email):
        assert email == USER["email"]
        return BUSINESS

    monkeypatch.setattr(
        server.airtable_client,
        "get_business_name_by_email_domain",
        fake_business_name,
    )


def test_create_uploaded_source_writes_exact_growth_signal_fields(monkeypatch):
    calls = []

    async def fake_create(table, fields):
        calls.append((table, fields))
        return {"id": "rec-source-1", "fields": fields}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_create", fake_create)

    result = run(
        airtable_client.create_uploaded_source(
            source_id="source-1",
            business_name=BUSINESS,
            owner_id="user-1",
            filename="customer-call.txt",
            file_type="txt",
            transcript_text="A durable transcript.",
            word_count=3,
            share_id="share-1",
            created_at="2026-07-28T12:00:00+00:00",
        )
    )

    expected_fields = {
        "Source_Id": "source-1",
        "Business_Name": BUSINESS,
        "Owner_Id": "user-1",
        "Name": "customer-call.txt",
        "File_Type": "txt",
        "Transcript_Text": "A durable transcript.",
        "Word_Count": 3,
        "Source_Status": "uploaded",
        "Share_Id": "share-1",
        "Created_At": "2026-07-28T12:00:00+00:00",
    }
    assert calls == [(airtable_client.TABLE_GROWTH_SIGNALS, expected_fields)]
    assert result == {"id": "rec-source-1", "fields": expected_fields}


def test_create_uploaded_source_includes_blob_url_only_when_provided(monkeypatch):
    writes = []

    async def fake_create(table, fields):
        writes.append(fields)
        return {"id": "rec-source-1", "fields": fields}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_create", fake_create)

    run(
        airtable_client.create_uploaded_source(
            source_id="source-1",
            business_name=BUSINESS,
            owner_id="user-1",
            filename="call.txt",
            file_type="txt",
            transcript_text="hello",
            word_count=1,
            share_id="share-1",
            created_at="now",
            blob_url="https://blob.example/source-1",
        )
    )

    assert writes[0]["Blob_Url"] == "https://blob.example/source-1"


def test_get_source_by_id_uses_source_business_and_owner_scope(monkeypatch):
    calls = []

    async def fake_get(table, params):
        calls.append((table, params))
        return {"records": [record()]}

    monkeypatch.setattr(airtable_client, "_get", fake_get)

    result = run(
        airtable_client.get_source_by_id(
            "source-1", BUSINESS, owner_id="user-1"
        )
    )

    assert result["id"] == "rec-source-1"
    formula = calls[0][1]["filterByFormula"]
    assert calls[0][0] == airtable_client.TABLE_GROWTH_SIGNALS
    assert '{Source_Id}="source-1"' in formula
    assert '{Business_Name}="Scoped Business"' in formula
    assert '{Owner_Id}="user-1"' in formula
    assert calls[0][1]["maxRecords"] == 1


@pytest.mark.parametrize(
    "unexpected",
    [
        record(business="Other Business"),
        record(owner="other-user"),
    ],
)
def test_get_source_by_id_rejects_unexpected_cross_tenant_record(
    monkeypatch, unexpected
):
    async def fake_get(table, params):
        return {"records": [unexpected]}

    monkeypatch.setattr(airtable_client, "_get", fake_get)

    result = run(
        airtable_client.get_source_by_id(
            "source-1", BUSINESS, owner_id="user-1"
        )
    )

    assert result is None


def test_update_source_by_id_updates_scoped_existing_record(monkeypatch):
    calls = []

    async def fake_get_source(source_id, business_name, owner_id=None):
        calls.append(("get", source_id, business_name, owner_id))
        return record()

    async def fake_update(table, record_id, fields):
        calls.append(("update", table, record_id, fields))
        return {"id": record_id, "fields": {**record()["fields"], **fields}}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "get_source_by_id", fake_get_source)
    monkeypatch.setattr(airtable_client, "_update", fake_update)

    result = run(
        airtable_client.update_source_by_id(
            "source-1",
            BUSINESS,
            {"Source_Status": "analyzed"},
            owner_id="user-1",
        )
    )

    assert calls == [
        ("get", "source-1", BUSINESS, "user-1"),
        (
            "update",
            airtable_client.TABLE_GROWTH_SIGNALS,
            "rec-source-1",
            {"Source_Status": "analyzed"},
        ),
    ]
    assert result["fields"]["Source_Status"] == "analyzed"


def test_list_growth_signals_scopes_business_owner_and_legacy_rows(monkeypatch):
    calls = []

    async def fake_get_all(table, params):
        calls.append((table, params))
        return [record(), record(owner=""), record(owner="other-user")]

    monkeypatch.setattr(airtable_client, "_get_all", fake_get_all)

    result = run(
        airtable_client.list_growth_signals_by_business(
            BUSINESS, owner_id="user-1"
        )
    )

    assert len(result) == 2
    formula = calls[0][1]["filterByFormula"]
    assert '{Business_Name}="Scoped Business"' in formula
    assert '{Owner_Id}="user-1"' in formula
    assert "{Owner_Id}=BLANK()" in formula


def test_upsert_uplaud_record_is_atomic_by_share_link(monkeypatch):
    calls = []

    async def fake_upsert(table, fields, merge_fields):
        calls.append((table, fields, merge_fields))
        return {"id": "rec-uplaud", "fields": fields}

    monkeypatch.setattr(airtable_client, "_upsert_by_fields", fake_upsert)

    result = run(
        airtable_client.upsert_uplaud_record(
            business_name=BUSINESS,
            testimonial="Durable quote",
            reviewer_record_id="rec-user",
            share_link="https://example.test/t/share-1",
            date_added="2026-07-28",
        )
    )

    assert result == "rec-uplaud"
    assert calls == [
        (
            airtable_client.TABLE_UPLAUD,
            {
                "business_name": BUSINESS,
                "Uplaud": "Durable quote",
                "Reviewer": ["rec-user"],
                "Share Link": "https://example.test/t/share-1",
                "Date_Added": "2026-07-28",
            },
            ["Share Link"],
        )
    ]


@pytest.mark.parametrize("operation", ["create", "update"])
def test_source_writes_fail_strictly_when_airtable_is_disabled(monkeypatch, operation):
    monkeypatch.setattr(airtable_client, "_enabled", lambda: False)

    if operation == "create":
        coroutine = airtable_client.create_uploaded_source(
            source_id="source-1",
            business_name=BUSINESS,
            owner_id="user-1",
            filename="call.txt",
            file_type="txt",
            transcript_text="hello",
            word_count=1,
            share_id="share-1",
            created_at="now",
        )
    else:
        coroutine = airtable_client.update_source_by_id(
            "source-1", BUSINESS, {"Source_Status": "analyzed"}
        )

    with pytest.raises(RuntimeError, match="Airtable source persistence is unavailable"):
        run(coroutine)


def test_upload_persists_transcript_before_returning_success(monkeypatch):
    install_business(monkeypatch)
    writes = []

    async def fake_create(**kwargs):
        writes.append(kwargs)
        return record(transcript=kwargs["transcript_text"])

    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", fake_create)
    upload = UploadFile(
        filename="customer-call.txt",
        file=io.BytesIO(b"Customer says the product saves our entire team hours."),
    )

    result = run(server.upload_source(upload, current=USER))

    assert len(writes) == 1
    assert writes[0]["business_name"] == BUSINESS
    assert writes[0]["owner_id"] == "user-1"
    assert writes[0]["transcript_text"].startswith("Customer says")
    assert result.status == "uploaded"
    assert result.id == "source-1"


def test_upload_failure_is_sanitized_and_never_returns_success(monkeypatch):
    install_business(monkeypatch)

    async def failed_create(**kwargs):
        raise RuntimeError("secret Airtable transport detail")

    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", failed_create)
    upload = UploadFile(filename="call.txt", file=io.BytesIO(b"usable transcript"))

    with pytest.raises(HTTPException) as exc_info:
        run(server.upload_source(upload, current=USER))

    assert exc_info.value.status_code == 502
    assert "secret Airtable transport detail" not in exc_info.value.detail


def test_upload_rejects_transcript_over_safe_airtable_limit_before_write(monkeypatch):
    install_business(monkeypatch)
    writes = []

    async def fake_create(**kwargs):
        writes.append(kwargs)

    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", fake_create)
    upload = UploadFile(
        filename="too-large.txt",
        file=io.BytesIO(b"x" * (server.MAX_AIRTABLE_TRANSCRIPT_CHARS + 1)),
    )

    with pytest.raises(HTTPException) as exc_info:
        run(server.upload_source(upload, current=USER))

    assert exc_info.value.status_code == 413
    assert writes == []


def test_list_sources_maps_uploaded_and_analyzed_airtable_records(monkeypatch):
    install_business(monkeypatch)
    uploaded = record(transcript="raw transcript")
    analyzed = record(status="analyzed", transcript="raw transcript")
    analyzed["fields"]["Source_Id"] = "source-2"

    async def fake_list(business_name, owner_id=None):
        assert business_name == BUSINESS
        assert owner_id == "user-1"
        return [uploaded, analyzed]

    monkeypatch.setattr(server.airtable_client, "list_growth_signals_by_business", fake_list)

    result = run(server.list_sources(current=USER))

    assert [item.status for item in result] == ["uploaded", "analyzed"]
    assert result[0].insights is None
    assert result[0].word_count == 8
    assert result[1].insights.speaker_name == "Casey Customer"


def test_get_source_uses_tenant_scoped_repository_and_denies_missing(monkeypatch):
    install_business(monkeypatch)
    calls = []

    async def fake_get(source_id, business_name, owner_id=None):
        calls.append((source_id, business_name, owner_id))
        return None

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)

    with pytest.raises(HTTPException) as exc_info:
        run(server.get_source("other-business-source", current=USER))

    assert exc_info.value.status_code == 404
    assert calls == [("other-business-source", BUSINESS, "user-1")]


def test_analyze_uses_full_persisted_transcript_and_updates_same_record(monkeypatch):
    install_business(monkeypatch)
    transcript = "Full persisted transcript with exact customer language and context."
    source_record = record(transcript=transcript)
    generated_with = []
    updates = []
    uplaud_upserts = []

    async def fake_get(source_id, business_name, owner_id=None):
        assert (source_id, business_name, owner_id) == (
            "source-1",
            BUSINESS,
            "user-1",
        )
        return source_record

    async def fake_generate(text, client_name, variation=0, avoid=""):
        generated_with.append((text, client_name, variation, avoid))
        return {
            "company_name": "Customer Co",
            "speaker_name": "Casey Customer",
            "speaker_role": "COO",
            "ae_name": "Alex AE",
            "summary": "A useful call.",
            "customer_language": ["This saves our team hours."],
            "testimonial": "This saves our team hours.",
        }

    async def fake_update(source_id, business_name, fields, owner_id=None):
        updates.append((source_id, business_name, fields, owner_id))
        return {
            **source_record,
            "fields": {**source_record["fields"], **fields},
        }

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud_upsert(**kwargs):
        uplaud_upserts.append(kwargs)
        return "rec-uplaud"

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(
        server.airtable_client,
        "upsert_uplaud_record",
        fake_uplaud_upsert,
        raising=False,
    )

    result = run(server.analyze_source("source-1", request(), current=USER))

    assert generated_with[0][0] == transcript
    assert updates[0][0] == "source-1"
    assert updates[0][1] == BUSINESS
    assert updates[0][2]["Source_Status"] == "analyzed"
    assert updates[0][2]["Share_Id"] == "share-1"
    assert updates[0][2]["Summary"] == "A useful call."
    assert updates[0][2]["AE_Name"] == "Alex AE"
    assert uplaud_upserts[0]["share_link"].endswith("/t/share-1")
    assert result.status == "analyzed"
    assert result.share_id == "share-1"
    assert result.insights.summary == "A useful call."
    assert result.insights.ae_name == "Alex AE"


def test_analyze_is_idempotent_for_existing_analyzed_record(monkeypatch):
    install_business(monkeypatch)
    analyzed = record(status="analyzed")

    async def fake_get(*args, **kwargs):
        return analyzed

    async def unexpected(*args, **kwargs):
        raise AssertionError("idempotent analyze must not regenerate or write")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", unexpected)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", unexpected)

    result = run(server.analyze_source("source-1", request(), current=USER))

    assert result.status == "analyzed"
    assert result.testimonial_draft == "This saves our team hours."


def test_legacy_analyzed_record_without_transcript_cannot_be_regenerated(monkeypatch):
    install_business(monkeypatch)
    analyzed = record(status="analyzed")

    async def fake_get(*args, **kwargs):
        return analyzed

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)

    with pytest.raises(HTTPException) as exc_info:
        run(
            server.analyze_source(
                "source-1", request(), regenerate=True, current=USER
            )
        )

    assert exc_info.value.status_code == 409
    assert "transcript" in exc_info.value.detail.lower()


def test_legacy_regeneration_materializes_one_stable_share_id(monkeypatch):
    install_business(monkeypatch)
    legacy = record(status="analyzed", transcript="Legacy persisted transcript.")
    legacy["fields"].pop("Share_Id")
    source_updates = []
    uplaud_links = []

    async def fake_get(*args, **kwargs):
        return legacy

    async def fake_generate(*args, **kwargs):
        return {"summary": "Legacy summary", "testimonial": "Legacy quote"}

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        uplaud_links.append(kwargs["share_link"])
        return "rec-uplaud"

    async def fake_update(source_id, business_name, fields, owner_id=None):
        source_updates.append(fields)
        return {**legacy, "fields": {**legacy["fields"], **fields}}

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    result = run(
        server.analyze_source(
            "source-1", request(), regenerate=True, current=USER
        )
    )

    persisted_share_id = source_updates[0]["Share_Id"]
    assert persisted_share_id == "rec-source-1"
    assert uplaud_links == [f"https://example.test/t/{persisted_share_id}"]
    assert result.share_id == persisted_share_id


def test_analyze_write_failure_leaves_persisted_source_retryable(monkeypatch):
    install_business(monkeypatch)
    source_record = record(transcript="Retryable customer transcript.")
    attempts = 0

    async def fake_get(*args, **kwargs):
        return source_record

    async def fake_generate(*args, **kwargs):
        return {"summary": "Generated", "testimonial": "Generated quote"}

    async def failed_update(*args, **kwargs):
        nonlocal attempts
        attempts += 1
        raise RuntimeError("secret Airtable update detail")

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        return "rec-uplaud"

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", failed_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    with pytest.raises(HTTPException) as exc_info:
        run(server.analyze_source("source-1", request(), current=USER))

    assert exc_info.value.status_code == 502
    assert "secret Airtable update detail" not in exc_info.value.detail
    assert source_record["fields"]["Source_Status"] == "uploaded"
    assert attempts == 1


def test_public_lookup_reads_persisted_airtable_record(monkeypatch):
    analyzed = record(status="analyzed")

    async def fake_public_lookup(share_id):
        assert share_id == "share-1"
        return analyzed

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_public_lookup
    )

    result = run(server.find_public_source("share-1"))

    assert result["id"] == "source-1"
    assert result["testimonial_draft"] == "This saves our team hours."
    assert result["share_id"] == "share-1"


def test_testimonial_update_uses_scoped_persisted_record(monkeypatch):
    install_business(monkeypatch)
    analyzed = record(status="analyzed")
    writes = []

    async def fake_get(*args, **kwargs):
        return analyzed

    async def fake_update(source_id, business_name, fields, owner_id=None):
        writes.append((source_id, business_name, fields, owner_id))
        return {**analyzed, "fields": {**analyzed["fields"], **fields}}

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    result = run(
        server.update_testimonial(
            "source-1",
            server.TestimonialUpdate(testimonial_draft="Edited quote"),
            current=USER,
        )
    )

    assert writes == [
        (
            "source-1",
            BUSINESS,
            {"Testimonial_Draft": "Edited quote"},
            "user-1",
        )
    ]
    assert result.testimonial_draft == "Edited quote"


def test_upload_then_analyze_survives_independent_route_invocations(monkeypatch):
    install_business(monkeypatch)
    persisted = {}
    generated_texts = []

    async def fake_create(**kwargs):
        rec = {
            "id": "rec-independent",
            "fields": {
                "Source_Id": kwargs["source_id"],
                "Business_Name": kwargs["business_name"],
                "Owner_Id": kwargs["owner_id"],
                "Name": kwargs["filename"],
                "File_Type": kwargs["file_type"],
                "Transcript_Text": kwargs["transcript_text"],
                "Word_Count": kwargs["word_count"],
                "Source_Status": "uploaded",
                "Share_Id": kwargs["share_id"],
                "Created_At": kwargs["created_at"],
            },
        }
        persisted[kwargs["source_id"]] = rec
        return rec

    async def fake_get(source_id, business_name, owner_id=None):
        rec = persisted.get(source_id)
        if not rec:
            return None
        fields = rec["fields"]
        if fields["Business_Name"] != business_name:
            return None
        if owner_id and fields["Owner_Id"] != owner_id:
            return None
        return rec

    async def fake_update(source_id, business_name, fields, owner_id=None):
        rec = await fake_get(source_id, business_name, owner_id)
        if not rec:
            return None
        rec["fields"].update(fields)
        return rec

    async def fake_generate(text, *args, **kwargs):
        generated_texts.append(text)
        return {"summary": "Persisted summary", "testimonial": "Persisted quote"}

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        return "rec-uplaud"

    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", fake_create)
    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    upload = UploadFile(
        filename="independent.txt",
        file=io.BytesIO(b"This transcript must survive an independent invocation."),
    )
    uploaded = run(server.upload_source(upload, current=USER))
    spec = importlib.util.spec_from_file_location(
        "server_cold_source_invocation", server.__file__
    )
    cold_server = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cold_server)
    monkeypatch.setattr(cold_server, "generate_insights", fake_generate)
    analyzed = run(
        cold_server.analyze_source(uploaded.id, request(), current=USER)
    )

    assert generated_texts == [
        "This transcript must survive an independent invocation."
    ]
    assert analyzed.id == uploaded.id
    assert analyzed.status == "analyzed"
    assert len(persisted) == 1


def test_failed_analysis_can_retry_then_becomes_idempotent(monkeypatch):
    install_business(monkeypatch)
    persisted = record(transcript="Retry this full transcript.")
    update_attempts = 0
    generation_attempts = 0
    uplaud_upserts = 0

    async def fake_get(*args, **kwargs):
        return persisted

    async def fake_generate(*args, **kwargs):
        nonlocal generation_attempts
        generation_attempts += 1
        return {"summary": "Retry summary", "testimonial": "Retry quote"}

    async def fake_update(source_id, business_name, fields, owner_id=None):
        nonlocal update_attempts
        update_attempts += 1
        if update_attempts == 1:
            raise RuntimeError("first write fails")
        persisted["fields"].update(fields)
        return persisted

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        nonlocal uplaud_upserts
        uplaud_upserts += 1
        return "rec-uplaud"

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    with pytest.raises(HTTPException) as first_error:
        run(server.analyze_source("source-1", request(), current=USER))
    second = run(server.analyze_source("source-1", request(), current=USER))
    third = run(server.analyze_source("source-1", request(), current=USER))

    assert first_error.value.status_code == 502
    assert second.status == third.status == "analyzed"
    assert generation_attempts == 2
    assert update_attempts == 2
    assert uplaud_upserts == 2
    assert len({persisted["id"]}) == 1


def test_openai_failure_does_not_update_source_state(monkeypatch):
    install_business(monkeypatch)
    persisted = record(transcript="OpenAI retry transcript.")
    writes = []

    async def fake_get(*args, **kwargs):
        return persisted

    async def failed_generate(*args, **kwargs):
        raise RuntimeError("secret OpenAI failure")

    async def fake_update(*args, **kwargs):
        writes.append((args, kwargs))

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", failed_generate)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    with pytest.raises(HTTPException) as exc_info:
        run(server.analyze_source("source-1", request(), current=USER))

    assert exc_info.value.status_code == 502
    assert "secret OpenAI failure" not in exc_info.value.detail
    assert persisted["fields"]["Source_Status"] == "uploaded"
    assert writes == []


def test_uplaud_sync_failure_leaves_source_uploaded_and_retryable(monkeypatch):
    install_business(monkeypatch)
    persisted = record(transcript="Atomic sync transcript.")
    source_updates = []

    async def fake_get(*args, **kwargs):
        return persisted

    async def fake_generate(*args, **kwargs):
        return {"summary": "Generated", "testimonial": "Generated quote"}

    async def fake_user(**kwargs):
        return "rec-user"

    async def failed_uplaud(**kwargs):
        raise RuntimeError("secret Uplaud failure")

    async def fake_update(*args, **kwargs):
        source_updates.append((args, kwargs))

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", failed_uplaud)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    with pytest.raises(HTTPException) as exc_info:
        run(server.analyze_source("source-1", request(), current=USER))

    assert exc_info.value.status_code == 502
    assert "secret Uplaud failure" not in exc_info.value.detail
    assert persisted["fields"]["Source_Status"] == "uploaded"
    assert source_updates == []


def test_email_draft_and_send_approval_use_scoped_persisted_source(monkeypatch):
    install_business(monkeypatch)
    analyzed = record(status="analyzed")
    updates = []

    async def fake_get(source_id, business_name, owner_id=None):
        assert (source_id, business_name, owner_id) == (
            "source-1",
            BUSINESS,
            "user-1",
        )
        return analyzed

    async def fake_update(source_id, business_name, fields, owner_id=None):
        updates.append((source_id, business_name, fields, owner_id))
        return {**analyzed, "fields": {**analyzed["fields"], **fields}}

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    draft = run(server.email_draft("source-1", current=USER))
    approval = run(server.send_approval("source-1", current=USER))

    assert "This saves our team hours." in draft.body
    assert draft.attachment_name == "Customer Co - Conversation Summary.pdf"
    assert approval == {"share_id": "share-1", "public_path": "/t/share-1"}
    assert updates[0][0:2] == ("source-1", BUSINESS)
    assert updates[0][2]["Testimonial_Status"] == "sent"
    assert updates[0][3] == "user-1"


def test_public_edit_and_approval_update_the_persisted_source(monkeypatch):
    analyzed = record(status="analyzed")
    writes = []
    uplaud_upserts = []

    async def fake_public_lookup(share_id):
        return analyzed

    async def fake_update(source_id, business_name, fields, owner_id=None):
        writes.append((source_id, business_name, fields, owner_id))
        analyzed["fields"].update(fields)
        return {**analyzed, "fields": {**analyzed["fields"], **fields}}

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud_upsert(**kwargs):
        uplaud_upserts.append(kwargs)
        return "rec-uplaud"

    async def unexpected_create(**kwargs):
        raise AssertionError("approval must not create a duplicate Uplaud row")

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_public_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(
        server.airtable_client, "upsert_uplaud_record", fake_uplaud_upsert
    )
    monkeypatch.setattr(
        server.airtable_client, "create_uplaud_record", unexpected_create
    )

    edited = run(
        server.public_update_testimonial(
            "share-1", server.PublicUpdate(testimonial_draft="Public edit")
        )
    )
    approved = run(server.public_approve_testimonial("share-1", request()))

    assert edited.testimonial == "Public edit"
    assert approved.status == "approved"
    assert writes[0] == (
        "source-1",
        BUSINESS,
        {"Testimonial_Draft": "Public edit"},
        None,
    )
    assert writes[1][0:2] == ("source-1", BUSINESS)
    assert writes[1][2]["Testimonial_Status"] == "approved"
    assert uplaud_upserts == [
        {
            "business_name": BUSINESS,
            "testimonial": "Public edit",
            "reviewer_record_id": "rec-user",
            "share_link": "https://example.test/t/share-1",
            "date_added": uplaud_upserts[0]["date_added"],
        }
    ]
