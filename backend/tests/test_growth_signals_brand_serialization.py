import os
import sys
from pathlib import Path

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "uplaud_test")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import record_to_source_out  # noqa: E402


def test_record_to_source_out_exposes_airtable_business_name_as_brand():
    source = record_to_source_out(
        {
            "id": "rec_123",
            "createdTime": "2026-08-07T12:00:00Z",
            "fields": {
                "Business_Name": "Scalis",
                "Source_Id": "src_123",
                "Company": "Atrios",
                "Person": "Deepthi Rao",
            },
        }
    )

    assert source.brand == "Scalis"
    assert source.model_dump()["brand"] == "Scalis"


def test_record_to_source_out_falls_back_to_logged_in_business_name():
    source = record_to_source_out(
        {
            "id": "rec_456",
            "createdTime": "2026-08-07T12:00:00Z",
            "fields": {
                "Source_Id": "src_456",
                "Company": "Atrios",
                "Person": "Deepthi Rao",
            },
        },
        business_name="Kintsugi",
    )

    assert source.brand == "Kintsugi"
    assert source.model_dump()["brand"] == "Kintsugi"
