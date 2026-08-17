import uuid
import pytest
from langchain_core.messages import HumanMessage, AIMessage, RemoveMessage
from app.agent.nodes.summarize import summarize_conversation_node
from app.agent.graph import get_agent_graph


@pytest.mark.asyncio
async def test_summarize_node_below_threshold():
    """Test summarizer does not trigger when message count <= 6."""
    messages = [
        HumanMessage(content="Hello", id="msg1"),
        AIMessage(content="Hi there!", id="msg2"),
        HumanMessage(content="How are you?", id="msg3"),
    ]
    state = {"messages": messages, "summary": ""}
    result = await summarize_conversation_node(state, {})

    assert result == {}


@pytest.mark.asyncio
async def test_summarize_node_triggers_above_threshold():
    """Test summarizer compresses older messages when message count > 6."""
    messages = [
        HumanMessage(content="Message 1 about Python", id="m1"),
        AIMessage(content="Response 1 about Python", id="m2"),
        HumanMessage(content="Message 2 about FastAPI", id="m3"),
        AIMessage(content="Response 2 about FastAPI", id="m4"),
        HumanMessage(content="Message 3 about LangGraph", id="m5"),
        AIMessage(content="Response 3 about LangGraph", id="m6"),
        HumanMessage(content="Message 4 about React", id="m7"),
        AIMessage(content="Response 4 about React", id="m8"),
    ]
    state = {"messages": messages, "summary": ""}
    result = await summarize_conversation_node(state, {})

    assert "summary" in result
    assert len(result["summary"]) > 0
    assert "messages" in result
    
    # Check that older messages (m1-m4) were marked for deletion
    deleted_ids = [m.id for m in result["messages"] if isinstance(m, RemoveMessage)]
    assert "m1" in deleted_ids
    assert "m2" in deleted_ids
    assert "m3" in deleted_ids
    assert "m4" in deleted_ids
    # Recent messages (m5-m8) should NOT be deleted
    assert "m5" not in deleted_ids
    assert "m6" not in deleted_ids
    assert "m7" not in deleted_ids
    assert "m8" not in deleted_ids


def test_graph_compilation_with_summarization():
    """Test that agent graph compiles successfully with the summarization node."""
    graph = get_agent_graph()
    assert graph is not None
    assert "summarize" in graph.nodes
    assert "remember" in graph.nodes
    assert "chat" in graph.nodes
    assert "tools" in graph.nodes
