import os
import re
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

from server import (  # noqa: E402
    TESTIMONIAL_BLOCK_TOKEN,
    _apply_testimonial_block,
    _select_outreach_testimonial,
    build_outreach_prompt,
)


def test_select_outreach_testimonial_preserves_normal_length_full_quote():
    testimonial = (
        "I was genuinely impressed with Scalis' platform; it's probably one of the best I've seen so far. "
        "Everything else I've used feels clunky, but this one is seamless and intuitive. "
        "The pricing model is reasonable, and I appreciate the unlimited usage and functionality. "
        "I'm excited to refer it to my friends who are looking to hire, and I look forward to exploring it "
        "further once we finalize our hiring plans."
    )

    assert _select_outreach_testimonial(testimonial) == testimonial


def test_select_outreach_testimonial_uses_top_sentences_when_quote_is_too_long():
    testimonial = (
        "We started the evaluation after a long internal planning cycle. "
        "The setup notes were detailed and the implementation checklist had a lot of steps. "
        "I was genuinely impressed with Scalis because it felt seamless and intuitive right away. "
        "Our team still needs to finish hiring approvals before we can roll it out. "
        "Everything else we tested felt clunky compared with this platform. "
        "I am excited to refer Scalis to friends who are looking to hire. "
        "We will revisit procurement timing at the end of the quarter. "
        "The calendar reminders and admin notes were also helpful during the demo."
    )

    selected = _select_outreach_testimonial(testimonial)
    selected_sentences = re.findall(r"[^.!?]+[.!?]", selected)

    assert len(selected_sentences) == 3
    assert "seamless and intuitive" in selected
    assert "clunky compared with this platform" in selected
    assert "excited to refer Scalis" in selected
    assert "long internal planning cycle" not in selected


def test_apply_testimonial_block_replaces_token_with_standalone_labeled_quote():
    body = (
        "Hi Pujun,\n\n"
        "Your contact Deepthi Rao recently saw Scalis in action and thought it could be useful for you.\n\n"
        f"{TESTIMONIAL_BLOCK_TOKEN}\n\n"
        "Would you be open to booking a demo?\n\n"
        "Best regards,\n"
        "The Scalis team"
    )
    testimonial = "Everything else I've used feels clunky, but this one is seamless and intuitive."

    formatted = _apply_testimonial_block(body, testimonial, "Deepthi Rao")

    assert TESTIMONIAL_BLOCK_TOKEN not in formatted
    assert 'Deepthi Rao shared this testimonial:' in formatted
    assert f'"{testimonial}"' in formatted
    assert "\n\n\"" in formatted


def test_outreach_prompt_requests_testimonial_slot_not_short_quote():
    prompt = build_outreach_prompt(
        {"name": "Pujun", "company_name": "Kintsugi", "referrer_name": "Deepthi Rao"},
        "Everything else I've used feels clunky, but this one is seamless and intuitive.",
        [],
        "Scalis",
        "Send Email",
    )

    assert TESTIMONIAL_BLOCK_TOKEN in prompt
    assert "short direct quote" not in prompt
