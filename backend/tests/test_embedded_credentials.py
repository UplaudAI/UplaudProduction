from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_runtime_sources_do_not_embed_supabase_project_credentials():
    for relative_path in (
        "backend/server.py",
        "frontend/src/lib/supabase.js",
    ):
        source = (ROOT / relative_path).read_text()
        assert "sb_publishable_" not in source, relative_path
        assert ".supabase.co" not in source, relative_path
