"""Reliable local contracts for Airtable-only referral-agent persistence."""

import ast
import asyncio
import os

import httpx
import pytest


os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "uplaud-test")

import airtable_client  # noqa: E402
import server  # noqa: E402


PLAN = {
    "lead_id": "rec-lead-1",
    "status": "pending",
    "research_headline": "A useful signal",
    "research_summary": ["First fact", "Second fact"],
    "email_subject": "A warm introduction",
    "email_body": "Hello from the referral agent.",
    "linkedin_message": "A short LinkedIn note.",
    "next_action": {"label": "Send the introduction", "cta": "Send Email"},
    "generated_at": "2026-07-27T20:00:00+00:00",
}


class ExplodingDb:
    def __getattr__(self, name):
        raise AssertionError(f"referral route accessed MongoDB attribute {name!r}")


class QueuedAsyncClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False

    async def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        return self.responses.pop(0)


def test_server_has_no_mongo_agent_plans_collection_access():
    tree = ast.parse(server.Path(server.__file__).read_text(encoding="utf-8"))
    agent_plan_collections = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Attribute) and node.attr == "agent_plans"
    ]

    assert not agent_plan_collections


def airtable_response(status_code, payload=None):
    request = httpx.Request("PATCH", "https://api.airtable.com/v0/base/Circles/rec-lead-1")
    return httpx.Response(status_code, json=payload or {}, request=request)


def install_retrying_airtable(monkeypatch, responses):
    client = QueuedAsyncClient(responses)
    monkeypatch.setattr(airtable_client, "AIRTABLE_PAT", "test-pat")
    monkeypatch.setattr(airtable_client, "AIRTABLE_BASE_ID", "test-base")
    monkeypatch.setattr(
        airtable_client,
        "AIRTABLE_API_URL",
        "https://api.airtable.com/v0/test-base",
    )
    monkeypatch.setattr(airtable_client.httpx, "AsyncClient", lambda **kwargs: client)

    async def no_sleep(delay):
        return None

    monkeypatch.setattr(asyncio, "sleep", no_sleep)
    return client


@pytest.mark.parametrize(
    "operation",
    [
        lambda: airtable_client.update_circle_agent_plan("rec-lead-1", PLAN),
        lambda: airtable_client.update_circle_agent_plan_status("rec-lead-1", "approved"),
    ],
)
def test_agent_plan_airtable_writes_propagate_failure_after_transport_retries(
    monkeypatch, operation
):
    client = install_retrying_airtable(
        monkeypatch,
        [airtable_response(503, {"error": "temporary"}) for _ in range(3)],
    )

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(operation())

    assert len(client.calls) == 3


def test_update_circle_agent_plan_maps_fields_exactly(monkeypatch):
    calls = []

    async def fake_update(table, record_id, fields):
        calls.append((table, record_id, fields))

    monkeypatch.setattr(airtable_client, "_update", fake_update)

    asyncio.run(airtable_client.update_circle_agent_plan("rec-lead-1", PLAN))

    assert calls == [
        (
            airtable_client.TABLE_CIRCLES,
            "rec-lead-1",
            {
                "Research_Headline": "A useful signal",
                "Research_Summary": "First fact\nSecond fact",
                "Email_Subject": "A warm introduction",
                "Email_Body": "Hello from the referral agent.",
                "Linkedin_Message": "A short LinkedIn note.",
                "Next_Action_Label": "Send the introduction",
                "Next_Action_Cta": "Send Email",
                "Agent_Plan_Status": "pending",
                "Agent_Plan_Generated_At": "2026-07-27T20:00:00+00:00",
            },
        )
    ]


def test_update_circle_agent_plan_status_maps_field_exactly(monkeypatch):
    calls = []

    async def fake_update(table, record_id, fields):
        calls.append((table, record_id, fields))

    monkeypatch.setattr(airtable_client, "_update", fake_update)

    asyncio.run(airtable_client.update_circle_agent_plan_status("rec-lead-1", "skipped"))

    assert calls == [
        (
            airtable_client.TABLE_CIRCLES,
            "rec-lead-1",
            {"Agent_Plan_Status": "skipped"},
        )
    ]


def test_get_warm_leads_returns_airtable_agent_plans_without_mongo(monkeypatch):
    leads = [{"id": "rec-lead-1", "agent_plan": dict(PLAN)}]
    monkeypatch.setattr(server, "db", ExplodingDb())

    async def fake_business_name(email):
        return "Scoped Business"

    async def fake_list(business_name):
        assert business_name == "Scoped Business"
        return leads

    monkeypatch.setattr(
        server.airtable_client,
        "get_business_name_by_email_domain",
        fake_business_name,
    )
    monkeypatch.setattr(server.airtable_client, "list_circles_by_business", fake_list)

    result = asyncio.run(
        server.get_warm_leads(
            current={"email": "owner@scoped.example", "company": "Fallback"}
        )
    )

    assert result == {"business_name": "Scoped Business", "leads": leads}
    assert result["leads"][0]["agent_plan"] == PLAN


def install_scoped_lead(monkeypatch, lead):
    calls = []

    async def fake_business_name(email):
        return "Scoped Business"

    async def fake_get_circle_lead(business_name, lead_id):
        calls.append((business_name, lead_id))
        return lead

    monkeypatch.setattr(server, "db", ExplodingDb())
    monkeypatch.setattr(
        server.airtable_client,
        "get_business_name_by_email_domain",
        fake_business_name,
    )
    monkeypatch.setattr(server.airtable_client, "get_circle_lead", fake_get_circle_lead)
    return calls


def current_user():
    return {"email": "owner@scoped.example", "company": "Fallback"}


def test_agent_run_returns_scoped_airtable_cache_when_not_forced(monkeypatch):
    calls = install_scoped_lead(
        monkeypatch, {"id": "rec-lead-1", "agent_plan": dict(PLAN)}
    )

    async def unexpected(*args, **kwargs):
        raise AssertionError("cached plan must not regenerate or write")

    monkeypatch.setattr(server, "research_lead", unexpected)
    monkeypatch.setattr(server, "draft_outreach", unexpected)
    monkeypatch.setattr(server.airtable_client, "update_circle_agent_plan", unexpected)

    result = asyncio.run(
        server.run_referral_agent("rec-lead-1", force=False, current=current_user())
    )

    assert result.model_dump() == PLAN
    assert calls == [("Scoped Business", "rec-lead-1")]


def install_agent_generation(monkeypatch, *, write_error=None):
    install_scoped_lead(
        monkeypatch,
        {
            "id": "rec-lead-1",
            "name": "Ada Lead",
            "referrer_testimonial": "A warm testimonial",
            "agent_plan": dict(PLAN),
        },
    )
    monkeypatch.setattr(server, "openai_client", object())

    async def fake_research(lead):
        assert lead["id"] == "rec-lead-1"
        return ["Fresh research"]

    async def fake_draft(lead, testimonial, research, business_name, preferred_channel):
        assert testimonial == "A warm testimonial"
        assert research == ["Fresh research"]
        assert business_name == "Scoped Business"
        return {
            "research_headline": "Fresh headline",
            "email_subject": "Fresh subject",
            "email_body": "Fresh email body",
            "linkedin_message": "Fresh LinkedIn message",
            "next_action_label": "Send fresh outreach",
        }

    writes = []

    async def fake_write(lead_id, plan):
        writes.append((lead_id, plan))
        if write_error:
            raise write_error

    monkeypatch.setattr(server, "research_lead", fake_research)
    monkeypatch.setattr(server, "draft_outreach", fake_draft)
    monkeypatch.setattr(server, "_infer_preferred_channel", lambda lead, research: "Send Email")
    monkeypatch.setattr(server.airtable_client, "update_circle_agent_plan", fake_write)
    return writes


def test_agent_run_force_regenerates_and_strictly_writes_airtable(monkeypatch):
    writes = install_agent_generation(monkeypatch)

    result = asyncio.run(
        server.run_referral_agent("rec-lead-1", force=True, current=current_user())
    )

    assert len(writes) == 1
    assert writes[0][0] == "rec-lead-1"
    assert writes[0][1]["research_summary"] == ["Fresh research"]
    assert result.model_dump() == writes[0][1]
    assert result.generated_at != PLAN["generated_at"]


def test_agent_run_write_failure_prevents_success(monkeypatch):
    error = RuntimeError("Airtable write failed")
    writes = install_agent_generation(monkeypatch, write_error=error)

    with pytest.raises(RuntimeError, match="Airtable write failed"):
        asyncio.run(
            server.run_referral_agent("rec-lead-1", force=True, current=current_user())
        )

    assert len(writes) == 1


@pytest.mark.parametrize(
    ("action", "expected_status"),
    [("approve", "approved"), ("skip", "skipped")],
)
def test_agent_plan_action_scopes_lead_and_strictly_updates_airtable(
    monkeypatch, action, expected_status
):
    calls = install_scoped_lead(
        monkeypatch, {"id": "rec-lead-1", "agent_plan": dict(PLAN)}
    )
    writes = []

    async def fake_status_write(lead_id, status):
        writes.append((lead_id, status))

    monkeypatch.setattr(
        server.airtable_client, "update_circle_agent_plan_status", fake_status_write
    )

    result = asyncio.run(
        server.update_agent_plan_status("rec-lead-1", action, current=current_user())
    )

    expected_plan = {**PLAN, "status": expected_status}
    assert result.model_dump() == expected_plan
    assert calls == [("Scoped Business", "rec-lead-1")]
    assert writes == [("rec-lead-1", expected_status)]


def test_agent_plan_action_missing_scoped_lead_is_404(monkeypatch):
    install_scoped_lead(monkeypatch, None)

    with pytest.raises(server.HTTPException) as exc_info:
        asyncio.run(
            server.update_agent_plan_status(
                "rec-other-tenant", "approve", current=current_user()
            )
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Lead not found"


def test_agent_plan_action_missing_airtable_plan_is_404(monkeypatch):
    install_scoped_lead(monkeypatch, {"id": "rec-lead-1", "agent_plan": None})

    with pytest.raises(server.HTTPException) as exc_info:
        asyncio.run(
            server.update_agent_plan_status(
                "rec-lead-1", "approve", current=current_user()
            )
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "No agent plan found for this lead yet."


def test_agent_plan_action_write_failure_prevents_success(monkeypatch):
    install_scoped_lead(
        monkeypatch, {"id": "rec-lead-1", "agent_plan": dict(PLAN)}
    )

    async def failed_write(lead_id, status):
        raise RuntimeError("Airtable status write failed")

    monkeypatch.setattr(
        server.airtable_client, "update_circle_agent_plan_status", failed_write
    )

    with pytest.raises(RuntimeError, match="Airtable status write failed"):
        asyncio.run(
            server.update_agent_plan_status(
                "rec-lead-1", "approve", current=current_user()
            )
        )
