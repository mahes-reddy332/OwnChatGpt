import pytest
from fastapi.testclient import TestClient
from app.mcp.config import MCPServerConfig, load_mcp_configs, save_mcp_configs
from app.mcp.manager import get_mcp_manager


def test_mcp_config_serialization():
    """Test loading and saving MCP server configuration objects."""
    sample_server = MCPServerConfig(
        id="test_server",
        name="Test MCP Server",
        transport="sse",
        url="https://example.com/sse",
        enabled=True,
    )
    assert sample_server.id == "test_server"
    assert sample_server.transport == "sse"
    dict_repr = sample_server.model_dump()
    assert dict_repr["name"] == "Test MCP Server"


def test_list_mcp_servers_endpoint(client: TestClient):
    """Test GET /api/mcp/servers endpoint returns configured servers."""
    res = client.get("/api/mcp/servers")
    assert res.status_code == 200
    servers = res.json()
    assert isinstance(servers, list)
    assert len(servers) >= 1
    assert any("id" in s for s in servers)


def test_add_and_delete_mcp_server_endpoints(client: TestClient):
    """Test adding a new MCP server and deleting it."""
    payload = {
        "id": "mock_custom_server",
        "name": "Mock Custom Server",
        "transport": "sse",
        "url": "https://mcp.mock.app/sse",
        "enabled": False,
    }

    # 1. Add server
    add_res = client.post("/api/mcp/servers", json=payload)
    assert add_res.status_code == 200
    assert add_res.json()["id"] == "mock_custom_server"

    # 2. Verify in list
    list_res = client.get("/api/mcp/servers")
    assert any(s["id"] == "mock_custom_server" for s in list_res.json())

    # 3. Delete server
    del_res = client.delete("/api/mcp/servers/mock_custom_server")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_mcp_reload_endpoint(client: TestClient):
    """Test POST /api/mcp/reload endpoint."""
    res = client.post("/api/mcp/reload")
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "tools_discovered" in res.json()
