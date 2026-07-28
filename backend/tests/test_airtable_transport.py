import asyncio
import re
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime

import httpx
import pytest

import airtable_client


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


class CountingClientFactory:
    def __init__(self, client):
        self.client = client
        self.calls = 0

    def __call__(self, **kwargs):
        self.calls += 1
        return self.client


def response(status_code, payload=None, headers=None):
    request = httpx.Request("GET", "https://api.airtable.com/v0/base/Table")
    return httpx.Response(status_code, json=payload, headers=headers, request=request)


def enable_airtable(monkeypatch):
    monkeypatch.setattr(airtable_client, "AIRTABLE_PAT", "test-pat")
    monkeypatch.setattr(airtable_client, "AIRTABLE_BASE_ID", "test-base")
    monkeypatch.setattr(airtable_client, "AIRTABLE_API_URL", "https://api.airtable.com/v0/test-base")


def install_client(monkeypatch, responses):
    client = QueuedAsyncClient(responses)
    client.factory = CountingClientFactory(client)
    monkeypatch.setattr(airtable_client.httpx, "AsyncClient", client.factory)
    return client


def test_get_all_follows_offsets_and_combines_records_without_mutating_params(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(
        monkeypatch,
        [
            response(200, {"records": [{"id": "rec1"}], "offset": "next-page"}),
            response(200, {"records": [{"id": "rec2"}]}),
        ],
    )
    params = {"filterByFormula": "{Active}=1", "pageSize": 100}

    records = asyncio.run(airtable_client._get_all("Table", params))

    assert records == [{"id": "rec1"}, {"id": "rec2"}]
    assert params == {"filterByFormula": "{Active}=1", "pageSize": 100}
    assert client.calls[0][2]["params"] == params
    assert client.calls[1][2]["params"] == {**params, "offset": "next-page"}
    assert client.factory.calls == 1


def test_429_without_retry_after_uses_bounded_airtable_fallback():
    assert airtable_client._retry_delay(response(429), 0) == 30


def test_429_with_malformed_retry_after_uses_bounded_airtable_fallback():
    assert airtable_client._retry_delay(
        response(429, headers={"Retry-After": "not-a-delay"}), 0
    ) == 30


def test_429_with_huge_numeric_retry_after_is_capped():
    assert airtable_client._retry_delay(
        response(429, headers={"Retry-After": "999999"}), 0
    ) == 30


def test_429_with_http_date_retry_after_uses_seconds_until_date():
    now = datetime(2026, 7, 27, 12, 0, tzinfo=timezone.utc)
    retry_at = format_datetime(now + timedelta(seconds=12), usegmt=True)

    delay = airtable_client._retry_delay(
        response(429, headers={"Retry-After": retry_at}), 0, now=now
    )

    assert delay == 12


def test_transient_429_is_retried_then_returns_success(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(
        monkeypatch,
        [
            response(429, {"error": "rate limited"}, headers={"Retry-After": "0"}),
            response(200, {"records": [{"id": "rec1"}]}),
        ],
    )
    sleeps = []

    async def fake_sleep(delay):
        sleeps.append(delay)

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)

    result = asyncio.run(airtable_client._get("Table"))

    assert result == {"records": [{"id": "rec1"}]}
    assert len(client.calls) == 2
    assert sleeps == [0]


def test_5xx_retries_use_short_exponential_backoff(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(
        monkeypatch,
        [
            response(503, {"error": "temporary"}),
            response(503, {"error": "temporary"}),
            response(200, {"records": []}),
        ],
    )
    sleeps = []

    async def fake_sleep(delay):
        sleeps.append(delay)

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)

    assert asyncio.run(airtable_client._get("Table")) == {"records": []}
    assert len(client.calls) == 3
    assert sleeps == [0.1, 0.2]


@pytest.mark.parametrize(
    ("retry_after", "expected_delay"),
    [("7", 7), ("999999", 30)],
)
def test_503_honors_and_caps_retry_after(retry_after, expected_delay):
    delay = airtable_client._retry_delay(
        response(503, headers={"Retry-After": retry_after}), 0
    )

    assert delay == expected_delay


def test_503_malformed_retry_after_uses_exponential_fallback():
    delay = airtable_client._retry_delay(
        response(503, headers={"Retry-After": "not-a-delay"}), 1
    )

    assert delay == 0.2


@pytest.mark.parametrize("status_code", [429, 500, 502, 503, 504])
def test_exhausted_retryable_status_propagates_after_three_attempts(monkeypatch, status_code):
    enable_airtable(monkeypatch)
    client = install_client(
        monkeypatch,
        [response(status_code, {"error": "temporary"}) for _ in range(3)],
    )

    async def fake_sleep(delay):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)

    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        asyncio.run(airtable_client._get("Table"))

    assert exc_info.value.response.status_code == status_code
    assert len(client.calls) == 3


def test_non_retryable_4xx_propagates_without_retry(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(monkeypatch, [response(422, {"error": "invalid request"})])

    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        asyncio.run(airtable_client._get("Table"))

    assert exc_info.value.response.status_code == 422
    assert len(client.calls) == 1


def test_post_5xx_propagates_without_retry_to_avoid_duplicate_creates(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(monkeypatch, [response(500, {"error": "ambiguous"})])

    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        asyncio.run(airtable_client._create("Table", {"Name": "Ada"}))

    assert exc_info.value.response.status_code == 500
    assert len(client.calls) == 1


def test_post_429_is_retried_after_definite_rate_limit(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(
        monkeypatch,
        [
            response(429, {"error": "rate limited"}, headers={"Retry-After": "0"}),
            response(200, {"id": "rec1", "fields": {"Name": "Ada"}}),
        ],
    )

    async def fake_sleep(delay):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)

    result = asyncio.run(airtable_client._create("Table", {"Name": "Ada"}))

    assert result["id"] == "rec1"
    assert len(client.calls) == 2


def test_get_record_returns_none_on_404_without_retry(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(monkeypatch, [response(404, {"error": "not found"})])

    result = asyncio.run(airtable_client._get_record("Table", "missing"))

    assert result is None
    assert len(client.calls) == 1


def test_table_and_record_path_segments_are_url_quoted(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(
        monkeypatch,
        [response(200, {"id": "rec/1 ?", "fields": {}})],
    )

    asyncio.run(airtable_client._get_record("People / Leads", "rec/1 ?"))

    _, url, _ = client.calls[0]
    assert url == "https://api.airtable.com/v0/test-base/People%20%2F%20Leads/rec%2F1%20%3F"


@pytest.mark.parametrize(
    ("operation", "expected_method", "expected_json"),
    [
        (lambda: airtable_client._get("Table", {"view": "Grid view"}), "GET", None),
        (lambda: airtable_client._get_record("Table", "rec1"), "GET", None),
        (lambda: airtable_client._create("Table", {"Name": "Ada"}), "POST", {"fields": {"Name": "Ada"}}),
        (
            lambda: airtable_client._update("Table", "rec1", {"Name": "Grace"}),
            "PATCH",
            {"fields": {"Name": "Grace"}},
        ),
    ],
)
def test_existing_transport_helpers_preserve_json_return_shapes(
    monkeypatch, operation, expected_method, expected_json
):
    enable_airtable(monkeypatch)
    payload = {"id": "rec1", "fields": {"Name": "Ada"}}
    client = install_client(monkeypatch, [response(200, payload)])

    result = asyncio.run(operation())

    assert result == payload
    method, _, kwargs = client.calls[0]
    assert method == expected_method
    if expected_json is None:
        assert "json" not in kwargs
    else:
        assert kwargs["json"] == expected_json


def test_disabled_helpers_preserve_existing_empty_shapes(monkeypatch):
    monkeypatch.setattr(airtable_client, "AIRTABLE_PAT", "")
    monkeypatch.setattr(airtable_client, "AIRTABLE_BASE_ID", "")

    assert asyncio.run(airtable_client._get("Table")) == {"records": []}
    assert asyncio.run(airtable_client._get_all("Table")) == []
    assert asyncio.run(airtable_client._get_record("Table", "rec1")) is None
    assert asyncio.run(airtable_client._create("Table", {})) is None
    assert asyncio.run(airtable_client._update("Table", "rec1", {})) is None


def test_circles_linked_users_are_fetched_in_bounded_complete_batches(monkeypatch):
    count = 405
    circle_records = [
        {
            "id": f"circle-{index}",
            "fields": {
                "Receiver": f"Lead {index}",
                "UserTable Link": [f"recUser{index:04d}"],
            },
        }
        for index in range(count)
    ]
    user_calls = []
    user_clients = []
    client = install_client(monkeypatch, [])

    async def fake_get_all(table, params=None, client=None):
        if table == airtable_client.TABLE_CIRCLES:
            return circle_records
        assert table == airtable_client.TABLE_USER
        user_clients.append(client)
        formula = params["filterByFormula"]
        user_ids = re.findall(r'RECORD_ID\(\)="([^"]+)"', formula)
        user_calls.append((formula, user_ids))
        return [
            {"id": user_id, "fields": {"Job_Title": f"Title {int(user_id[-4:])}"}}
            for user_id in user_ids
        ]

    monkeypatch.setattr(airtable_client, "_get_all", fake_get_all)

    leads = asyncio.run(airtable_client.list_circles_by_business("Acme"))

    assert len(user_calls) > 1
    assert all(len(user_ids) <= 100 for _, user_ids in user_calls)
    assert all(len(formula) <= 3500 for formula, _ in user_calls)
    assert client.factory.calls == 1
    assert user_clients and all(user_client is client for user_client in user_clients)
    assert len(leads) == count
    assert {lead["job_title"] for lead in leads} == {
        f"Title {index}" for index in range(count)
    }


def test_circles_discard_partial_user_enrichment_when_a_batch_fails(monkeypatch):
    count = 150
    circle_records = [
        {
            "id": f"circle-{index}",
            "fields": {
                "Receiver": f"Lead {index}",
                "UserTable Link": [f"recUser{index:04d}"],
            },
        }
        for index in range(count)
    ]
    user_call_count = 0
    install_client(monkeypatch, [])

    async def fake_get_all(table, params=None, client=None):
        nonlocal user_call_count
        if table == airtable_client.TABLE_CIRCLES:
            return circle_records
        user_call_count += 1
        if user_call_count == 2:
            raise httpx.ReadTimeout("second user batch failed")
        user_ids = re.findall(r'RECORD_ID\(\)="([^"]+)"', params["filterByFormula"])
        return [
            {"id": user_id, "fields": {"Job_Title": "Temporarily enriched"}}
            for user_id in user_ids
        ]

    monkeypatch.setattr(airtable_client, "_get_all", fake_get_all)

    leads = asyncio.run(airtable_client.list_circles_by_business("Acme"))

    assert user_call_count == 2
    assert all(lead["job_title"] == "" for lead in leads)
