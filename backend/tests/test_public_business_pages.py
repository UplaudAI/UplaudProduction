import sys
import types
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

motor_module = types.ModuleType("motor")
motor_asyncio_module = types.ModuleType("motor.motor_asyncio")


class _FakeAsyncIOMotorClient:
    def __init__(self, *args, **kwargs):
        pass

    def __getitem__(self, _name):
        return None


motor_asyncio_module.AsyncIOMotorClient = _FakeAsyncIOMotorClient
motor_module.motor_asyncio = motor_asyncio_module
sys.modules.setdefault("motor", motor_module)
sys.modules.setdefault("motor.motor_asyncio", motor_asyncio_module)

import airtable_client  # noqa: E402
import server  # noqa: E402


client = TestClient(server.app)


def _mock_airtable(monkeypatch):
    async def fake_get(table, params=None):
        if table == airtable_client.TABLE_BUSINESS:
            return {
                "records": [
                    {
                        "id": "rec_business",
                        "fields": {
                            "Business Name": "AI Fiesta",
                            "Business Domain": "aifiesta.ai",
                            "Audience": "b2b",
                            "Industry": "SaaS",
                            "Total Reviews": 2,
                            "Average Rating": 4.5,
                            "Trust Score": 92,
                        },
                    }
                ]
            }
        return {"records": []}

    async def fake_list_uplaud_by_business(business_name):
        assert business_name == "AI Fiesta"
        return [
            {
                "id": "rec_review_1",
                "customer": "Priya Menon",
                "body": "The side-by-side model comparison helped us pick the right answer.",
                "rating": 5,
                "source": "Uplaud",
                "date_added": "2026-06-20",
            },
            {
                "id": "rec_review_2",
                "customer": "Rohan Bakshi",
                "body": "The team onboarding was straightforward.",
                "rating": 4,
                "source": "Uplaud",
                "date_added": "2026-06-18",
            },
        ]

    monkeypatch.setattr(airtable_client, "_enabled", lambda: True)
    monkeypatch.setattr(airtable_client, "_get", fake_get)
    monkeypatch.setattr(airtable_client, "list_uplaud_by_business", fake_list_uplaud_by_business)
    monkeypatch.setattr(server, "db", None)


def test_get_public_business_from_airtable(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "AI Fiesta"
    assert data["audience"] == "b2b"
    assert data["website"] == "aifiesta.ai"


def test_get_public_business_reviews_from_uplaud_table(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/reviews?rating=5&q=side-by-side")

    assert response.status_code == 200
    reviews = response.json()["reviews"]
    assert len(reviews) == 1
    assert reviews[0]["reviewer_name"] == "Priya Menon"
    assert reviews[0]["text"].startswith("The side-by-side")


def test_get_public_business_case_study_from_uplaud_review(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/ai-fiesta/case-studies")

    assert response.status_code == 200
    story = response.json()["case_studies"][0]
    detail = client.get(f"/api/business/public/ai-fiesta/case-studies/{story['slug']}")
    assert detail.status_code == 200
    assert detail.json()["hero_quote_author"] == "Priya Menon"


def test_unknown_public_business_404(monkeypatch):
    _mock_airtable(monkeypatch)

    response = client.get("/api/business/public/not-a-business")

    assert response.status_code == 404
