"""Security and state-machine contracts for persisted testimonial sources."""

import asyncio
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


def request(host="example.test"):
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/public/testimonial/share-1/approve",
            "headers": [],
            "scheme": "https",
            "server": (host, 443),
        }
    )


def source_record(
    *,
    source_status="analyzed",
    testimonial_status="draft",
    draft="This saves our team hours.",
    owner="user-1",
    share_id="share-1",
    approved_testimonial="",
    approved_at="",
):
    fields = {
        "Source_Id": "source-1",
        "Business_Name": BUSINESS,
        "Owner_Id": owner,
        "Name": "customer-call.txt",
        "File_Type": "txt",
        "Transcript_Text": "A persisted customer conversation.",
        "Word_Count": 5,
        "Source_Status": source_status,
        "Share_Id": share_id,
        "Created_At": "2026-07-28T12:00:00+00:00",
        "Company": "Customer Co",
        "Person": "Casey Customer",
        "Role": "COO",
        "Testimonial_Draft": draft,
        "Testimonial_Status": testimonial_status,
    }
    if approved_testimonial:
        fields["Approved_Testimonial"] = approved_testimonial
    if approved_at:
        fields["Approved_At"] = approved_at
    return {
        "id": "rec-source-1",
        "createdTime": "2026-07-28T12:00:00.000Z",
        "fields": fields,
    }


def install_business(monkeypatch):
    async def fake_business_name(email):
        assert email == USER["email"]
        return BUSINESS

    monkeypatch.setattr(
        server.airtable_client,
        "get_source_business_name_by_email_domain",
        fake_business_name,
    )


@pytest.mark.parametrize("operation", ["get", "update"])
def test_blank_owner_uploaded_source_is_not_business_shared(monkeypatch, operation):
    uploaded = source_record(source_status="uploaded", owner="")
    updates = []

    async def fake_get(table, params):
        return {"records": [uploaded]}

    async def fake_update(*args, **kwargs):
        updates.append((args, kwargs))

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(airtable_client, "_update", fake_update)
    coroutine = (
        airtable_client.get_source_by_id(
            "source-1", BUSINESS, owner_id="different-business-user"
        )
        if operation == "get"
        else airtable_client.update_source_by_id(
            "source-1",
            BUSINESS,
            {"Testimonial_Draft": "must not write"},
            owner_id="different-business-user",
        )
    )

    assert run(coroutine) is None
    assert updates == []


def test_list_includes_only_owned_rows_and_analyzed_blank_owner_legacy(monkeypatch):
    owned_uploaded = source_record(source_status="uploaded")
    blank_uploaded = source_record(source_status="uploaded", owner="")
    blank_analyzed = source_record(owner="")

    async def fake_get_all(table, params):
        return [owned_uploaded, blank_uploaded, blank_analyzed]

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get_all", fake_get_all)

    records = run(
        airtable_client.list_growth_signals_by_business(
            BUSINESS, owner_id="user-1"
        )
    )

    assert records == [owned_uploaded, blank_analyzed]


def test_share_lookup_fails_closed_when_token_has_multiple_records(monkeypatch):
    calls = []

    async def fake_get(table, params):
        calls.append(params)
        return {"records": [source_record(), source_record()]}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)

    with pytest.raises(RuntimeError, match="collision"):
        run(airtable_client.get_growth_signal_by_share_id("share-1"))

    assert calls[0]["maxRecords"] == 2


def test_upload_retries_global_token_collision_and_uses_strong_token(monkeypatch):
    install_business(monkeypatch)
    created = []
    persisted = None
    candidates = iter(["existing-token", "u" * 43])

    async def fake_lookup(share_id):
        if share_id == "existing-token":
            return source_record(share_id=share_id)
        if persisted and persisted["fields"].get("Share_Id") == share_id:
            return persisted
        return None

    async def fake_create(**kwargs):
        nonlocal persisted
        created.append(kwargs)
        persisted = source_record(
            source_status="uploaded", share_id=kwargs["share_id"]
        )
        persisted["fields"]["Source_Id"] = kwargs["source_id"]
        return persisted

    monkeypatch.setattr(server.secrets, "token_urlsafe", lambda size: next(candidates))
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", fake_create)
    upload = UploadFile(filename="call.txt", file=io.BytesIO(b"usable transcript"))

    result = run(server.upload_source(upload, current=USER))

    assert created[0]["share_id"] == "u" * 43
    assert len(created[0]["share_id"]) >= 22
    assert result.share_id == "u" * 43


def test_upload_repairs_collision_detected_only_after_create(monkeypatch):
    install_business(monkeypatch)
    candidates = iter(["first-strong-token", "replacement-strong-token"])
    lookup_counts = {}
    persisted = None
    updates = []

    async def fake_lookup(share_id):
        lookup_counts[share_id] = lookup_counts.get(share_id, 0) + 1
        if share_id == "first-strong-token" and lookup_counts[share_id] == 2:
            raise airtable_client.AirtableSourceCollisionError(
                "post-create collision"
            )
        if persisted and persisted["fields"].get("Share_Id") == share_id:
            return persisted
        return None

    async def fake_create(**kwargs):
        nonlocal persisted
        persisted = source_record(
            source_status="uploaded", share_id=kwargs["share_id"]
        )
        persisted["fields"]["Source_Id"] = kwargs["source_id"]
        return persisted

    async def fake_update(source_id, business_name, fields, owner_id=None):
        updates.append(fields)
        persisted["fields"].update(fields)
        return persisted

    monkeypatch.setattr(server.secrets, "token_urlsafe", lambda size: next(candidates))
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "create_uploaded_source", fake_create)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    result = run(
        server.upload_source(
            UploadFile(filename="call.txt", file=io.BytesIO(b"usable transcript")),
            current=USER,
        )
    )

    assert updates == [{"Share_Id": "replacement-strong-token"}]
    assert result.share_id == "replacement-strong-token"


def test_legacy_share_materialization_retries_collision(monkeypatch):
    install_business(monkeypatch)
    legacy = source_record()
    legacy["fields"].pop("Share_Id")
    writes = []
    persisted = legacy

    async def fake_get(*args, **kwargs):
        return legacy

    async def fake_lookup(share_id):
        if share_id == "preferred-collision":
            collision = source_record(share_id=share_id)
            collision["fields"]["Source_Id"] = "different-source"
            return collision
        if persisted.get("fields", {}).get("Share_Id") == share_id:
            return persisted
        return None

    async def fake_update(source_id, business_name, fields, owner_id=None):
        nonlocal persisted
        writes.append(fields)
        persisted = {**legacy, "fields": {**legacy["fields"], **fields}}
        return persisted

    monkeypatch.setattr(server, "_legacy_source_share_id", lambda *args: "preferred-collision")
    monkeypatch.setattr(server.secrets, "token_urlsafe", lambda size: "unique-strong-token" * 2)
    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    result = run(server.analyze_source("source-1", request(), current=USER))

    assert writes == [{"Share_Id": "unique-strong-token" * 2}]
    assert result.share_id == "unique-strong-token" * 2


def test_existing_share_token_is_preserved_without_uniqueness_regeneration(monkeypatch):
    install_business(monkeypatch)
    analyzed = source_record(share_id="stored-link-token")

    async def fake_get(*args, **kwargs):
        return analyzed

    async def unexpected(*args, **kwargs):
        raise AssertionError("an existing public token must be preserved")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", unexpected
    )
    monkeypatch.setattr(server.secrets, "token_urlsafe", unexpected)

    result = run(server.analyze_source("source-1", request(), current=USER))

    assert result.share_id == "stored-link-token"


def test_upload_rejects_raw_bytes_before_full_read_or_parse(monkeypatch):
    class TrackingBytesIO(io.BytesIO):
        def __init__(self, payload):
            super().__init__(payload)
            self.read_sizes = []

        def read(self, size=-1):
            self.read_sizes.append(size)
            return super().read(size)

    stream = TrackingBytesIO(b"x" * (server.MAX_UPLOAD_BYTES + 1))
    upload = UploadFile(filename="oversized.txt", file=stream)

    def unexpected_parse(*args, **kwargs):
        raise AssertionError("oversized raw files must not be parsed")

    monkeypatch.setattr(server, "extract_text", unexpected_parse)

    with pytest.raises(HTTPException) as exc_info:
        run(server.upload_source(upload, current=USER))

    assert exc_info.value.status_code == 413
    assert stream.read_sizes == [server.MAX_UPLOAD_BYTES + 1]


def test_authenticated_edit_and_regenerate_reject_approved_source(monkeypatch):
    install_business(monkeypatch)
    approved = source_record(
        testimonial_status="approved",
        approved_testimonial="Frozen approval",
        approved_at="2026-07-28T12:30:00+00:00",
    )

    async def fake_get(*args, **kwargs):
        return approved

    async def unexpected(*args, **kwargs):
        raise AssertionError("approved content is immutable")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", unexpected)
    monkeypatch.setattr(server, "generate_insights", unexpected)

    with pytest.raises(HTTPException) as edit_error:
        run(
            server.update_testimonial(
                "source-1",
                server.TestimonialUpdate(testimonial_draft="Mutation"),
                current=USER,
            )
        )
    with pytest.raises(HTTPException) as regenerate_error:
        run(
            server.analyze_source(
                "source-1", request(), regenerate=True, current=USER
            )
        )

    assert edit_error.value.status_code == 409
    assert regenerate_error.value.status_code == 409


def test_authenticated_edit_rejects_approval_observed_on_repository_reread(
    monkeypatch,
):
    install_business(monkeypatch)
    sent = source_record(testimonial_status="sent", draft="Approved words")
    approved = source_record(
        testimonial_status="approved",
        draft="Approved words",
        approved_testimonial="Approved words",
        approved_at="2026-07-28T12:30:00+00:00",
    )
    reads = iter([sent, approved])
    writes = []

    async def fake_get(*args, **kwargs):
        return next(reads)

    async def fake_update(*args, **kwargs):
        writes.append((args, kwargs))
        return approved

    monkeypatch.setattr(server.airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server.airtable_client, "_update", fake_update)

    with pytest.raises(HTTPException) as exc_info:
        run(
            server.update_testimonial(
                "source-1",
                server.TestimonialUpdate(testimonial_draft="Late mutation"),
                current=USER,
            )
        )

    assert exc_info.value.status_code == 409
    assert writes == []


def test_analyze_rejects_invalid_uploaded_to_sent_state(monkeypatch):
    install_business(monkeypatch)
    invalid = source_record(source_status="uploaded", testimonial_status="sent")

    async def fake_get(*args, **kwargs):
        return invalid

    async def unexpected(*args, **kwargs):
        raise AssertionError("an invalid lifecycle state must not be analyzed")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", unexpected)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", unexpected)

    with pytest.raises(HTTPException) as exc_info:
        run(server.analyze_source("source-1", request(), current=USER))

    assert exc_info.value.status_code == 409


def test_approved_snapshot_is_used_for_authenticated_and_public_reads():
    approved = source_record(
        testimonial_status="approved",
        draft="late stale draft mutation",
        approved_testimonial="Frozen approval",
        approved_at="2026-07-28T12:30:00+00:00",
    )

    source = server.record_to_source_out(approved)
    public = server._growth_signal_record_to_pub_doc(approved)

    assert source.testimonial_draft == "Frozen approval"
    assert public["testimonial_draft"] == "Frozen approval"


def test_public_edit_requires_sent_and_rejects_observed_approved(monkeypatch):
    async def unexpected(*args, **kwargs):
        raise AssertionError("invalid state must not write")

    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", unexpected)
    for record in (
        source_record(testimonial_status="draft"),
        source_record(
            testimonial_status="approved",
            approved_testimonial="Frozen approval",
            approved_at="2026-07-28T12:30:00+00:00",
        ),
    ):
        async def fake_lookup(share_id, current=record):
            return current

        monkeypatch.setattr(
            server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
        )
        with pytest.raises(HTTPException) as exc_info:
            run(
                server.public_update_testimonial(
                    "share-1", server.PublicUpdate(testimonial_draft="Mutation")
                )
            )
        assert exc_info.value.status_code == 409


def test_public_edit_approval_race_keeps_snapshot_customer_visible(monkeypatch):
    sent = source_record(testimonial_status="sent", draft="Approved words")
    raced = source_record(
        testimonial_status="approved",
        draft="late stale draft mutation",
        approved_testimonial="Approved words",
        approved_at="2026-07-28T12:30:00+00:00",
    )

    async def fake_lookup(share_id):
        return sent

    async def fake_update(share_id, fields):
        return raced

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", fake_update)

    result = run(
        server.public_update_testimonial(
            "share-1", server.PublicUpdate(testimonial_draft="late stale draft mutation")
        )
    )

    assert result.status == "approved"
    assert result.testimonial == "Approved words"


@pytest.mark.parametrize(
    "record",
    [
        source_record(source_status="uploaded", testimonial_status="draft"),
        source_record(draft=""),
        source_record(
            testimonial_status="approved",
            approved_testimonial="Frozen approval",
            approved_at="2026-07-28T12:30:00+00:00",
        ),
    ],
)
def test_send_approval_rejects_invalid_state_or_empty_testimonial(
    monkeypatch, record
):
    install_business(monkeypatch)

    async def fake_get(*args, **kwargs):
        return record

    async def unexpected(*args, **kwargs):
        raise AssertionError("invalid transition must not write")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", unexpected)

    with pytest.raises(HTTPException) as exc_info:
        run(server.send_approval("source-1", current=USER))

    assert exc_info.value.status_code == 409


def test_authenticated_read_derives_sent_state_from_approval_request_timestamp():
    sent = source_record(testimonial_status="draft")
    sent["fields"]["Approval_Requested_At"] = "2026-07-28T12:20:00+00:00"

    result = server.record_to_source_out(sent)

    assert result.testimonial_status == "sent"


def test_send_approval_race_cannot_downgrade_approved_source(monkeypatch):
    install_business(monkeypatch)
    analyzed = source_record(testimonial_status="draft")
    approved = source_record(
        testimonial_status="approved",
        approved_testimonial="Frozen approval",
        approved_at="2026-07-28T12:30:00+00:00",
    )
    reads = iter([analyzed, approved])
    writes = []

    async def changing_get(*args, **kwargs):
        return next(reads)

    async def fake_update(*args, **kwargs):
        writes.append((args, kwargs))
        return approved

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "get_source_by_id", changing_get)
    monkeypatch.setattr(airtable_client, "_update", fake_update)

    with pytest.raises(HTTPException) as exc_info:
        run(server.send_approval("source-1", current=USER))

    assert exc_info.value.status_code == 409
    assert writes == []


def test_send_approval_repairs_share_collision_detected_after_patch(monkeypatch):
    install_business(monkeypatch)
    persisted = source_record(testimonial_status="draft", share_id="")
    persisted["fields"].pop("Share_Id")
    lookup_counts = {}
    writes = []

    async def fake_get(*args, **kwargs):
        return persisted

    async def fake_lookup(share_id):
        lookup_counts[share_id] = lookup_counts.get(share_id, 0) + 1
        if share_id == "legacy-candidate" and lookup_counts[share_id] == 2:
            raise airtable_client.AirtableSourceCollisionError(
                "post-send collision"
            )
        if persisted["fields"].get("Share_Id") == share_id:
            return persisted
        return None

    async def fake_update(source_id, business_name, fields, owner_id=None):
        writes.append(fields)
        persisted["fields"].update(fields)
        return persisted

    monkeypatch.setattr(server, "_legacy_source_share_id", lambda *args: "legacy-candidate")
    monkeypatch.setattr(
        server.secrets, "token_urlsafe", lambda size: "replacement-strong-token"
    )
    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)

    result = run(server.send_approval("source-1", current=USER))

    assert result["share_id"] == "replacement-strong-token"
    assert writes[-1] == {"Share_Id": "replacement-strong-token"}


def test_analysis_race_cannot_downgrade_sent_source(monkeypatch):
    install_business(monkeypatch)
    analyzed = source_record(testimonial_status="draft")
    sent = source_record(testimonial_status="sent")
    reads = iter([analyzed, sent])
    writes = []

    async def changing_get(*args, **kwargs):
        return next(reads)

    async def fake_generate(*args, **kwargs):
        return {"summary": "Late analysis", "testimonial": "Late draft"}

    async def fake_update(*args, **kwargs):
        writes.append((args, kwargs))
        return sent

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "get_source_by_id", changing_get)
    monkeypatch.setattr(airtable_client, "_update", fake_update)
    monkeypatch.setattr(server, "generate_insights", fake_generate)

    with pytest.raises(HTTPException) as exc_info:
        run(
            server.analyze_source(
                "source-1", request(), regenerate=True, current=USER
            )
        )

    assert exc_info.value.status_code == 409
    assert writes == []


@pytest.mark.parametrize("operation", ["analysis", "send"])
def test_late_nonapproval_patch_cannot_clear_concurrent_approval(
    monkeypatch, operation
):
    install_business(monkeypatch)
    persisted = source_record(testimonial_status="draft")

    async def stable_get(*args, **kwargs):
        return persisted

    async def approve_then_apply(table, record_id, fields):
        persisted["fields"].update(
            {
                "Testimonial_Status": "approved",
                "Approved_Testimonial": "Frozen approval",
                "Approved_At": "2026-07-28T12:30:00+00:00",
            }
        )
        persisted["fields"].update(fields)
        return persisted

    async def fake_generate(*args, **kwargs):
        return {"summary": "Late", "testimonial": "Late draft"}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "get_source_by_id", stable_get)
    monkeypatch.setattr(airtable_client, "_update", approve_then_apply)
    monkeypatch.setattr(server, "generate_insights", fake_generate)

    coroutine = (
        server.analyze_source(
            "source-1", request(), regenerate=True, current=USER
        )
        if operation == "analysis"
        else server.send_approval("source-1", current=USER)
    )
    run(coroutine)

    assert persisted["fields"]["Testimonial_Status"] == "approved"
    assert server.record_to_source_out(persisted).testimonial_draft == "Frozen approval"


@pytest.mark.parametrize(
    "record",
    [
        source_record(testimonial_status="draft"),
        source_record(testimonial_status="sent", draft=""),
    ],
)
def test_public_approve_requires_sent_nonempty_testimonial(monkeypatch, record):
    async def fake_lookup(share_id):
        return record

    async def unexpected(*args, **kwargs):
        raise AssertionError("invalid approval must not write")

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", unexpected)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", unexpected)

    with pytest.raises(HTTPException) as exc_info:
        run(server.public_approve_testimonial("share-1", request()))

    assert exc_info.value.status_code == 409


def test_public_approve_rejects_sent_status_on_unanalyzed_source(monkeypatch):
    invalid = source_record(source_status="uploaded", testimonial_status="sent")

    async def fake_lookup(share_id):
        return invalid

    async def unexpected(*args, **kwargs):
        raise AssertionError("an invalid lifecycle state must not write")

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", unexpected)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", unexpected)

    with pytest.raises(HTTPException) as exc_info:
        run(server.public_approve_testimonial("share-1", request()))

    assert exc_info.value.status_code == 409


def test_first_approval_freezes_source_before_uplaud_sync(monkeypatch):
    sent = source_record(testimonial_status="sent", draft="Customer-approved words")
    calls = []

    async def fake_lookup(share_id):
        return sent

    async def fake_update(share_id, fields):
        calls.append(("source", dict(fields)))
        sent["fields"].update(fields)
        return sent

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        calls.append(("uplaud", dict(kwargs)))
        return "rec-uplaud"

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    result = run(server.public_approve_testimonial("share-1", request()))

    assert calls[0][0] == "source"
    assert calls[0][1]["Testimonial_Status"] == "approved"
    assert calls[0][1]["Approved_Testimonial"] == "Customer-approved words"
    assert calls[1] == (
        "uplaud",
        {
            "business_name": BUSINESS,
            "testimonial": "Customer-approved words",
            "reviewer_record_id": "rec-user",
            "share_id": "share-1",
            "share_link": "https://example.test/t/share-1",
            "date_added": calls[0][1]["Approved_At"][:10],
        },
    )
    assert result.testimonial == "Customer-approved words"


def test_repeated_approval_preserves_snapshot_and_timestamp_but_reconciles_uplaud(
    monkeypatch,
):
    approved = source_record(
        testimonial_status="approved",
        draft="later draft",
        approved_testimonial="Original approval",
        approved_at="2026-07-27T09:15:00+00:00",
    )
    upserts = []

    async def fake_lookup(share_id):
        return approved

    async def unexpected_update(*args, **kwargs):
        raise AssertionError("repeat approval must not rewrite the source snapshot")

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        upserts.append(kwargs)
        return "rec-uplaud"

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(
        server.airtable_client, "update_source_by_share_id", unexpected_update
    )
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    result = run(server.public_approve_testimonial("share-1", request("retry.test")))

    assert result.approved_at == "2026-07-27T09:15:00+00:00"
    assert result.testimonial == "Original approval"
    assert upserts[0]["testimonial"] == "Original approval"
    assert upserts[0]["share_id"] == "share-1"
    assert upserts[0]["date_added"] == "2026-07-27"


def test_repeated_legacy_approval_backfills_snapshot_without_changing_timestamp(
    monkeypatch,
):
    approved = source_record(
        testimonial_status="approved",
        draft="Legacy approved words",
        approved_at="2026-07-27T09:15:00+00:00",
    )
    source_writes = []

    async def fake_lookup(share_id):
        return approved

    async def fake_update(share_id, fields):
        source_writes.append(fields)
        approved["fields"].update(fields)
        return approved

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        return "rec-uplaud"

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    result = run(server.public_approve_testimonial("share-1", request()))

    assert source_writes == [
        {"Approved_Testimonial": "Legacy approved words"}
    ]
    assert approved["fields"]["Approved_At"] == "2026-07-27T09:15:00+00:00"
    assert result.testimonial == "Legacy approved words"


def test_uplaud_failure_after_source_approval_is_retryable_and_idempotent(monkeypatch):
    persisted = source_record(testimonial_status="sent", draft="Frozen on first try")
    source_writes = []
    uplaud_attempts = 0

    async def fake_lookup(share_id):
        return persisted

    async def fake_update(share_id, fields):
        source_writes.append(dict(fields))
        persisted["fields"].update(fields)
        return persisted

    async def fake_user(**kwargs):
        return "rec-user"

    async def flaky_uplaud(**kwargs):
        nonlocal uplaud_attempts
        uplaud_attempts += 1
        if uplaud_attempts == 1:
            raise RuntimeError("temporary Uplaud outage")
        return "rec-uplaud"

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", flaky_uplaud)

    with pytest.raises(HTTPException) as first_error:
        run(server.public_approve_testimonial("share-1", request()))
    original_fields = dict(source_writes[0])
    second = run(server.public_approve_testimonial("share-1", request("retry.test")))

    assert first_error.value.status_code == 502
    assert len(source_writes) == 1
    assert persisted["fields"]["Approved_At"] == original_fields["Approved_At"]
    assert persisted["fields"]["Approved_Testimonial"] == "Frozen on first try"
    assert uplaud_attempts == 2
    assert second.testimonial == "Frozen on first try"


def test_concurrent_approvals_reconcile_uplaud_to_canonical_snapshot(monkeypatch):
    sent_a = source_record(testimonial_status="sent", draft="Approval A")
    sent_b = source_record(testimonial_status="sent", draft="Approval B")
    persisted = sent_a
    initial_reads = 0
    both_updates_ready = asyncio.Event()
    approval_updates = 0
    b_uplaud_written = asyncio.Event()
    uplaud_writes = []

    async def fake_lookup(share_id):
        nonlocal initial_reads
        if initial_reads < 2:
            current = sent_a if initial_reads == 0 else sent_b
            initial_reads += 1
            return current
        return persisted

    async def fake_update(share_id, fields):
        nonlocal persisted, approval_updates
        approval_updates += 1
        if approval_updates == 2:
            both_updates_ready.set()
        await both_updates_ready.wait()
        if fields["Approved_Testimonial"] == "Approval B":
            await asyncio.sleep(0.01)
        persisted = source_record(
            testimonial_status="approved",
            draft=fields["Approved_Testimonial"],
            approved_testimonial=fields["Approved_Testimonial"],
            approved_at=fields["Approved_At"],
        )
        return persisted

    async def fake_user(**kwargs):
        return "rec-user"

    async def fake_uplaud(**kwargs):
        if kwargs["testimonial"] == "Approval A" and not b_uplaud_written.is_set():
            await b_uplaud_written.wait()
        uplaud_writes.append(kwargs["testimonial"])
        if kwargs["testimonial"] == "Approval B":
            b_uplaud_written.set()
        return "rec-uplaud"

    monkeypatch.setattr(
        server.airtable_client, "get_growth_signal_by_share_id", fake_lookup
    )
    monkeypatch.setattr(server.airtable_client, "update_source_by_share_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", fake_user)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", fake_uplaud)

    async def approve_both():
        return await asyncio.gather(
            server.public_approve_testimonial("share-1", request("a.example")),
            server.public_approve_testimonial("share-1", request("b.example")),
        )

    first, second = run(approve_both())

    canonical = persisted["fields"]["Approved_Testimonial"]
    assert canonical == "Approval B"
    assert uplaud_writes[-1] == canonical
    assert first.testimonial == second.testimonial == canonical


def test_uplaud_upsert_identity_is_share_id_across_request_hosts(monkeypatch):
    calls = []

    async def fake_upsert(table, fields, merge_fields):
        calls.append((table, fields, merge_fields))
        return {"id": "rec-uplaud", "fields": fields}

    monkeypatch.setattr(airtable_client, "_upsert_by_fields", fake_upsert)

    for host in ("first.example", "second.example"):
        run(
            airtable_client.upsert_uplaud_record(
                business_name=BUSINESS,
                testimonial="Frozen approval",
                reviewer_record_id="rec-user",
                share_id="stable-share-id",
                share_link=f"https://{host}/t/stable-share-id",
                date_added="2026-07-28",
            )
        )

    assert [call[2] for call in calls] == [["Share_Id"], ["Share_Id"]]
    assert {call[1]["Share_Id"] for call in calls} == {"stable-share-id"}
    assert len({call[1]["Share Link"] for call in calls}) == 2


def test_uplaud_upsert_adopts_legacy_share_link_row_without_duplicate(monkeypatch):
    legacy = {
        "id": "rec-legacy-uplaud",
        "fields": {
            "business_name": BUSINESS,
            "Uplaud": "Frozen approval",
            "Share Link": "https://old-host.example/t/stable-share-id",
        },
    }
    updates = []

    async def fake_get(table, params):
        return {"records": [legacy]}

    async def fake_update(table, record_id, fields):
        updates.append((table, record_id, fields))
        return {"id": record_id, "fields": {**legacy["fields"], **fields}}

    async def unexpected_upsert(*args, **kwargs):
        raise AssertionError("the matching legacy row must be adopted")

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(airtable_client, "_update", fake_update)
    monkeypatch.setattr(airtable_client, "_upsert_by_fields", unexpected_upsert)

    record_id = run(
        airtable_client.upsert_uplaud_record(
            business_name=BUSINESS,
            testimonial="Frozen approval",
            reviewer_record_id="rec-user",
            share_id="stable-share-id",
            share_link="https://new-host.example/t/stable-share-id",
            date_added="2026-07-28",
        )
    )

    assert record_id == "rec-legacy-uplaud"
    assert updates[0][1] == "rec-legacy-uplaud"
    assert updates[0][2]["Share_Id"] == "stable-share-id"


def test_analysis_never_writes_uplaud_before_approval(monkeypatch):
    install_business(monkeypatch)
    uploaded = source_record(source_status="uploaded", testimonial_status="draft")
    updates = []

    async def fake_get(*args, **kwargs):
        return uploaded

    async def fake_generate(*args, **kwargs):
        return {"summary": "Summary", "testimonial": "Draft only"}

    async def fake_update(source_id, business_name, fields, owner_id=None):
        updates.append(fields)
        uploaded["fields"].update(fields)
        return uploaded

    async def unexpected(*args, **kwargs):
        raise AssertionError("analysis must not write User or Uplaud rows")

    monkeypatch.setattr(server.airtable_client, "get_source_by_id", fake_get)
    monkeypatch.setattr(server, "generate_insights", fake_generate)
    monkeypatch.setattr(server.airtable_client, "update_source_by_id", fake_update)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", unexpected)
    monkeypatch.setattr(server.airtable_client, "upsert_uplaud_record", unexpected)

    result = run(server.analyze_source("source-1", request(), current=USER))

    assert result.status == "analyzed"
    assert updates[0]["Testimonial_Draft"] == "Draft only"
