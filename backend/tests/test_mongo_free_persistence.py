"""Contracts for removing MongoDB and in-memory source persistence from server.py."""

import ast
from pathlib import Path


SERVER_PATH = Path(__file__).resolve().parents[1] / "server.py"


def _server_tree() -> ast.Module:
    return ast.parse(SERVER_PATH.read_text(encoding="utf-8"))


def _server_source() -> str:
    return SERVER_PATH.read_text(encoding="utf-8")


def test_server_does_not_import_motor_asyncio():
    imports = [
        alias.name
        for node in ast.walk(_server_tree())
        if isinstance(node, ast.ImportFrom) and node.module == "motor.motor_asyncio"
        for alias in node.names
    ]

    assert not imports, "server.py must not import motor.motor_asyncio"


def test_server_does_not_reference_mongo_url():
    assert "MONGO_URL" not in _server_source()


def test_server_does_not_reference_mongo_database_name():
    assert "DB_NAME" not in _server_source()


def test_server_has_no_db_runtime_access():
    db_accesses = [
        node
        for node in ast.walk(_server_tree())
        if isinstance(node, ast.Attribute)
        and isinstance(node.value, ast.Name)
        and node.value.id == "db"
    ]

    assert not db_accesses, "server.py must not access the Mongo db runtime"


def test_server_does_not_use_temporary_source_store():
    assert "TEMP_SOURCES" not in _server_source()
