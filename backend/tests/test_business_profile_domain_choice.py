import asyncio
import os
import sys
import types
from pathlib import Path

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

import airtable_client  # noqa: E402
from server import get_business_profile, me  # noqa: E402


class _Request:
    def __init__(self, headers=None):
        self.headers = headers or {}


def test_get_business_profile_uses_selected_brand_domain_over_email_domain(monkeypatch):
    async def fake_get(table, params=None):
        formula = (params or {}).get("filterByFormula", "")
        if '"websitebrand.com"' in formula:
            return {
                "records": [
                    {
                        "fields": {
                            "Business Name": "Websitebrand",
                            "Business Domain": "websitebrand.com",
                            "Brand_Color": "#123456",
                            "Logo_Url": "https://websitebrand.com/logo.png",
                            "Brand_Voice": "Clear and direct",
                        }
                    }
                ]
            }
        if '"emailbrand.com"' in formula:
            return {
                "records": [
                    {
                        "fields": {
                            "Business Name": "Emailbrand",
                            "Business Domain": "emailbrand.com",
                            "Brand_Color": "#654321",
                        }
                    }
                ]
            }
        return {"records": []}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(
        airtable_client,
        "get_business_name_by_email_domain",
        lambda _email: asyncio.sleep(0, result="Emailbrand"),
    )

    profile = asyncio.run(
        get_business_profile(
            request=_Request({"X-Uplaud-Brand-Domain": "websitebrand.com"}),
            current={
                "email": "owner@emailbrand.com",
                "company": "Emailbrand",
            },
        )
    )

    assert profile["website"] == "websitebrand.com"
    assert profile["company_name"] == "Websitebrand"
    assert profile["brand_color"] == "#123456"
    assert profile["selected_domain"] == "websitebrand.com"
    assert profile["email_domain"] == "emailbrand.com"


def test_auth_me_uses_selected_brand_domain_over_email_domain(monkeypatch):
    async def fake_get(table, params=None):
        formula = (params or {}).get("filterByFormula", "")
        if '"websitebrand.com"' in formula:
            return {
                "records": [
                    {
                        "fields": {
                            "Business Name": "Websitebrand",
                            "Business Domain": "websitebrand.com",
                        }
                    }
                ]
            }
        return {"records": []}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)

    user = asyncio.run(
        me(
            request=_Request({"X-Uplaud-Brand-Domain": "websitebrand.com"}),
            current={
                "id": "user-1",
                "email": "owner@emailbrand.com",
                "name": "Owner",
                "role": "business",
                "company": "Emailbrand",
                "approved": True,
            },
        )
    )

    assert user.company == "Websitebrand"


def test_auth_me_derives_selected_brand_domain_when_business_record_missing(monkeypatch):
    async def fake_get(table, params=None):
        return {"records": []}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)

    user = asyncio.run(
        me(
            request=_Request({"X-Uplaud-Brand-Domain": "websitebrand.com"}),
            current={
                "id": "user-1",
                "email": "owner@emailbrand.com",
                "name": "Owner",
                "role": "business",
                "company": "Emailbrand",
                "approved": True,
            },
        )
    )

    assert user.company == "Websitebrand"


def test_get_business_profile_derives_selected_domain_when_business_record_missing(monkeypatch):
    async def fake_get(table, params=None):
        return {"records": []}

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)

    profile = asyncio.run(
        get_business_profile(
            request=_Request({"X-Uplaud-Brand-Domain": "websitebrand.com"}),
            current={
                "email": "owner@emailbrand.com",
                "company": "Emailbrand",
            },
        )
    )

    assert profile["selected_domain"] == "websitebrand.com"
    assert profile["company_name"] == "Websitebrand"
