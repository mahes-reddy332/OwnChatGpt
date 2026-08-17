import logging
from typing import Any
from langchain_core.tools import BaseTool
from app.tools.executor import classify_tool

logger = logging.getLogger("app.tools.registry")


class ToolRegistry:
    """
    Centralized registry for managing and discovering agent tools.
    Supports dynamic registration of both Normal Python tools and MCP tools.
    """

    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> BaseTool:
        """Register a tool instance."""
        if tool.name in self._tools:
            logger.warning(f"Overwriting existing tool registration: {tool.name}")
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
        return tool

    def get_tool(self, name: str) -> BaseTool | None:
        """Retrieve a tool by name."""
        return self._tools.get(name)

    def get_all_tools(self) -> list[BaseTool]:
        """Return a list of all registered tools."""
        return list(self._tools.values())

    def get_tool_schemas(self) -> list[dict[str, Any]]:
        """
        Export metadata, classification, and parameter schemas for all registered tools.
        """
        schemas: list[dict[str, Any]] = []
        for name, tool in self._tools.items():
            args_schema = {}
            if tool.args_schema:
                try:
                    args_schema = tool.args_schema.model_json_schema()
                except Exception:
                    args_schema = {"type": "object"}

            tool_type = classify_tool(name, tool)
            schemas.append({
                "name": name,
                "description": tool.description,
                "parameters": args_schema,
                "is_mcp": getattr(tool, "is_mcp", False),
                "tool_type": tool_type,
            })
        return schemas


# Global ToolRegistry singleton
tool_registry = ToolRegistry()


def get_tool_registry() -> ToolRegistry:
    """Get the global ToolRegistry singleton."""
    global tool_registry
    return tool_registry
