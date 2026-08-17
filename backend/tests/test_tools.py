import pytest
from fastapi.testclient import TestClient
from app.tools.registry import get_tool_registry
from app.tools.builtin.code_runner import code_evaluator
from app.tools.builtin.shell_tool import command_runner
from app.tools.builtin.filesystem_tool import filesystem_inspector
from app.tools.builtin.sql_tool import sql_inspector
from app.tools.builtin.docs_tool import tech_docs_search


def test_tool_registry_registration():
    """Test tools are registered in the registry."""
    registry = get_tool_registry()
    tools = registry.get_all_tools()
    tool_names = [t.name for t in tools]
    
    assert "code_evaluator" in tool_names
    assert "command_runner" in tool_names
    assert "filesystem_inspector" in tool_names
    assert "web_search" in tool_names
    assert "sql_inspector" in tool_names
    assert "tech_docs_search" in tool_names
    assert "search_knowledge_base" in tool_names


def test_code_evaluator_tool():
    """Test executing Python code in code_evaluator sandbox."""
    # 1. Print output
    res = code_evaluator.invoke({"code": "print(2 + 2)\nprint('hello')"})
    assert "4" in res
    assert "hello" in res

    # 2. Syntax/Runtime error handling
    err_res = code_evaluator.invoke({"code": "1 / 0"})
    assert "ZeroDivisionError" in err_res


def test_command_runner_tool():
    """Test running safe commands and blocking hazardous ones."""
    # 1. Safe command
    res = command_runner.invoke({"command": "python --version"})
    assert "Python" in res or "Exit Code: 0" in res

    # 2. Blocked dangerous command
    block_res = command_runner.invoke({"command": "rm -rf /"})
    assert "Security Error" in block_res


def test_filesystem_inspector_tool():
    """Test reading and listing workspace files."""
    # 1. List directory
    list_res = filesystem_inspector.invoke({"action": "list_dir", "path": "backend"})
    assert "app" in list_res or "requirements.txt" in list_res

    # 2. Read file
    read_res = filesystem_inspector.invoke({
        "action": "read_file",
        "path": "backend/requirements.txt",
        "start_line": 1,
        "end_line": 5,
    })
    assert "fastapi" in read_res


def test_sql_inspector_tool():
    """Test safe read-only SQL queries."""
    res = sql_inspector.invoke({"query": "SELECT 1 as num, 'test' as name;"})
    assert "num" in res
    assert "name" in res
    assert "test" in res

    # Disallow write
    bad_res = sql_inspector.invoke({"query": "DROP TABLE users;"})
    assert "Permission Error" in bad_res


def test_list_tools_api(client: TestClient):
    """Test GET /api/tools endpoint returns catalog of registered tools."""
    res = client.get("/api/tools")
    assert res.status_code == 200
    tools = res.json()
    assert len(tools) >= 7
    names = [t["name"] for t in tools]
    assert "code_evaluator" in names
    assert "command_runner" in names
    assert "filesystem_inspector" in names
