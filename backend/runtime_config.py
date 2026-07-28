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
    "BLOB_PRIVATE_READ_WRITE_TOKEN",
    "BLOB_PUBLIC_READ_WRITE_TOKEN",
)


def validate_vercel_runtime_config() -> None:
    """Require the complete runtime configuration in every Vercel environment."""
    if "VERCEL_ENV" not in os.environ:
        return

    missing = [
        name for name in REQUIRED_VERCEL_ENV_VARS if not os.environ.get(name, "").strip()
    ]
    if missing:
        raise RuntimeError(
            "Missing required Vercel environment variables: " + ", ".join(missing)
        )
