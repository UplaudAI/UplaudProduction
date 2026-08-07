"""Local behavior contracts for Airtable-only referral and lead persistence."""

import asyncio
from collections import Counter
import os
import subprocess
import sys
from pathlib import Path

import httpx
import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]

# Importing the application must not rely on the legacy Mongo configuration.
os.environ.pop("MONGO_URL", None)
os.environ.pop("DB_NAME", None)

import server  # noqa: E402


PUBLIC_SOURCE = {
    "id": "source-1",
    "share_id": "share-1",
    "brand": "Uplaud",
    "client_name": "Referrer Co",
    "insights": {
        "speaker_name": "Rita Referrer",
        "company_name": "Referrer Co",
    },
    "testimonial_draft": "Uplaud made referrals easy.",
}


def run(coroutine):
    return asyncio.run(coroutine)


async def post(path: str, payload: dict) -> httpx.Response:
    transport = httpx.ASGITransport(app=server.app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


def install_referral_fakes(monkeypatch, *, circle_result="rec-circle"):
    user_calls = []
    circle_calls = []
    enrich_calls = []

    async def fake_find_public_source(share_id):
        assert share_id == "share-1"
        return PUBLIC_SOURCE

    async def fake_enrich(first_name, last_name, company, **kwargs):
        enrich_calls.append(
            {
                "first_name": first_name,
                "last_name": last_name,
                "company": company,
                **kwargs,
            }
        )
        return {
            "likelihood": 9,
            "data": {
                "job_title": "VP Growth",
                "job_company_name": company,
                "linkedin_url": f"https://linkedin.example/{first_name.lower()}",
                "location_locality": "Oakland",
                "location_region": "California",
                "location_country": "United States",
            },
        }

    async def fake_find_or_create_user(**kwargs):
        user_calls.append(kwargs)
        return f"rec-user-{len(user_calls)}"

    async def fake_create_circle_record(**kwargs):
        circle_calls.append(kwargs)
        if isinstance(circle_result, Exception):
            raise circle_result
        return circle_result

    monkeypatch.setattr(server, "find_public_source", fake_find_public_source)
    monkeypatch.setattr(server.airtable_client, "enrich_person_pdl", fake_enrich)
    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", fake_find_or_create_user
    )
    monkeypatch.setattr(
        server.airtable_client, "create_circle_record", fake_create_circle_record
    )
    return user_calls, circle_calls, enrich_calls


def referral_payload():
    return {
        "referrals": [
            {
                "name": "Ada Lovelace",
                "contact": "ada@example.com",
                "company": "Analytical Engines",
            },
            {
                "name": "Grace Hopper",
                "contact": "https://linkedin.com/in/grace",
                "company": "Compilers Inc",
            },
        ]
    }


def enable_airtable(monkeypatch):
    monkeypatch.setattr(server.airtable_client, "AIRTABLE_PAT", "test-pat")
    monkeypatch.setattr(server.airtable_client, "AIRTABLE_BASE_ID", "test-base")
    monkeypatch.setattr(
        server.airtable_client,
        "AIRTABLE_API_URL",
        "https://api.airtable.com/v0/test-base",
    )


def test_server_imports_without_mongo_environment_or_network_clients():
    env = os.environ.copy()
    for name in (
        "MONGO_URL",
        "DB_NAME",
        "OPENAI_API_KEY",
        "AIRTABLE_PAT",
        "AIRTABLE_BASE_ID",
        "PDL_API_KEY",
    ):
        env.pop(name, None)
    command = (
        "import dotenv, os; "
        "dotenv.load_dotenv = lambda *args, **kwargs: False; "
        "assert 'MONGO_URL' not in os.environ; "
        "assert 'DB_NAME' not in os.environ; "
        "import server"
    )

    result = subprocess.run(
        [sys.executable, "-c", command],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=20,
    )

    assert result.returncode == 0, result.stderr


def test_referral_batch_creates_one_enriched_circle_per_referral(monkeypatch):
    user_calls, circle_calls, enrich_calls = install_referral_fakes(monkeypatch)

    result = run(
        server.submit_referrals(
            "share-1", server.ReferralSubmit(**referral_payload())
        )
    )

    assert result == {"count": 2}
    assert len(user_calls) == 2
    assert len(circle_calls) == 2
    assert enrich_calls[1]["linkedin"] == "https://linkedin.com/in/grace"
    assert user_calls[0]["extra_fields"]["Job_Title"] == "VP Growth"
    assert user_calls[0]["city"] == "Oakland"
    assert user_calls[0]["strict_persistence"] is True
    assert circle_calls[0] == {
        "initiator": "Rita Referrer",
        "receiver": "Ada Lovelace",
        "business_name": "Uplaud",
        "phone": "",
        "referred_date": circle_calls[0]["referred_date"],
        "receiver_company": "Analytical Engines",
        "receiver_user_id": "rec-user-1",
        "referrer_testimonial": "Uplaud made referrals easy.",
        "referral_key": circle_calls[0]["referral_key"],
        "strict_persistence": True,
    }
    assert len(circle_calls[0]["referral_key"]) == 64


def test_referral_returns_non_success_when_circle_creation_returns_none(monkeypatch):
    install_referral_fakes(monkeypatch, circle_result=None)

    response = run(
        post(
            "/api/public/testimonial/share-1/referrals",
            {"referrals": [referral_payload()["referrals"][0]]},
        )
    )

    assert response.status_code == 502


def test_referral_maps_circle_creation_exception_without_leaking_details(monkeypatch):
    install_referral_fakes(
        monkeypatch, circle_result=RuntimeError("secret Airtable transport detail")
    )

    response = run(
        post(
            "/api/public/testimonial/share-1/referrals",
            {"referrals": [referral_payload()["referrals"][0]]},
        )
    )

    assert response.status_code == 502
    assert "secret Airtable transport detail" not in response.text


@pytest.mark.parametrize("contact", ["N/A", " null ", "None"])
def test_referral_rejects_placeholder_contacts(monkeypatch, contact):
    user_calls, circle_calls, _ = install_referral_fakes(monkeypatch)

    response = run(
        post(
            "/api/public/testimonial/share-1/referrals",
            {
                "referrals": [
                    {"name": "Placeholder", "contact": contact, "company": "Acme"}
                ]
            },
        )
    )

    assert response.status_code == 400
    assert user_calls == []
    assert circle_calls == []


@pytest.mark.parametrize(
    "user_result",
    [None, RuntimeError("secret Airtable user failure")],
)
def test_referral_requires_user_persistence_before_circle(
    monkeypatch, user_result
):
    _, circle_calls, _ = install_referral_fakes(monkeypatch)

    async def failed_user_write(**kwargs):
        if isinstance(user_result, Exception):
            raise user_result
        return user_result

    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", failed_user_write
    )

    response = run(
        post(
            "/api/public/testimonial/share-1/referrals",
            {"referrals": [referral_payload()["referrals"][0]]},
        )
    )

    assert response.status_code == 502
    assert "secret Airtable user failure" not in response.text
    assert circle_calls == []


def test_linkedin_referral_rejects_mismatched_pdl_profile(monkeypatch):
    user_calls, circle_calls, _ = install_referral_fakes(monkeypatch)

    async def mismatched_enrich(first_name, last_name, company, **kwargs):
        return {
            "likelihood": 9,
            "data": {
                "job_title": "Vice President",
                "job_company_name": "Bank of America",
                "linkedin_url": "https://www.linkedin.com/in/deep-barot-98/",
            },
        }

    monkeypatch.setattr(server.airtable_client, "enrich_person_pdl", mismatched_enrich)

    result = run(
        server.submit_referrals(
            "share-1",
            server.ReferralSubmit(
                referrals=[
                    server.ReferralItem(
                        name="Deep Barot",
                        contact="https://www.linkedin.com/in/deep-barot-98b7bb33/",
                        company="ContextQA",
                    )
                ]
            ),
        )
    )

    assert result == {"count": 1}
    assert user_calls[0]["linkedin"] == "https://www.linkedin.com/in/deep-barot-98b7bb33/"
    assert user_calls[0]["extra_fields"] == {}
    assert user_calls[0]["city"] is None
    assert circle_calls[0]["receiver_company"] == "ContextQA"


def test_referral_key_is_deterministic_for_normalized_item_values():
    first = server._referral_key(
        "share-1",
        {"name": " Ada   Lovelace ", "contact": "ADA@EXAMPLE.COM", "company": " ACME "},
    )
    second = server._referral_key(
        "share-1",
        {"name": "ada lovelace", "contact": "ada@example.com", "company": "acme"},
    )

    assert first == second
    assert len(first) == 64


def test_referral_retry_after_partial_failure_does_not_duplicate_circles(monkeypatch):
    stored_by_key = {}
    upsert_attempts = Counter()
    second_key_failed_once = False

    async def fake_find_public_source(share_id):
        return PUBLIC_SOURCE

    async def no_enrichment(*args, **kwargs):
        return None

    async def persisted_user(**kwargs):
        return f"rec-user-{kwargs['name'].split()[0].lower()}"

    async def fake_request(method, url, **kwargs):
        nonlocal second_key_failed_once
        assert method == "PATCH"
        assert url.endswith("/Circles")
        fields = kwargs["json"]["records"][0]["fields"]
        referral_key = fields["Referral_Key"]
        upsert_attempts[referral_key] += 1
        if len(upsert_attempts) == 2 and not second_key_failed_once:
            second_key_failed_once = True
            raise RuntimeError("second Circle failed once")
        record = stored_by_key.setdefault(
            referral_key,
            {"id": f"rec-circle-{len(stored_by_key) + 1}", "fields": fields},
        )
        request = httpx.Request(method, url)
        return httpx.Response(200, json={"records": [record]}, request=request)

    monkeypatch.setattr(server, "find_public_source", fake_find_public_source)
    monkeypatch.setattr(server.airtable_client, "enrich_person_pdl", no_enrichment)
    monkeypatch.setattr(server.airtable_client, "find_or_create_user", persisted_user)
    enable_airtable(monkeypatch)
    monkeypatch.setattr(server.airtable_client, "_request", fake_request)

    first_response = run(
        post("/api/public/testimonial/share-1/referrals", referral_payload())
    )
    retry_response = run(
        post("/api/public/testimonial/share-1/referrals", referral_payload())
    )

    assert first_response.status_code == 502
    assert retry_response.status_code == 200
    assert retry_response.json() == {"count": 2}
    assert len(stored_by_key) == 2
    assert sorted(upsert_attempts.values()) == [2, 2]


def test_upsert_by_fields_sends_exact_airtable_payload_and_returns_first_record(
    monkeypatch,
):
    calls = []
    expected_record = {"id": "rec-circle-1", "fields": {"Referral_Key": "key-1"}}

    async def fake_request(method, url, **kwargs):
        calls.append((method, url, kwargs))
        request = httpx.Request(method, url)
        return httpx.Response(
            200,
            json={"records": [expected_record]},
            request=request,
        )

    enable_airtable(monkeypatch)
    monkeypatch.setattr(server.airtable_client, "_request", fake_request)

    result = run(
        server.airtable_client._upsert_by_fields(
            server.airtable_client.TABLE_CIRCLES,
            {"Referral_Key": "key-1", "Receiver": "Ada"},
            ["Referral_Key"],
        )
    )

    assert result == expected_record
    assert calls == [
        (
            "PATCH",
            "https://api.airtable.com/v0/test-base/Circles",
            {
                "json": {
                    "performUpsert": {"fieldsToMergeOn": ["Referral_Key"]},
                    "records": [
                        {"fields": {"Referral_Key": "key-1", "Receiver": "Ada"}}
                    ],
                }
            },
        )
    ]


@pytest.mark.parametrize("payload", [{}, {"records": []}, {"records": None}])
def test_upsert_by_fields_rejects_missing_or_empty_records(monkeypatch, payload):
    async def fake_request(method, url, **kwargs):
        request = httpx.Request(method, url)
        return httpx.Response(200, json=payload, request=request)

    enable_airtable(monkeypatch)
    monkeypatch.setattr(server.airtable_client, "_request", fake_request)

    with pytest.raises(RuntimeError, match="upsert returned no records"):
        run(
            server.airtable_client._upsert_by_fields(
                server.airtable_client.TABLE_CIRCLES,
                {"Referral_Key": "key-1"},
                ["Referral_Key"],
            )
        )


def test_concurrent_circle_upserts_with_same_key_create_one_logical_record(
    monkeypatch,
):
    stored_by_key = {}
    arrivals = 0

    async def scenario():
        barrier = asyncio.Event()
        lock = asyncio.Lock()

        async def fake_request(method, url, **kwargs):
            nonlocal arrivals
            arrivals += 1
            if arrivals == 2:
                barrier.set()
            await barrier.wait()
            fields = kwargs["json"]["records"][0]["fields"]
            referral_key = fields["Referral_Key"]
            async with lock:
                record = stored_by_key.setdefault(
                    referral_key,
                    {"id": "rec-circle-shared", "fields": fields},
                )
            request = httpx.Request(method, url)
            return httpx.Response(200, json={"records": [record]}, request=request)

        monkeypatch.setattr(server.airtable_client, "_request", fake_request)
        return await asyncio.gather(
            server.airtable_client.create_circle_record(
                initiator="Rita",
                receiver="Ada",
                referral_key="shared-key",
                strict_persistence=True,
            ),
            server.airtable_client.create_circle_record(
                initiator="Rita",
                receiver="Ada",
                referral_key="shared-key",
                strict_persistence=True,
            ),
        )

    enable_airtable(monkeypatch)
    record_ids = run(scenario())

    assert record_ids == ["rec-circle-shared", "rec-circle-shared"]
    assert len(stored_by_key) == 1


def test_circle_upsert_missing_referral_key_field_fails_loudly(monkeypatch):
    request = httpx.Request("PATCH", "https://api.airtable.com/v0/base/Circles")
    response = httpx.Response(422, request=request)
    missing_field_error = httpx.HTTPStatusError(
        "Unknown field name: Referral_Key", request=request, response=response
    )

    async def failing_request(method, url, **kwargs):
        raise missing_field_error

    enable_airtable(monkeypatch)
    monkeypatch.setattr(server.airtable_client, "_request", failing_request)

    with pytest.raises(httpx.HTTPStatusError, match="Referral_Key"):
        run(
            server.airtable_client.create_circle_record(
                initiator="Rita",
                receiver="Ada",
                referral_key="a" * 64,
                strict_persistence=True,
            )
        )


def test_lead_magnet_awaits_user_write_with_exact_interests(monkeypatch):
    calls = []

    async def fake_find_or_create_user(**kwargs):
        await asyncio.sleep(0)
        calls.append(kwargs)
        return "rec-lead"

    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", fake_find_or_create_user
    )

    result = run(
        server.blog_lead_magnet(
            server.LeadMagnetRequest(
                email=" Test.Lead@example.com ", slug=" compounding-growth "
            )
        )
    )

    assert result == {"status": "ok"}
    assert calls == [
        {
            "name": "Test Lead",
            "email": "test.lead@example.com",
            "extra_fields": {"Interests": "Blog Lead Magnet: compounding-growth"},
            "strict_persistence": True,
        }
    ]


def test_lead_magnet_returns_non_success_when_user_write_returns_none(monkeypatch):
    async def fake_find_or_create_user(**kwargs):
        return None

    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", fake_find_or_create_user
    )

    response = run(
        post(
            "/api/blog/lead-magnet",
            {"email": "lead@example.com", "slug": "growth"},
        )
    )

    assert response.status_code == 502


def test_lead_magnet_maps_user_write_exception_without_leaking_details(monkeypatch):
    async def fake_find_or_create_user(**kwargs):
        raise RuntimeError("secret Airtable transport detail")

    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", fake_find_or_create_user
    )

    response = run(
        post(
            "/api/blog/lead-magnet",
            {"email": "lead@example.com", "slug": "growth"},
        )
    )

    assert response.status_code == 502
    assert "secret Airtable transport detail" not in response.text


def test_lead_magnet_existing_user_patch_failure_is_not_success(monkeypatch):
    async def fake_get(table, params):
        return {"records": [{"id": "rec-existing"}]}

    async def failing_update(table, record_id, fields):
        raise RuntimeError("Airtable PATCH failed")

    monkeypatch.setattr(server.airtable_client, "_get", fake_get)
    monkeypatch.setattr(server.airtable_client, "_update", failing_update)

    response = run(
        post(
            "/api/blog/lead-magnet",
            {"email": "existing@example.com", "slug": "growth"},
        )
    )

    assert response.status_code >= 500


def test_find_or_create_user_strict_mode_propagates_lookup_failure(monkeypatch):
    async def failing_get(table, params):
        raise RuntimeError("Airtable lookup failed")

    async def unexpected_create(table, fields):
        raise AssertionError("strict lookup failure must not attempt a create")

    monkeypatch.setattr(server.airtable_client, "_get", failing_get)
    monkeypatch.setattr(server.airtable_client, "_create", unexpected_create)

    with pytest.raises(RuntimeError, match="Airtable lookup failed"):
        run(
            server.airtable_client.find_or_create_user(
                name="Strict Lead",
                email="strict@example.com",
                strict_persistence=True,
            )
        )


def test_find_or_create_user_strict_mode_propagates_create_failure(monkeypatch):
    async def fake_get(table, params):
        return {"records": []}

    async def failing_create(table, fields):
        raise RuntimeError("Airtable create failed")

    monkeypatch.setattr(server.airtable_client, "_get", fake_get)
    monkeypatch.setattr(server.airtable_client, "_create", failing_create)

    with pytest.raises(RuntimeError, match="Airtable create failed"):
        run(
            server.airtable_client.find_or_create_user(
                name="Strict Lead",
                email="strict@example.com",
                strict_persistence=True,
            )
        )


def test_find_or_create_user_strict_mode_rejects_empty_patch_result(monkeypatch):
    async def fake_get(table, params):
        return {"records": [{"id": "rec-existing"}]}

    async def empty_update(table, record_id, fields):
        return None

    monkeypatch.setattr(server.airtable_client, "_get", fake_get)
    monkeypatch.setattr(server.airtable_client, "_update", empty_update)

    with pytest.raises(RuntimeError, match="Airtable user update returned no record"):
        run(
            server.airtable_client.find_or_create_user(
                name="Strict Lead",
                email="strict@example.com",
                strict_persistence=True,
            )
        )


def test_find_or_create_user_default_preserves_existing_user_on_patch_failure(
    monkeypatch,
):
    async def fake_get(table, params):
        return {"records": [{"id": "rec-existing"}]}

    async def failing_update(table, record_id, fields):
        raise RuntimeError("Airtable PATCH failed")

    monkeypatch.setattr(server.airtable_client, "_get", fake_get)
    monkeypatch.setattr(server.airtable_client, "_update", failing_update)

    result = run(
        server.airtable_client.find_or_create_user(
            name="Legacy Caller",
            email="legacy@example.com",
        )
    )

    assert result == "rec-existing"
