"""Fail-closed runtime configuration checks for Vercel deployments."""

import os


REQUIRED_VERCEL_ENV_VARS = (
    "JWT_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "AIRTABLE_PAT",
    "AIRTABLE_BASE_ID",
    "OPENAI_API_KEY",
    "PDL_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "REACT_APP_SUPABASE_URL",
    "REACT_APP_SUPABASE_PUBLISHABLE_KEY",
    "BLOB_PRIVATE_READ_WRITE_TOKEN",
    "BLOB_PUBLIC_READ_WRITE_TOKEN",
)

ENV_VAR_FALLBACKS = {
    "AIRTABLE_PAT": "AIRTABLE_API_KEY",
    "BLOB_PRIVATE_READ_WRITE_TOKEN": "BLOB_READ_WRITE_TOKEN",
    "BLOB_PUBLIC_READ_WRITE_TOKEN": "PUBLIC_READ_WRITE_TOKEN",
}


def resolve_env_var(name: str) -> str:
    """Resolve a canonical variable and its supported legacy fallback."""
    value = os.environ.get(name, "").strip()
    if value:
        return value
    fallback = ENV_VAR_FALLBACKS.get(name)
    return os.environ.get(fallback, "").strip() if fallback else ""


def validate_vercel_runtime_config() -> None:
    """Require the complete runtime configuration in every Vercel environment."""
    if "VERCEL_ENV" not in os.environ:
        return

    missing = []
    for name in REQUIRED_VERCEL_ENV_VARS:
        if not resolve_env_var(name):
            missing.append(name)
    if missing:
        raise RuntimeError(
            "Missing required Vercel environment variables: " + ", ".join(missing)
        )

    if resolve_env_var("BLOB_PRIVATE_READ_WRITE_TOKEN") == resolve_env_var(
        "BLOB_PUBLIC_READ_WRITE_TOKEN"
    ):
        raise RuntimeError("Private and public Blob credentials must be distinct")
