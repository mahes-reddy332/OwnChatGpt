import os
import sys
import logging
from pathlib import Path
from typing import Any
from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient
from app.mcp.config import MCPServerConfig

logger = logging.getLogger("app.mcp.client")


class MCPClientManager:
    """Manages connections to multiple MCP servers and discovers tools."""

    def __init__(self, configs: list[MCPServerConfig]):
        self.configs = configs
        self.server_statuses: dict[str, dict[str, Any]] = {}
        self._clients: dict[str, MultiServerMCPClient] = {}

    def _build_single_client_dict(self, cfg: MCPServerConfig) -> dict[str, Any] | None:
        """Construct server dict for an individual server."""
        if cfg.transport == "stdio":
            if not cfg.command:
                return None
            cmd = cfg.command
            if cmd in ("python", "python3", "py") or not os.path.exists(cmd):
                cmd = sys.executable

            args = []
            for arg in cfg.args:
                # Resolve script paths relative to workspace if needed
                if arg.endswith(".py") and not os.path.isabs(arg):
                    resolved = (Path(__file__).resolve().parent.parent.parent / arg).resolve()
                    if resolved.exists():
                        args.append(str(resolved))
                    else:
                        args.append(arg)
                else:
                    args.append(arg)

            env = {**os.environ, **cfg.env}
            return {
                "transport": "stdio",
                "command": cmd,
                "args": args,
                "env": env,
            }
        elif cfg.transport in ("sse", "streamable_http"):
            if not cfg.url:
                return None
            return {
                "transport": cfg.transport,
                "url": cfg.url,
            }
        return None

    async def load_tools(self) -> list[BaseTool]:
        """
        Connect to enabled MCP servers and discover available tools with error isolation.
        
        Returns:
            list[BaseTool]: Discovered tools converted to LangChain BaseTool instances.
        """
        discovered_tools: list[BaseTool] = []

        for cfg in self.configs:
            if not cfg.enabled:
                self.server_statuses[cfg.id] = {
                    "id": cfg.id,
                    "name": cfg.name,
                    "status": "disabled",
                    "tools_count": 0,
                    "transport": cfg.transport,
                }
                continue

            server_dict = self._build_single_client_dict(cfg)
            if not server_dict:
                self.server_statuses[cfg.id] = {
                    "id": cfg.id,
                    "name": cfg.name,
                    "status": "error",
                    "error": "Missing command or URL configuration",
                    "tools_count": 0,
                    "transport": cfg.transport,
                }
                continue

            try:
                client = MultiServerMCPClient({cfg.id: server_dict})
                server_tools = await client.get_tools()

                for tool in server_tools:
                    discovered_tools.append(tool)

                self._clients[cfg.id] = client
                self.server_statuses[cfg.id] = {
                    "id": cfg.id,
                    "name": cfg.name,
                    "status": "connected",
                    "tools_count": len(server_tools),
                    "transport": cfg.transport,
                }
                logger.info(f"Connected MCP server '{cfg.name}' ({len(server_tools)} tools).")

            except Exception as e:
                logger.warning(f"Error connecting to MCP server '{cfg.name}': {e}")
                self.server_statuses[cfg.id] = {
                    "id": cfg.id,
                    "name": cfg.name,
                    "status": "error",
                    "error": str(e),
                    "tools_count": 0,
                    "transport": cfg.transport,
                }

        logger.info(f"Total discovered MCP tools: {len(discovered_tools)}.")
        return discovered_tools
