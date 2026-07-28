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
        "get_source_business_name_by_email_domain",
        fake_business_name,
        raising=False,
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


def test_create_uploaded_source_requires_nonblank_owner(monkeypatch):
    writes = []

    async def fake_create(table, fields):
        writes.append((table, fields))

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_create", fake_create)

    with pytest.raises(RuntimeError, match="owner"):
        run(
            airtable_client.create_uploaded_source(
                source_id="source-1",
                business_name=BUSINESS,
                owner_id=" ",
                filename="call.txt",
                file_type="txt",
                transcript_text="hello",
                word_count=1,
                share_id="share-1",
                created_at="now",
            )
        )

    assert writes == []


def test_get_source_by_id_uses_source_business_and_owner_scope(monkeypatch):
    calls = []

    async def fake_get(table, params):
        calls.append((table, params))
        return {"records": [record()]}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
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

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)

    result = run(
        airtable_client.get_source_by_id(
            "source-1", BUSINESS, owner_id="user-1"
        )
    )

    assert result is None


def test_get_source_by_id_allows_business_shared_legacy_blank_owner(monkeypatch):
    legacy = record(status="analyzed", owner="")

    async def fake_get(table, params):
        return {"records": [legacy]}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)

    result = run(
        airtable_client.get_source_by_id(
            "source-1", BUSINESS, owner_id="different-business-user"
        )
    )

    assert result == legacy


def test_update_source_by_id_allows_business_shared_legacy_blank_owner(monkeypatch):
    legacy = record(status="analyzed", owner="")
    updates = []

    async def fake_get(table, params):
        return {"records": [legacy]}

    async def fake_update(table, record_id, fields):
        updates.append((table, record_id, fields))
        return {**legacy, "fields": {**legacy["fields"], **fields}}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(airtable_client, "_update", fake_update)

    result = run(
        airtable_client.update_source_by_id(
            "source-1",
            BUSINESS,
            {"Testimonial_Draft": "Shared legacy edit"},
            owner_id="different-business-user",
        )
    )

    assert result["fields"]["Testimonial_Draft"] == "Shared legacy edit"
    assert updates[0][1] == "rec-source-1"


@pytest.mark.parametrize("operation", ["get", "list"])
def test_source_repository_reads_reject_disabled_airtable(monkeypatch, operation):
    monkeypatch.setattr(airtable_client, "_enabled", lambda: False)
    coroutine = (
        airtable_client.get_source_by_id(
            "source-1", BUSINESS, owner_id="user-1"
        )
        if operation == "get"
        else airtable_client.list_growth_signals_by_business(
            BUSINESS, owner_id="user-1"
        )
    )

    with pytest.raises(RuntimeError, match="Airtable source lookup is unavailable"):
        run(coroutine)


@pytest.mark.parametrize("operation", ["get", "update", "list"])
def test_owned_source_repository_helpers_require_owner_scope(monkeypatch, operation):
    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    operations = {
        "get": lambda: airtable_client.get_source_by_id(
            "source-1", BUSINESS
        ),
        "update": lambda: airtable_client.update_source_by_id(
            "source-1", BUSINESS, {"Source_Status": "analyzed"}
        ),
        "list": lambda: airtable_client.list_growth_signals_by_business(BUSINESS),
    }

    with pytest.raises(RuntimeError, match="owner scope is required"):
        run(operations[operation]())


@pytest.mark.parametrize("operation", ["get", "list"])
def test_source_routes_map_disabled_airtable_reads_to_503(monkeypatch, operation):
    install_business(monkeypatch)
    monkeypatch.setattr(server.airtable_client, "_enabled", lambda: False)
    coroutine = (
        server.get_source("source-1", current=USER)
        if operation == "get"
        else server.list_sources(current=USER)
    )

    with pytest.raises(HTTPException) as exc_info:
        run(coroutine)

    assert exc_info.value.status_code == 503
    assert "Airtable" not in exc_info.value.detail


@pytest.mark.parametrize("operation", ["get", "list"])
def test_source_routes_map_transport_read_failures_to_sanitized_503(
    monkeypatch, operation
):
    install_business(monkeypatch)
    monkeypatch.setattr(server.airtable_client, "_enabled", lambda: True)

    async def failed_transport(*args, **kwargs):
        raise RuntimeError("secret transport detail")

    if operation == "get":
        monkeypatch.setattr(server.airtable_client, "_get", failed_transport)
        coroutine = server.get_source("source-1", current=USER)
    else:
        monkeypatch.setattr(server.airtable_client, "_get_all", failed_transport)
        coroutine = server.list_sources(current=USER)

    with pytest.raises(HTTPException) as exc_info:
        run(coroutine)

    assert exc_info.value.status_code == 503
    assert "secret transport detail" not in exc_info.value.detail


@pytest.mark.parametrize("operation", ["analyze", "testimonial", "email", "approval"])
def test_all_authenticated_source_reads_map_dependency_failure_to_503(
    monkeypatch, operation
):
    install_business(monkeypatch)

    async def failed_lookup(*args, **kwargs):
        raise RuntimeError("secret lookup detail")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", failed_lookup)
    operations = {
        "analyze": lambda: server.analyze_source(
            "source-1", request(), current=USER
        ),
        "testimonial": lambda: server.update_testimonial(
            "source-1",
            server.TestimonialUpdate(testimonial_draft="Edit"),
            current=USER,
        ),
        "email": lambda: server.email_draft("source-1", current=USER),
        "approval": lambda: server.send_approval("source-1", current=USER),
    }

    with pytest.raises(HTTPException) as exc_info:
        run(operations[operation]())

    assert exc_info.value.status_code == 503
    assert "secret lookup detail" not in exc_info.value.detail


def test_second_repository_read_failure_during_update_remains_a_503(monkeypatch):
    install_business(monkeypatch)
    lookups = 0

    async def flaky_get(table, params):
        nonlocal lookups
        lookups += 1
        if lookups == 1:
            return {"records": [record(status="analyzed")]}
        raise RuntimeError("secret second lookup detail")

    monkeypatch.setattr(server.airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(server.airtable_client, "_get", flaky_get)

    with pytest.raises(HTTPException) as exc_info:
        run(
            server.update_testimonial(
                "source-1",
                server.TestimonialUpdate(testimonial_draft="Edit"),
                current=USER,
            )
        )

    assert lookups == 2
    assert exc_info.value.status_code == 503
    assert "secret second lookup detail" not in exc_info.value.detail


def test_public_source_lookup_maps_dependency_failure_to_503(monkeypatch):
    async def failed_lookup(share_id):
        raise RuntimeError("secret public lookup detail")

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", failed_lookup
    )

    with pytest.raises(HTTPException) as exc_info:
        run(server.find_public_source("share-1"))

    assert exc_info.value.status_code == 503
    assert "secret public lookup detail" not in exc_info.value.detail


def test_public_share_lookup_rejects_mismatched_airtable_record(monkeypatch):
    mismatched = record(status="analyzed")
    mismatched["fields"]["Share_Id"] = "different-share"

    async def fake_get(table, params):
        return {"records": [mismatched]}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)

    result = run(airtable_client.get_growth_signal_by_share_id("requested-share"))

    assert result is None


@pytest.mark.parametrize("operation", ["get", "update", "approve"])
def test_public_routes_reject_mismatched_share_record(monkeypatch, operation):
    mismatched = record(status="analyzed")
    mismatched["fields"]["Share_Id"] = "different-share"

    async def fake_get(table, params):
        return {"records": [mismatched]}

    async def unexpected(*args, **kwargs):
        raise AssertionError("a mismatched public record must not be used")

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(airtable_client, "_update", unexpected)
    monkeypatch.setattr(airtable_client, "find_or_create_user", unexpected)
    operations = {
        "get": lambda: server.public_get_testimonial("requested-share"),
        "update": lambda: server.public_update_testimonial(
            "requested-share", server.PublicUpdate(testimonial_draft="Edit")
        ),
        "approve": lambda: server.public_approve_testimonial(
            "requested-share", request()
        ),
    }

    with pytest.raises(HTTPException) as exc_info:
        run(operations[operation]())

    assert exc_info.value.status_code == 404


@pytest.mark.parametrize("operation", ["owned", "public"])
def test_source_update_maps_mid_request_airtable_outage_to_503(
    monkeypatch, operation
):
    install_business(monkeypatch)
    availability = iter([True, False])

    async def fake_get(table, params):
        persisted = record(status="analyzed")
        persisted["fields"]["Testimonial_Status"] = "sent"
        return {"records": [persisted]}

    monkeypatch.setattr(
        server.airtable_client, "_enabled", lambda: next(availability)
    )
    monkeypatch.setattr(server.airtable_client, "_get", fake_get)
    coroutine = (
        server.update_testimonial(
            "source-1",
            server.TestimonialUpdate(testimonial_draft="Edit"),
            current=USER,
        )
        if operation == "owned"
        else server.public_update_testimonial(
            "share-1", server.PublicUpdate(testimonial_draft="Edit")
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        run(coroutine)

    assert exc_info.value.status_code == 503
    assert "Airtable" not in exc_info.value.detail


def test_source_business_scope_transport_failure_maps_to_503_without_fallback(
    monkeypatch,
):
    source_reads = []

    async def failed_business_lookup(email):
        raise RuntimeError("secret business lookup detail")

    async def unexpected_source_list(*args, **kwargs):
        source_reads.append((args, kwargs))
        return []

    monkeypatch.setattr(
        server.airtable_client,
        "get_source_business_name_by_email_domain",
        failed_business_lookup,
        raising=False,
    )
    monkeypatch.setattr(
        server.airtable_client,
        "list_growth_signals_by_business",
        unexpected_source_list,
    )

    with pytest.raises(HTTPException) as exc_info:
        run(server.list_sources(current=USER))

    assert exc_info.value.status_code == 503
    assert "secret business lookup detail" not in exc_info.value.detail
    assert source_reads == []


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
        return [
            record(),
            record(status="analyzed", owner=""),
            record(owner="other-user"),
        ]

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
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


def test_upsert_uplaud_record_is_atomic_by_share_id(monkeypatch):
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
            share_id="share-1",
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
                "Share_Id": "share-1",
                "Share Link": "https://example.test/t/share-1",
                "Date_Added": "2026-07-28",
            },
            ["Share_Id"],
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
    persisted = None

    async def fake_create(**kwargs):
        nonlocal persisted
        writes.append(kwargs)
        persisted = record(transcript=kwargs["transcript_text"])
        persisted["fields"]["Source_Id"] = kwargs["source_id"]
        persisted["fields"]["Share_Id"] = kwargs["share_id"]
        return persisted

    async def fake_share_lookup(share_id):
        if persisted and persisted["fields"].get("Share_Id") == share_id:
            return persisted
        return None

    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", fake_create)
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_share_lookup
    )
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
    assert result.id == writes[0]["source_id"]


def test_upload_failure_is_sanitized_and_never_returns_success(monkeypatch):
    install_business(monkeypatch)

    async def failed_create(**kwargs):
        raise RuntimeError("secret Airtable transport detail")

    async def fake_share_lookup(share_id):
        return None

    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", failed_create)
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_share_lookup
    )
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


def test_source_output_never_fabricates_share_id_from_airtable_record_id():
    legacy = record(status="analyzed")
    legacy["fields"].pop("Share_Id")

    result = server.record_to_source_out(legacy)

    assert result.share_id == ""


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

    async def unexpected_preapproval_write(**kwargs):
        raise AssertionError("analysis must not create User or Uplaud rows")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", unexpected_preapproval_write
    )
    monkeypatch.setattr(
        server.airtable_client,
        "upsert_uplaud_record",
        unexpected_preapproval_write,
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


def test_idempotent_legacy_analysis_persists_new_share_id_before_return(monkeypatch):
    install_business(monkeypatch)
    legacy = record(status="analyzed")
    legacy["fields"].pop("Share_Id")
    writes = []

    async def fake_get(*args, **kwargs):
        return legacy

    async def fake_update(source_id, business_name, fields, owner_id=None):
        writes.append((source_id, business_name, fields, owner_id))
        legacy["fields"].update(fields)
        return legacy

    async def unexpected_generate(*args, **kwargs):
        raise AssertionError("idempotent legacy analyze must not call OpenAI")

    async def fake_public_lookup(share_id):
        if legacy["fields"].get("Share_Id") == share_id:
            return legacy
        return None

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(server, "generate_insights", unexpected_generate)
    monkeypatch.setattr(
        server.airtable_client,
        "get_growth_signal_by_share_id",
        fake_public_lookup,
    )
    expected_share_id = server._legacy_source_share_id("source-1", BUSINESS)

    result = run(server.analyze_source("source-1", request(), current=USER))
    public_doc = run(server.find_public_source(result.share_id))

    assert writes == [
        (
            "source-1",
            BUSINESS,
            {"Share_Id": expected_share_id},
            "user-1",
        )
    ]
    assert result.share_id == expected_share_id
    assert public_doc["share_id"] == expected_share_id


def test_legacy_regeneration_materializes_one_stable_share_id(monkeypatch):
    install_business(monkeypatch)
    legacy = record(status="analyzed", transcript="Legacy persisted transcript.")
    legacy["fields"].pop("Share_Id")
    source_updates = []
    persisted = legacy

    async def fake_get(*args, **kwargs):
        return legacy

    async def fake_generate(*args, **kwargs):
        return {"summary": "Legacy summary", "testimonial": "Legacy quote"}

    async def fake_public_lookup(share_id):
        if persisted.get("fields", {}).get("Share_Id") == share_id:
            return persisted
        return None

    async def fake_update(source_id, business_name, fields, owner_id=None):
        nonlocal persisted
        source_updates.append(fields)
        persisted = {**legacy, "fields": {**legacy["fields"], **fields}}
        return persisted

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(
        server.airtable_client,
        "get_growth_signal_by_share_id",
        fake_public_lookup,
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    result = run(
        server.analyze_source(
            "source-1", request(), regenerate=True, current=USER
        )
    )

    persisted_share_id = source_updates[0]["Share_Id"]
    assert persisted_share_id == server._legacy_source_share_id("source-1", BUSINESS)
    assert persisted_share_id != legacy["id"]
    assert result.share_id == persisted_share_id


def test_concurrent_legacy_regeneration_uses_one_deterministic_share_id(monkeypatch):
    install_business(monkeypatch)
    legacy = record(status="analyzed", transcript="Concurrent legacy transcript.")
    legacy["fields"].pop("Share_Id")
    share_writes = []

    async def stale_get(*args, **kwargs):
        return {**legacy, "fields": dict(legacy["fields"])}

    async def fake_update(source_id, business_name, fields, owner_id=None):
        if set(fields) == {"Share_Id"}:
            share_writes.append(fields["Share_Id"])
        return {**legacy, "fields": {**legacy["fields"], **fields}}

    async def fake_generate(*args, **kwargs):
        return {"summary": "Concurrent summary", "testimonial": "Concurrent quote"}

    async def fake_public_lookup(share_id):
        if share_id in share_writes:
            return {**legacy, "fields": {**legacy["fields"], "Share_Id": share_id}}
        return None

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", stale_get)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(
        server.airtable_client,
        "get_growth_signal_by_share_id",
        fake_public_lookup,
    )

    async def invoke_concurrently():
        return await asyncio.gather(
            server.analyze_source(
                "source-1", request(), regenerate=True, current=USER
            ),
            server.analyze_source(
                "source-1", request(), regenerate=True, current=USER
            ),
        )

    first, second = run(invoke_concurrently())

    assert len(share_writes) == 2
    assert len(set(share_writes)) == 1
    assert share_writes[0] != legacy["id"]
    assert first.share_id == second.share_id == share_writes[0]


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
    class DurableAirtableBoundary:
        def __init__(self):
            self.records = {}

    class UploadRepositoryClient:
        def __init__(self, boundary):
            self.boundary = boundary

        async def get_source_business_name_by_email_domain(self, email):
            return BUSINESS

        async def get_growth_signal_by_share_id(self, share_id):
            return next(
                (
                    rec
                    for rec in self.boundary.records.values()
                    if rec["fields"].get("Share_Id") == share_id
                ),
                None,
            )

        async def create_uploaded_source(self, **kwargs):
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
            self.boundary.records[kwargs["source_id"]] = rec
            return rec

    class AnalysisRepositoryClient:
        def __init__(self, boundary):
            self.boundary = boundary

        async def get_source_business_name_by_email_domain(self, email):
            return BUSINESS

        async def get_source_by_id(self, source_id, business_name, owner_id=None):
            rec = self.boundary.records.get(source_id)
            if not rec:
                return None
            fields = rec["fields"]
            if fields["Business_Name"] != business_name:
                return None
            if owner_id and fields["Owner_Id"] != owner_id:
                return None
            return rec

        async def update_source_by_id(
            self, source_id, business_name, fields, owner_id=None
        ):
            rec = await self.get_source_by_id(
                source_id, business_name, owner_id=owner_id
            )
            if not rec:
                return None
            rec["fields"].update(fields)
            return rec

        async def find_or_create_user(self, **kwargs):
            return "rec-user"

        async def upsert_uplaud_record(self, **kwargs):
            return "rec-uplaud"

    boundary = DurableAirtableBoundary()
    upload_repository = UploadRepositoryClient(boundary)
    analysis_repository = AnalysisRepositoryClient(boundary)
    generated_texts = []

    async def fake_generate(text, *args, **kwargs):
        generated_texts.append(text)
        return {"summary": "Persisted summary", "testimonial": "Persisted quote"}

    monkeypatch.setattr(server, "airtable_client", upload_repository)
    monkeypatch.setattr(server, "generate_insights", fake_generate)

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
    cold_server.airtable_client = analysis_repository
    monkeypatch.setattr(cold_server, "generate_insights", fake_generate)
    analyzed = run(
        cold_server.analyze_source(uploaded.id, request(), current=USER)
    )

    assert generated_texts == [
        "This transcript must survive an independent invocation."
    ]
    assert analyzed.id == uploaded.id
    assert analyzed.status == "analyzed"
    assert len(boundary.records) == 1
    assert upload_repository is not analysis_repository


def test_failed_analysis_can_retry_then_becomes_idempotent(monkeypatch):
    install_business(monkeypatch)
    persisted = record(transcript="Retry this full transcript.")
    update_attempts = 0
    generation_attempts = 0

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

    async def unexpected_preapproval_write(**kwargs):
        raise AssertionError("analysis must not write User or Uplaud rows")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", unexpected_preapproval_write
    )
    monkeypatch.setattr(
        server.airtable_client,
        "upsert_uplaud_record",
        unexpected_preapproval_write,
    )

    with pytest.raises(HTTPException) as first_error:
        run(server.analyze_source("source-1", request(), current=USER))
    second = run(server.analyze_source("source-1", request(), current=USER))
    third = run(server.analyze_source("source-1", request(), current=USER))

    assert first_error.value.status_code == 502
    assert second.status == third.status == "analyzed"
    assert generation_attempts == 2
    assert update_attempts == 2
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


def test_analysis_ignores_uplaud_availability_until_approval(monkeypatch):
    install_business(monkeypatch)
    persisted = record(transcript="Atomic sync transcript.")
    source_updates = []

    async def fake_get(*args, **kwargs):
        return persisted

    async def fake_generate(*args, **kwargs):
        return {"summary": "Generated", "testimonial": "Generated quote"}

    async def failed_uplaud(**kwargs):
        raise AssertionError("analysis must not attempt Uplaud sync")

    async def fake_update(source_id, business_name, fields, owner_id=None):
        source_updates.append(fields)
        persisted["fields"].update(fields)
        return persisted

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", failed_uplaud)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    result = run(server.analyze_source("source-1", request(), current=USER))

    assert result.status == "analyzed"
    assert persisted["fields"]["Source_Status"] == "analyzed"
    assert source_updates[0]["Testimonial_Draft"] == "Generated quote"


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
    assert "Testimonial_Status" not in updates[0][2]
    assert updates[0][2]["Approval_Requested_At"]
    assert updates[0][3] == "user-1"


def test_public_edit_and_approval_update_the_persisted_source(monkeypatch):
    analyzed = record(status="analyzed")
    analyzed["fields"]["Testimonial_Status"] = "sent"
    writes = []
    uplaud_upserts = []

    async def fake_public_lookup(share_id):
        return analyzed

    async def fake_public_update(share_id, fields):
        writes.append((share_id, fields))
        analyzed["fields"].update(fields)
        return {**analyzed, "fields": {**analyzed["fields"], **fields}}

    async def unexpected_owned_update(*args, **kwargs):
        raise AssertionError("public routes must update through Share_Id scope")

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
    monkeypatch.setattr(
        server.airtable_client, "update_source_by_share_id", fake_public_update,
        raising=False,
    )
    monkeypatch.setattr(
        server.airtable_client, "update_source_by_id", unexpected_owned_update
    )
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
        "share-1",
        {"Testimonial_Draft": "Public edit"},
    )
    assert writes[1][0] == "share-1"
    assert writes[1][1]["Testimonial_Status"] == "approved"
    assert writes[1][1]["Approved_Testimonial"] == "Public edit"
    assert uplaud_upserts == [
        {
            "business_name": BUSINESS,
            "testimonial": "Public edit",
            "reviewer_record_id": "rec-user",
            "share_id": "share-1",
            "share_link": "https://example.test/t/share-1",
            "date_added": writes[1][1]["Approved_At"][:10],
        }
    ]
