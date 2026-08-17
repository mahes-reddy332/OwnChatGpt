import json
from typing import Any, Literal
from pydantic import BaseModel, Field


class StreamStartEvent(BaseModel):
    """Event emitted when a stream begins."""
    thread_id: str
    run_id: str | None = None


class TokenEvent(BaseModel):
    """Event emitted for each generated text token."""
    content: str


class ToolCallStartEvent(BaseModel):
    """Event emitted when a tool invocation begins."""
    tool_id: str
    tool_name: str
    args: dict[str, Any] = Field(default_factory=dict)
    tool_type: Literal["builtin", "mcp", "rag"] = "builtin"


class ToolCallEndEvent(BaseModel):
    """Event emitted when a tool finishes execution."""
    tool_id: str
    result: str
    tool_name: str | None = None
    tool_type: Literal["builtin", "mcp", "rag"] = "builtin"
    execution_time_ms: float = 0.0


class RagSourceItem(BaseModel):
    """Source item cited during RAG retrieval."""
    filename: str
    page: int = 1
    snippet: str


class RagSourcesEvent(BaseModel):
    """Event emitted when knowledge base sources are retrieved."""
    sources: list[RagSourceItem] = Field(default_factory=list)


class StreamEndEvent(BaseModel):
    """Event emitted when streaming is completed."""
    thread_id: str
    content: str
    sources: list[RagSourceItem] = Field(default_factory=list)


class HitlInterruptEvent(BaseModel):
    """Event emitted when execution pauses for human approval."""
    interrupt_id: str
    tool_name: str
    action: str
    description: str
    args: dict[str, Any] = Field(default_factory=dict)
    thread_id: str


class ErrorEvent(BaseModel):
    """Event emitted when an error occurs during execution."""
    detail: str
    code: str = "STREAMING_ERROR"


def format_sse(event: str, data: dict[str, Any] | BaseModel) -> str:
    """
    Format data as a Server-Sent Events (SSE) compliant message string.
    
    Args:
        event (str): The name of the event (e.g. 'token', 'stream_start').
        data (dict | BaseModel): The payload data.
        
    Returns:
        str: SSE formatted string 'event: <name>\\ndata: <json>\\n\\n'
    """
    if isinstance(data, BaseModel):
        payload = data.model_dump_json()
    elif isinstance(data, dict):
        payload = json.dumps(data)
    else:
        payload = json.dumps({"data": str(data)})

    return f"event: {event}\ndata: {payload}\n\n"
