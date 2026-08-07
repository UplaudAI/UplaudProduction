import os
import sys
from pathlib import Path

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "uplaud_test")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import _growth_signal_regeneration_text  # noqa: E402


def test_growth_signal_regeneration_text_uses_all_available_signal_fields():
    text = _growth_signal_regeneration_text(
        {
            "Testimonial_Draft": "The product felt seamless and intuitive.",
            "Motivations": "Needed a better hiring workflow.",
            "Pain_Points": "Everything else felt clunky.",
            "Buying_Signals": "I am excited to refer it to friends.",
            "Customer_Language": "one of the best I've seen so far",
            "Product_Feedback": "Pricing model is reasonable.",
            "FAQs": "Can we use unlimited seats?",
        }
    )

    assert "Existing testimonial" in text
    assert "Everything else felt clunky." in text
    assert "one of the best I've seen so far" in text
    assert "Can we use unlimited seats?" in text


def test_growth_signal_regeneration_text_falls_back_to_existing_testimonial():
    text = _growth_signal_regeneration_text(
        {"Testimonial_Draft": "The product felt seamless and intuitive."}
    )

    assert "The product felt seamless and intuitive." in text
