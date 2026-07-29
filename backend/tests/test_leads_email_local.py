import asyncio

import httpx

import server

REAL_ASYNC_CLIENT = httpx.AsyncClient


def run(coroutine):
    return asyncio.run(coroutine)


async def post_lead(payload):
    transport = httpx.ASGITransport(app=server.app, raise_app_exceptions=False)
    async with REAL_ASYNC_CLIENT(transport=transport, base_url="http://test") as client:
        return await client.post("/api/leads", json=payload)


LEAD_PAYLOAD = {
    "name": "Demo Buyer",
    "email": "buyer@example.com",
    "company": "Buyer Co",
    "website": "https://buyer.example",
    "message": "I want to book a demo.",
}


def test_lead_form_fails_when_email_delivery_is_not_configured(monkeypatch):
    events = []

    async def fake_log_event(**kwargs):
        events.append(kwargs)

    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.setattr(server.airtable_client, "log_event", fake_log_event)

    response = run(post_lead(LEAD_PAYLOAD))

    assert response.status_code == 503
    assert "Email delivery is not configured" in response.text
    assert events and events[0]["event"] == "demo_request"


def test_lead_form_sends_resend_email_before_success(monkeypatch):
    requests = []

    async def fake_log_event(**kwargs):
        pass

    class FakeResponse:
        status_code = 200
        text = '{"id":"email_123"}'

        def raise_for_status(self):
            return None

        def json(self):
            return {"id": "email_123"}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def post(self, url, headers=None, json=None):
            requests.append({"url": url, "headers": headers, "json": json})
            return FakeResponse()

    monkeypatch.setenv("RESEND_API_KEY", "test-resend-key")
    monkeypatch.setenv("DEMO_REQUEST_FROM_EMAIL", "Uplaud Website <demo@uplaud.ai>")
    monkeypatch.setattr(server.airtable_client, "log_event", fake_log_event)
    monkeypatch.setattr(server.httpx, "AsyncClient", FakeAsyncClient)

    response = run(post_lead(LEAD_PAYLOAD))

    assert response.status_code == 200, response.text
    assert response.json()["email_sent"] is True
    assert requests
    request = requests[0]
    assert request["url"] == "https://api.resend.com/emails"
    assert request["headers"]["Authorization"] == "Bearer test-resend-key"
    assert request["json"]["to"] == ["deepthi@uplaud.ai"]
    assert request["json"]["reply_to"] == "buyer@example.com"
    assert "Demo Buyer" in request["json"]["html"]
