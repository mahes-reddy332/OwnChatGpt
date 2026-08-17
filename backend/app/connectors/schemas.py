from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class MCPCapabilityResponse(BaseModel):
    """Safe public representation of a discovered MCP tool or resource."""
    id: str
    connector_id: str
    capability_type: Literal["tool", "resource", "prompt"]
    name: str
    unique_identifier: str
    description: str | None = None
    parameters_schema: dict[str, Any] | None = None
    risk_level: Literal["low", "high"]
    is_mandatory_hitl: bool
    requires_hitl: bool
    is_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MCPCapabilityToggleRequest(BaseModel):
    """Payload to toggle capability enablement or update optional HITL requirement."""
    is_enabled: bool | None = None
    requires_hitl: bool | None = None


class ConnectorCapabilitiesSummary(BaseModel):
    """Counts of discovered vs enabled capabilities."""
    tools_total: int = 0
    tools_enabled: int = 0
    resources_total: int = 0
    resources_enabled: int = 0
    prompts_total: int = 0
    prompts_enabled: int = 0


class ConnectorResponse(BaseModel):
    """Safe public representation of a connector (secrets are never exposed)."""
    id: str
    user_id: str | None = None
    name: str
    type: str
    provider: str
    endpoint: str | None = None
    transport: str
    auth_type: str
    status: str
    status_message: str | None = None
    is_builtin: bool
    has_credentials: bool = False
    capabilities_summary: ConnectorCapabilitiesSummary = Field(default_factory=ConnectorCapabilitiesSummary)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectorDetailResponse(ConnectorResponse):
    """Connector details with complete list of discovered capabilities."""
    capabilities: list[MCPCapabilityResponse] = Field(default_factory=list)


class ConnectorCreateRequest(BaseModel):
    """Payload for registering a custom remote MCP server or integration."""
    name: str = Field(..., min_length=2, max_length=100, description="Display name for this connector")
    provider: str = Field(default="custom", max_length=50)
    endpoint: str = Field(..., max_length=500, description="Remote MCP server URL (HTTPS in production)")
    transport: Literal["streamable_http", "sse"] = Field(
        default="streamable_http",
        description="Remote transport type. Stdio is restricted to system built-in servers."
    )
    auth_type: Literal["none", "bearer", "api_key"] = Field(
        default="none",
        description="Authentication method. OAuth is disabled until full PKCE exchange is built."
    )
    secret_token: str | None = Field(default=None, description="Optional bearer token or API key header value")
    custom_headers: dict[str, str] | None = Field(default=None, description="Optional custom HTTP headers")


class ConnectorUpdateRequest(BaseModel):
    """Payload for updating an existing connector configuration."""
    name: str | None = Field(default=None, min_length=2, max_length=100)
    endpoint: str | None = Field(default=None, max_length=500)
    status: Literal["connected", "not_configured", "disabled"] | None = None
    secret_token: str | None = None
    custom_headers: dict[str, str] | None = None


class TestConnectionRequest(BaseModel):
    """Dry-run connection test payload."""
    endpoint: str = Field(..., max_length=500)
    transport: Literal["streamable_http", "sse"] = "streamable_http"
    auth_type: Literal["none", "bearer", "api_key"] = "none"
    secret_token: str | None = None
    custom_headers: dict[str, str] | None = None


class TestConnectionResponse(BaseModel):
    """Results of dry-run connection test."""
    success: bool
    status: str
    message: str
    discovered_tools_count: int = 0
    discovered_tools: list[str] = Field(default_factory=list)
