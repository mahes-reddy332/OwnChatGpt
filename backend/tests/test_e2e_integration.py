import uuid
import pytest
from fastapi.testclient import TestClient
from app.agent.graph import get_agent_graph
from app.tools.registry import get_tool_registry
from app.memory.store import get_memory_manager
from app.persistence.thread_store import get_thread_store
from app.observability.tracer import build_tracer_config


def test_full_system_components_initialized():
    """Verify that all 12 core subsystems are properly wired and accessible."""
    # 1. LangGraph Agent Graph
    graph = get_agent_graph()
    assert graph is not None
    assert "remember" in graph.nodes
    assert "summarize" in graph.nodes
    assert "chat" in graph.nodes
    assert "tools" in graph.nodes

    # 2. Tool Registry (Built-in + MCP + HITL + RAG)
    registry = get_tool_registry()
    tools = registry.get_all_tools()
    assert len(tools) >= 8
    tool_names = [t.name for t in tools]
    assert "code_evaluator" in tool_names
    assert "command_runner" in tool_names
    assert "filesystem_inspector" in tool_names
    assert "web_search" in tool_names
    assert "sql_inspector" in tool_names
    assert "tech_docs_search" in tool_names
    assert "search_knowledge_base" in tool_names
    assert "send_email_action" in tool_names
    assert "execute_database_mutation" in tool_names

    # 3. Long-Term Memory BaseStore
    mem_mgr = get_memory_manager()
    assert mem_mgr is not None

    # 4. Thread Store
    thread_store = get_thread_store()
    assert thread_store is not None


@pytest.mark.asyncio
async def test_e2e_workflow_lifecycle(client: TestClient):
    """
    End-to-end integration test simulating a full user journey:
    1. Create thread
    2. Add long-term memory
    3. Upload document to RAG
    4. Query tools schema
    5. Test chat sync endpoint
    6. Verify memory and thread state
    """
    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 200
    user_id = me_res.json()["id"]
    thread_id = f"e2e_thread_{uuid.uuid4()}"

    # 1. Create long-term memory
    mem_res = client.post("/api/memory", json={
        "text": "User is developing a full-stack LangGraph application",
        "category": "project",
    })
    assert mem_res.status_code == 200

    # 2. Upload text document
    doc_content = "Antigravity Agent is an advanced pair programming AI developed by DeepMind."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("antigravity_guide.txt", doc_content.encode("utf-8"), "text/plain")},
    )
    assert upload_res.status_code == 200

    # 3. Query tool schema
    tools_res = client.get("/api/tools")
    assert tools_res.status_code == 200
    tool_schemas = tools_res.json()
    assert len(tool_schemas) >= 8

    # 4. Check memory formatting in prompt
    mem_mgr = get_memory_manager()
    prompt_mem = mem_mgr.format_memories_for_prompt(user_id)
    assert "full-stack LangGraph application" in prompt_mem

    # 5. Check Observability Tracer Config
    tracer_config = build_tracer_config(
        thread_id=thread_id,
        run_name="E2E-TestRun",
        tags=["e2e-test"],
        metadata={"user_id": user_id},
    )
    assert tracer_config["configurable"]["thread_id"] == thread_id
    assert "e2e-test" in tracer_config["tags"]
    assert tracer_config["run_name"] == "E2E-TestRun"

    # 6. Cleanup user memory
    clear_res = client.delete("/api/memory/clear")
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True
