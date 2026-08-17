import json
import os
import sys
from pathlib import Path
from typing import Literal
from pydantic import BaseModel, Field

MCP_CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "mcp_servers.json"
SERVERS_DIR = Path(__file__).resolve().parent / "servers"


class MCPServerConfig(BaseModel):
    """Configuration for a single Model Context Protocol (MCP) server."""
    id: str
    name: str
    transport: Literal["stdio", "sse", "streamable_http"] = "stdio"
    command: str | None = None
    args: list[str] = Field(default_factory=list)
    url: str | None = None
    env: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


DEFAULT_SERVERS: list[MCPServerConfig] = [
    MCPServerConfig(
        id="google_workspace",
        name="Google Workspace MCP (Drive, Gmail, Calendar)",
        transport="stdio",
        command=sys.executable,
        args=[str(SERVERS_DIR / "google_workspace.py")],
        enabled=True,
    ),
    MCPServerConfig(
        id="github_mcp",
        name="GitHub Integration MCP (Repos, Issues, Commits)",
        transport="stdio",
        command=sys.executable,
        args=[str(SERVERS_DIR / "github_server.py")],
        env={"GITHUB_PERSONAL_ACCESS_TOKEN": ""},
        enabled=True,
    ),
    MCPServerConfig(
        id="expense_service",
        name="Expense & Finance Remote MCP",
        transport="streamable_http",
        url="https://splendid-gold-dingo.fastmcp.app/mcp",
        enabled=False,
    ),
]


def load_mcp_configs() -> list[MCPServerConfig]:
    """Load MCP server configurations from persistent JSON file."""
    if not MCP_CONFIG_PATH.exists():
        save_mcp_configs(DEFAULT_SERVERS)
        return DEFAULT_SERVERS

    try:
        with open(MCP_CONFIG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        configs = [MCPServerConfig(**item) for item in data]
        
        # Ensure default servers are present in existing config
        existing_ids = {c.id for c in configs}
        updated = False
        for default_s in DEFAULT_SERVERS:
            if default_s.id not in existing_ids:
                configs.append(default_s)
                updated = True
        if updated:
            save_mcp_configs(configs)
        return configs
    except Exception:
        return DEFAULT_SERVERS


def save_mcp_configs(configs: list[MCPServerConfig]) -> None:
    """Save MCP server configurations to persistent JSON file."""
    MCP_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MCP_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump([c.model_dump() for c in configs], f, indent=2)
