from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field


class MemoryItem(BaseModel):
    """An atomic unit of user memory extracted from a conversation."""
    text: str = Field(description="Short, atomic factual statement about the user, their preferences, or ongoing projects.")
    is_new: bool = Field(default=True, description="True if this adds new information compared to existing user memories; False if duplicate.")
    category: Literal["profile", "preference", "project", "fact"] = Field(default="fact", description="Category classification of the memory.")


class MemoryDecision(BaseModel):
    """Decision made by the memory extraction LLM."""
    should_write: bool = Field(description="True if there is new information worth remembering long-term; False otherwise.")
    memories: list[MemoryItem] = Field(default_factory=list, description="List of atomic memory items extracted from the message.")


class MemoryEntry(BaseModel):
    """Public representation of a stored long-term memory."""
    id: str
    text: str
    user_id: str = "default_user"
    category: str = "fact"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MemoryCreateRequest(BaseModel):
    """Request payload to manually add a memory."""
    text: str = Field(..., min_length=2, max_length=500, description="The memory text to store.")
    user_id: str = Field("default_user", description="Target user identifier.")
    category: str = Field("fact", description="Optional memory category.")
