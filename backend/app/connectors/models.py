import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


def utc_now():
    """Return timezone-naive UTC datetime for seamless asyncpg / SQLite TIMESTAMP compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Connector(Base):
    """
    Represents an external service connection or custom remote MCP server.
    Can be system-level (built-in, user_id=None) or user-specific.
    """
    __tablename__ = "connectors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False, default="custom_mcp")  # builtin_mcp, custom_mcp, custom_api
    provider = Column(String(50), nullable=False, default="custom")  # github, google_workspace, custom, slack, notion
    endpoint = Column(String(500), nullable=True)  # URL or stdio path
    transport = Column(String(50), nullable=False, default="streamable_http")  # streamable_http, sse, stdio
    auth_type = Column(String(50), nullable=False, default="none")  # none, bearer, api_key
    status = Column(String(50), nullable=False, default="not_configured")  # connected, not_configured, connecting, error, disabled
    status_message = Column(Text, nullable=True)
    is_builtin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    credentials = relationship("ConnectorCredential", back_populates="connector", cascade="all, delete-orphan", uselist=False)
    capabilities = relationship("MCPCapability", back_populates="connector", cascade="all, delete-orphan")


class ConnectorCredential(Base):
    """
    Secure storage for connector authentication secrets.
    Stores AES-256-GCM encrypted payload with key versioning.
    """
    __tablename__ = "connector_credentials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id = Column(String(36), ForeignKey("connectors.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    encrypted_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    connector = relationship("Connector", back_populates="credentials")


class MCPCapability(Base):
    """
    Discovered tools, resources, and prompt templates exposed by an MCP connector.
    """
    __tablename__ = "mcp_capabilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id = Column(String(36), ForeignKey("connectors.id", ondelete="CASCADE"), nullable=False, index=True)
    capability_type = Column(String(20), nullable=False, default="tool")  # tool, resource, prompt
    name = Column(String(100), nullable=False)
    unique_identifier = Column(String(150), unique=True, nullable=False, index=True)  # mcp__{conn_prefix}__{name}
    description = Column(Text, nullable=True)
    parameters_schema = Column(JSON, nullable=True)
    risk_level = Column(String(20), default="low", nullable=False)  # low, high
    is_mandatory_hitl = Column(Boolean, default=False, nullable=False)  # Server-enforced rule, cannot be disabled by user
    requires_hitl = Column(Boolean, default=False, nullable=False)  # Effective HITL requirement
    is_enabled = Column(Boolean, default=False, nullable=False)  # User selection
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    connector = relationship("Connector", back_populates="capabilities")
