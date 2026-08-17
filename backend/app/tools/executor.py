import time
import logging
from typing import Literal, Any
from langchain_core.tools import BaseTool

logger = logging.getLogger("app.tools.executor")

ToolType = Literal["builtin", "mcp", "rag"]


def classify_tool(tool_name: str, tool_obj: BaseTool | None = None) -> ToolType:
    """
    Classify a tool into 'rag', 'mcp', or 'builtin'.
    """
    if tool_name == "search_knowledge_base":
        return "rag"
    
    if (
        tool_name.startswith(("gdrive_", "gmail_", "gcalendar_", "github_", "expense_"))
        or (tool_obj and hasattr(tool_obj, "tags") and tool_obj.tags and "mcp" in tool_obj.tags)
        or (tool_obj and isinstance(getattr(tool_obj, "metadata", None), dict) and tool_obj.metadata.get("is_mcp"))
    ):
        return "mcp"
        
    return "builtin"


class ToolExecutionTimer:
    """Measures precise execution latency for tool invocations."""

    def __init__(self, tool_name: str, tool_type: ToolType = "builtin"):
        self.tool_name = tool_name
        self.tool_type = tool_type
        self._start_time: float = 0.0
        self.duration_ms: float = 0.0

    def start(self) -> None:
        self._start_time = time.perf_counter()

    def stop(self) -> float:
        if self._start_time > 0:
            self.duration_ms = round((time.perf_counter() - self._start_time) * 1000, 2)
        return self.duration_ms
