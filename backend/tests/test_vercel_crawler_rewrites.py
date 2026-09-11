import json
import re
from pathlib import Path


def _public_business_crawler_user_agent_pattern() -> re.Pattern:
    config = json.loads(Path("vercel.json").read_text())
    rewrite = next(
        item
        for item in config["rewrites"]
        if item.get("source") == "/business/public/:slug" and item.get("has")
    )
    return re.compile(rewrite["has"][0]["value"])


def test_public_business_rewrite_matches_ai_search_fetchers():
    pattern = _public_business_crawler_user_agent_pattern()

    assert pattern.match("Google-Lens")
    assert pattern.match("GoogleOther")
    assert pattern.match("Gemini-Deep-Research")


def test_public_business_rewrite_still_matches_known_ai_crawlers():
    pattern = _public_business_crawler_user_agent_pattern()

    assert pattern.match("GPTBot")
    assert pattern.match("ChatGPT-User")
    assert pattern.match("OAI-SearchBot")
    assert pattern.match("PerplexityBot")
