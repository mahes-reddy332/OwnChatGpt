"""add_connectors_tables

Revision ID: 002_add_connectors
Revises: 001_initial_auth
Create Date: 2026-08-18 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_add_connectors'
down_revision: Union[str, Sequence[str], None] = '001_initial_auth'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Connectors table
    op.create_table(
        'connectors',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, server_default='custom_mcp'),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='custom'),
        sa.Column('endpoint', sa.String(length=500), nullable=True),
        sa.Column('transport', sa.String(length=50), nullable=False, server_default='streamable_http'),
        sa.Column('auth_type', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='not_configured'),
        sa.Column('status_message', sa.Text(), nullable=True),
        sa.Column('is_builtin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_connectors_user_id'), 'connectors', ['user_id'], unique=False)

    # Connector Credentials table
    op.create_table(
        'connector_credentials',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('connector_id', sa.String(length=36), nullable=False),
        sa.Column('encrypted_data', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['connector_id'], ['connectors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_connector_credentials_connector_id'), 'connector_credentials', ['connector_id'], unique=True)

    # MCP Capabilities table
    op.create_table(
        'mcp_capabilities',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('connector_id', sa.String(length=36), nullable=False),
        sa.Column('capability_type', sa.String(length=20), nullable=False, server_default='tool'),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('unique_identifier', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parameters_schema', sa.JSON(), nullable=True),
        sa.Column('risk_level', sa.String(length=20), nullable=False, server_default='low'),
        sa.Column('is_mandatory_hitl', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('requires_hitl', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['connector_id'], ['connectors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mcp_capabilities_connector_id'), 'mcp_capabilities', ['connector_id'], unique=False)
    op.create_index(op.f('ix_mcp_capabilities_unique_identifier'), 'mcp_capabilities', ['unique_identifier'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_mcp_capabilities_unique_identifier'), table_name='mcp_capabilities')
    op.drop_index(op.f('ix_mcp_capabilities_connector_id'), table_name='mcp_capabilities')
    op.drop_table('mcp_capabilities')
    op.drop_index(op.f('ix_connector_credentials_connector_id'), table_name='connector_credentials')
    op.drop_table('connector_credentials')
    op.drop_index(op.f('ix_connectors_user_id'), table_name='connectors')
    op.drop_table('connectors')
