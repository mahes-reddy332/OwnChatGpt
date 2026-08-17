from typing import Any, Literal
from pydantic import BaseModel, Field


class HitlInterruptData(BaseModel):
    """Payload provided to human user when execution is interrupted."""
    interrupt_id: str = Field(..., description="Unique ID for this interrupt event.")
    tool_name: str = Field(..., description="The sensitive tool requesting approval.")
    action: str = Field(..., description="Human-readable title of the sensitive action.")
    description: str = Field(..., description="Detailed explanation of what this tool will do.")
    args: dict[str, Any] = Field(default_factory=dict, description="Arguments prepared for tool execution.")


class HitlResumeRequest(BaseModel):
    """Request payload from frontend to resume interrupted graph execution."""
    thread_id: str = Field(..., description="The active conversation thread ID.")
    decision: Literal["approve", "reject"] = Field(..., description="Human decision: 'approve' or 'reject'.")
    modified_args: dict[str, Any] | None = Field(default=None, description="Optional updated arguments if edited by user.")
