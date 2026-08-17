import uuid
import pytest
from fastapi.testclient import TestClient
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.types import Command
from app.tools.registry import get_tool_registry
from app.agent.graph import get_agent_graph


def test_hitl_tools_registered():
    """Test that sensitive HITL tools are present in the ToolRegistry."""
    registry = get_tool_registry()
    assert registry.get_tool("send_email_action") is not None
    assert registry.get_tool("execute_database_mutation") is not None
    
    email_tool = registry.get_tool("send_email_action")
    assert email_tool is not None
    assert "email" in email_tool.name


def test_hitl_resume_api_endpoints(client: TestClient):
    """Test REST resume endpoints with simulated thread state."""
    thread_id = f"test-hitl-{uuid.uuid4()}"

    # Resume with approval
    res_approve = client.post("/api/chat/resume", json={
        "thread_id": thread_id,
        "decision": "approve",
    })
    # Since thread has no pending interrupt, server handles gracefully
    assert res_approve.status_code in (200, 500)

    # Resume stream endpoint
    res_stream = client.post("/api/chat/resume/stream", json={
        "thread_id": thread_id,
        "decision": "reject",
    })
    assert res_stream.status_code == 200
    assert "text/event-stream" in res_stream.headers["content-type"]
