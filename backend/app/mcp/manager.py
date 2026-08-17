import logging
from typing import Any
from langchain_core.tools import BaseTool
from app.mcp.config import (
    MCPServerConfig,
    load_mcp_configs,
    save_mcp_configs,
)
from app.mcp.client import MCPClientManager
from app.tools.registry import get_tool_registry

logger = logging.getLogger("app.mcp.manager")


class MCPManager:
    """Central manager coordinating MCP server configs, connection lifecycle, and registry sync."""

    def __init__(self):
        self.configs: list[MCPServerConfig] = load_mcp_configs()
        self.client_manager: MCPClientManager | None = None
        self._mcp_tool_names: set[str] = set()

    async def initialize(self) -> list[BaseTool]:
        """Initialize MCP connections and register tools in ToolRegistry."""
        self.configs = load_mcp_configs()
        self.client_manager = MCPClientManager(self.configs)

        tools = await self.client_manager.load_tools()
        registry = get_tool_registry()

        # Unregister previously registered MCP tools to avoid stale tools
        for old_name in self._mcp_tool_names:
            if old_name in registry._tools:
                del registry._tools[old_name]
        self._mcp_tool_names.clear()

        # Register discovered tools
        for tool in tools:
            registry.register(tool)
            self._mcp_tool_names.add(tool.name)

        return tools

    async def list_servers(self) -> list[dict[str, Any]]:
        """Return all configured MCP servers and their active connection states."""
        self.configs = load_mcp_configs()
        statuses = self.client_manager.server_statuses if self.client_manager else {}

        result = []
        for cfg in self.configs:
            server_info = cfg.model_dump()
            live_status = statuses.get(cfg.id, {})
            server_info["status"] = live_status.get(
                "status", "enabled" if cfg.enabled else "disabled"
            )
            server_info["tools_count"] = live_status.get("tools_count", 0)
            server_info["error"] = live_status.get("error")
            result.append(server_info)

        return result

    async def add_or_update_server(self, config: MCPServerConfig) -> None:
        """Add or update an MCP server configuration and reload connections."""
        self.configs = [c for c in self.configs if c.id != config.id]
        self.configs.append(config)
        save_mcp_configs(self.configs)
        await self.initialize()

    async def remove_server(self, server_id: str) -> bool:
        """Remove an MCP server configuration."""
        initial_len = len(self.configs)
        self.configs = [c for c in self.configs if c.id != server_id]
        if len(self.configs) < initial_len:
            save_mcp_configs(self.configs)
            await self.initialize()
            return True
        return False

    async def reload(self) -> list[BaseTool]:
        """Force reconnect to all enabled MCP servers."""
        return await self.initialize()


# Global MCPManager singleton
_mcp_manager = MCPManager()


def get_mcp_manager() -> MCPManager:
    """Get the global MCPManager singleton."""
    global _mcp_manager
    return _mcp_manager
