from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import tools_condition
from langgraph.checkpoint.memory import MemorySaver
from app.agent.state import AgentState
from app.agent.nodes.chat import chat_node
from app.agent.nodes.tools import create_tool_node
from app.agent.nodes.memory import remember_node
from app.agent.nodes.summarize import summarize_conversation_node
from app.memory.store import get_memory_store


def create_agent_graph():
    """
    Create and compile the ReAct agent graph with tool support, Long-Term Memory,
    and rolling conversation summarization.
    
    Graph Topology:
        START -> remember -> summarize -> chat -> (tools_condition) -> [tools -> chat] | END
    
    Returns:
        The compiled state graph with in-memory checkpointer and BaseStore.
    """
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("remember", remember_node)
    graph.add_node("summarize", summarize_conversation_node)
    graph.add_node("chat", chat_node)
    graph.add_node("tools", create_tool_node())
    
    # Add edges
    graph.add_edge(START, "remember")
    graph.add_edge("remember", "summarize")
    graph.add_edge("summarize", "chat")
    graph.add_conditional_edges(
        "chat",
        tools_condition,
    )
    graph.add_edge("tools", "chat")
    
    # In-memory checkpointer and BaseStore
    checkpointer = MemorySaver()
    store = get_memory_store()
    return graph.compile(checkpointer=checkpointer, store=store)


# Singleton compiled graph
_graph = None


def get_agent_graph():
    """
    Get or create the singleton compiled graph.
    
    Returns:
        The compiled state graph.
    """
    global _graph
    if _graph is None:
        _graph = create_agent_graph()
    return _graph
