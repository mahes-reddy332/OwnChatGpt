import time
import pytest
from app.tools.executor import classify_tool, ToolExecutionTimer
from app.tools.registry import get_tool_registry


def test_classify_tools():
    """Test tool classification logic."""
    registry = get_tool_registry()

    # RAG tool
    assert classify_tool("search_knowledge_base") == "rag"

    # Built-in developer tools
    assert classify_tool("code_evaluator") == "builtin"
    assert classify_tool("command_runner") == "builtin"
    assert classify_tool("filesystem_inspector") == "builtin"
    assert classify_tool("web_search") == "builtin"
    assert classify_tool("sql_inspector") == "builtin"


def test_tool_execution_timer():
    """Test latency duration measurement."""
    timer = ToolExecutionTimer("code_evaluator", "builtin")
    timer.start()
    time.sleep(0.02)  # 20ms
    duration = timer.stop()

    assert duration >= 15.0  # at least 15ms
    assert timer.tool_name == "code_evaluator"
    assert timer.tool_type == "builtin"


def test_registry_schema_includes_tool_type():
    """Test that all tool schemas export with classification metadata."""
    registry = get_tool_registry()
    schemas = registry.get_tool_schemas()

    for s in schemas:
        assert "tool_type" in s
        assert s["tool_type"] in ("builtin", "mcp", "rag")
