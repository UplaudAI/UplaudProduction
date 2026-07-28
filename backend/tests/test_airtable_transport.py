import asyncio

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


def response(status_code, payload=None, headers=None):
    request = httpx.Request("GET", "https://api.airtable.com/v0/base/Table")
    return httpx.Response(status_code, json=payload, headers=headers, request=request)


def enable_airtable(monkeypatch):
    monkeypatch.setattr(airtable_client, "AIRTABLE_PAT", "test-pat")
    monkeypatch.setattr(airtable_client, "AIRTABLE_BASE_ID", "test-base")
    monkeypatch.setattr(airtable_client, "AIRTABLE_API_URL", "https://api.airtable.com/v0/test-base")


def install_client(monkeypatch, responses):
    client = QueuedAsyncClient(responses)
    monkeypatch.setattr(airtable_client.httpx, "AsyncClient", lambda **kwargs: client)
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


def test_get_record_returns_none_on_404_without_retry(monkeypatch):
    enable_airtable(monkeypatch)
    client = install_client(monkeypatch, [response(404, {"error": "not found"})])

    result = asyncio.run(airtable_client._get_record("Table", "missing"))

    assert result is None
    assert len(client.calls) == 1


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
