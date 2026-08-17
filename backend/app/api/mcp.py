from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.mcp.config import MCPServerConfig
from app.mcp.manager import get_mcp_manager

router = APIRouter(prefix="/mcp", tags=["mcp"])


class ServerStatusResponse(BaseModel):
    """Status details for an MCP server."""
    id: str
    name: str
    transport: str
    command: str | None = None
    args: list[str] = Field(default_factory=list)
    url: str | None = None
    enabled: bool = True
    status: str = "disconnected"
    tools_count: int = 0
    error: str | None = None


@router.get("/servers", response_model=list[ServerStatusResponse])
async def list_mcp_servers():
    """
    List all configured MCP servers along with their live connection statuses and tool counts.
    """
    manager = get_mcp_manager()
    servers = await manager.list_servers()
    return [ServerStatusResponse(**s) for s in servers]


@router.post("/servers", response_model=ServerStatusResponse)
async def add_or_update_server(config: MCPServerConfig):
    """
    Add or update an MCP server configuration and trigger tool discovery.
    """
    manager = get_mcp_manager()
    await manager.add_or_update_server(config)
    servers = await manager.list_servers()
    match = next((s for s in servers if s["id"] == config.id), None)
    if not match:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated server info.")
    return ServerStatusResponse(**match)


@router.delete("/servers/{server_id}")
async def delete_mcp_server(server_id: str):
    """
    Remove an MCP server configuration.
    """
    manager = get_mcp_manager()
    deleted = await manager.remove_server(server_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"MCP server '{server_id}' not found.")
    return {"success": True, "server_id": server_id}


@router.post("/reload")
async def reload_mcp_servers():
    """
    Reconnect to all enabled MCP servers and refresh discovered tools.
    """
    manager = get_mcp_manager()
    tools = await manager.reload()
    return {"success": True, "tools_discovered": len(tools)}
