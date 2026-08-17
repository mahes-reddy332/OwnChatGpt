from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """State for the agent graph with message history and rolling summary."""
    messages: Annotated[list, add_messages]
    summary: str
