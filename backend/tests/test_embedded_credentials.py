from pathlib import Path
import re
import subprocess


ROOT = Path(__file__).resolve().parents[2]


def _tracked_text_files():
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    for raw_path in result.stdout.split(b"\0"):
        if not raw_path:
            continue
        path = ROOT / raw_path.decode()
        try:
            yield path.relative_to(ROOT).as_posix(), path.read_text()
        except UnicodeDecodeError:
            continue


def test_all_tracked_text_is_free_of_known_credentials_and_fallbacks():
    exact_banned = {
        "demo password": "P@y" + "Rew" + "@rds123",
        "preview JWT fallback": "uplaud-preview" + "-jwt-secret-8f3a1c9d",
        "local JWT fallback": "uplaud-local" + "-dev-secret",
        "compromised Supabase URL": (
            "https://nqvkhcrzxdonmmtjzqup" + ".supabase.co"
        ),
    }
    credential_patterns = {
        "Supabase publishable key": re.compile(
            r"sb_publishable_[A-Za-z0-9_-]{20,}"
        ),
    }

    violations = []
    for relative_path, text in _tracked_text_files():
        for label, banned in exact_banned.items():
            if banned in text:
                violations.append(f"{relative_path}: {label}")
        for label, pattern in credential_patterns.items():
            if pattern.search(text):
                violations.append(f"{relative_path}: {label}")

    assert violations == []
