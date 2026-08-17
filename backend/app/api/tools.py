from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.tools.registry import get_tool_registry
import app.tools.builtin  # ensures tools are registered
import app.hitl.tools   # ensures HITL tools are registered

router = APIRouter(prefix="/tools", tags=["tools"])


class ToolSchemaResponse(BaseModel):
    """Schema metadata for a registered tool."""
    name: str
    description: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    is_mcp: bool = False
    tool_type: str = "builtin"


@router.get("", response_model=list[ToolSchemaResponse])
async def list_tools():
    """
    List all active tools registered in the agent registry.
    """
    registry = get_tool_registry()
    schemas = registry.get_tool_schemas()
    return [ToolSchemaResponse(**s) for s in schemas]
