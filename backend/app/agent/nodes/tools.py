from langgraph.prebuilt import ToolNode
import app.tools.builtin  # ensures all built-in tools are registered
import app.hitl.tools   # ensures HITL tools are registered
from app.tools.registry import get_tool_registry


def create_tool_node() -> ToolNode:
    """Create a ToolNode pre-populated with all registered tools."""
    return ToolNode(get_tool_registry().get_all_tools())


tool_node = create_tool_node()
