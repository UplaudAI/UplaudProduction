"""Contracts for removing MongoDB and in-memory source persistence from server.py."""

import ast
from pathlib import Path


SERVER_PATH = Path(__file__).resolve().parents[1] / "server.py"


def _server_tree() -> ast.Module:
    return ast.parse(SERVER_PATH.read_text(encoding="utf-8"))


def _server_source() -> str:
    return SERVER_PATH.read_text(encoding="utf-8")


def _motor_imports() -> list[str]:
    imports = []
    for node in ast.walk(_server_tree()):
        if isinstance(node, ast.Import):
            imports.extend(
                alias.name
                for alias in node.names
                if alias.name == "motor" or alias.name.startswith("motor.")
            )
        elif (
            isinstance(node, ast.ImportFrom)
            and node.module is not None
            and (node.module == "motor" or node.module.startswith("motor."))
        ):
            imports.extend(f"{node.module}.{alias.name}" for alias in node.names)
    return imports


def _symbol_nodes(symbol: str) -> list[ast.AST]:
    return [
        node
        for node in ast.walk(_server_tree())
        if (isinstance(node, ast.Name) and node.id == symbol)
        or (isinstance(node, ast.Constant) and node.value == symbol)
    ]


def test_server_does_not_import_motor_asyncio():
    assert not _motor_imports(), "server.py must not import Motor runtime modules"


def test_server_does_not_reference_mongo_url():
    assert not _symbol_nodes("MONGO_URL")
    assert "MONGO_URL" not in _server_source()


def test_server_does_not_reference_mongo_database_name():
    assert not _symbol_nodes("DB_NAME")
    assert "DB_NAME" not in _server_source()


def test_server_has_no_db_runtime_access():
    db_accesses = [
        node
        for node in ast.walk(_server_tree())
        if isinstance(node, ast.Name)
        and node.id == "db"
        and isinstance(node.ctx, ast.Load)
    ]

    assert not db_accesses, "server.py must not access the Mongo db runtime"


def test_server_does_not_use_temporary_source_store():
    assert not _symbol_nodes("TEMP_SOURCES")
    assert "TEMP_SOURCES" not in _server_source()
