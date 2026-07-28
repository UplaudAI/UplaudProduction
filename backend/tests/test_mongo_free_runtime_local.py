"""Local behavior contracts for Airtable-only referral and lead persistence."""

import asyncio
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

    async def fake_find_public_source(share_id):
        assert share_id == "share-1"
        return PUBLIC_SOURCE

    async def fake_enrich(first_name, last_name, company):
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
    return user_calls, circle_calls


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
    user_calls, circle_calls = install_referral_fakes(monkeypatch)

    result = run(
        server.submit_referrals(
            "share-1", server.ReferralSubmit(**referral_payload())
        )
    )

    assert result == {"count": 2}
    assert len(user_calls) == 2
    assert len(circle_calls) == 2
    assert user_calls[0]["extra_fields"]["Job_Title"] == "VP Growth"
    assert user_calls[0]["city"] == "Oakland"
    assert circle_calls[0] == {
        "initiator": "Rita Referrer",
        "receiver": "Ada Lovelace",
        "business_name": "Uplaud",
        "phone": "",
        "referred_date": circle_calls[0]["referred_date"],
        "receiver_company": "Analytical Engines",
        "receiver_user_id": "rec-user-1",
        "referrer_testimonial": "Uplaud made referrals easy.",
    }


def test_referral_returns_non_success_when_circle_creation_returns_none(monkeypatch):
    install_referral_fakes(monkeypatch, circle_result=None)

    response = run(
        post(
            "/api/public/testimonial/share-1/referrals",
            {"referrals": [referral_payload()["referrals"][0]]},
        )
    )

    assert response.status_code == 502


def test_referral_propagates_circle_creation_exception(monkeypatch):
    install_referral_fakes(monkeypatch, circle_result=RuntimeError("airtable down"))

    with pytest.raises(RuntimeError, match="airtable down"):
        run(
            server.submit_referrals(
                "share-1",
                server.ReferralSubmit(referrals=[referral_payload()["referrals"][0]]),
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


def test_lead_magnet_propagates_user_write_exception(monkeypatch):
    async def fake_find_or_create_user(**kwargs):
        raise RuntimeError("airtable unavailable")

    monkeypatch.setattr(
        server.airtable_client, "find_or_create_user", fake_find_or_create_user
    )

    with pytest.raises(RuntimeError, match="airtable unavailable"):
        run(
            server.blog_lead_magnet(
                server.LeadMagnetRequest(email="lead@example.com", slug="growth")
            )
        )
