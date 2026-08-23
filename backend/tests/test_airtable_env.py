import importlib


def test_airtable_api_key_env_enables_airtable_client(monkeypatch):
    monkeypatch.delenv("AIRTABLE_PAT", raising=False)
    monkeypatch.setenv("AIRTABLE_API_KEY", "pat_test")
    monkeypatch.setenv("AIRTABLE_BASE_ID", "app_test")

    import airtable_client

    reloaded = importlib.reload(airtable_client)

    assert reloaded.AIRTABLE_PAT == "pat_test"
    assert reloaded._enabled()
