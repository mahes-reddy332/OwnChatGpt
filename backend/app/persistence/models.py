from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field


class ThreadMetadata(BaseModel):
    """Metadata associated with a conversation thread."""
    user_id: str | None = None
    tags: list[str] = Field(default_factory=list)
    custom: dict[str, Any] = Field(default_factory=dict)


class Thread(BaseModel):
    """Representation of a conversation thread."""
    id: str
    title: str = "New Conversation"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: ThreadMetadata = Field(default_factory=ThreadMetadata)


class ThreadCreateRequest(BaseModel):
    """Payload to create a new thread."""
    title: str | None = Field(None, max_length=100)


class ThreadUpdateRequest(BaseModel):
    """Payload to update an existing thread's title."""
    title: str = Field(..., min_length=1, max_length=100)


class ChatMessageItem(BaseModel):
    """A restored chat message from thread checkpoint state."""
    id: str
    role: str
    content: str
    timestamp: str | None = None


class ThreadResponse(BaseModel):
    """Response model for a thread summary."""
    id: str
    title: str
    created_at: str
    updated_at: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ThreadDetailResponse(BaseModel):
    """Response model for a thread including its message history."""
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: list[ChatMessageItem] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
