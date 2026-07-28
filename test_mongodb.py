"""Regression guard: V2 runtime persistence must remain Mongo-free."""

from pathlib import Path


ROOT = Path(__file__).resolve().parent


def test_runtime_has_no_mongodb_driver_or_configuration():
    requirements = "\n".join(
        (ROOT / path).read_text()
        for path in ("requirements.txt", "backend/requirements.txt")
    ).lower()
    server_source = (ROOT / "backend/server.py").read_text()

    assert "motor" not in requirements
    assert "pymongo" not in requirements
    assert "AsyncIOMotorClient" not in server_source
    assert "MONGO_URL" not in server_source
