"""Pydantic models for API request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional


class Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=50000)


class FileAttachment(BaseModel):
    upload_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(default="application/octet-stream", max_length=255)
    size: Optional[int] = Field(default=0, ge=0)
    content: str = Field(..., min_length=1, max_length=50000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=50000)
    conversation_id: Optional[str] = None
    model: Optional[str] = None
    files: list[FileAttachment] = Field(default_factory=list)
    research_mode: bool = False
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=4096, ge=1, le=32000)


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    model: str
    provider: str
    usage: dict


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    max_tokens: int


class ModelsResponse(BaseModel):
    models: list[ModelInfo]
    current_provider: str


class HealthResponse(BaseModel):
    status: str
    provider: str
    api_connected: bool
    mongodb_connected: bool


class StatusResponse(BaseModel):
    provider: str
    model: str
    total_conversations: int
    total_messages: int
    total_uploads: int
    uptime_seconds: float


class UploadFileResponse(BaseModel):
    upload_id: str
    name: str
    type: str
    size: int
    content: str
    truncated: bool


class SettingsResponse(BaseModel):
    provider: str
    default_model: str
    default_temperature: float
    frontend_url: str
    mongodb_connected: bool


class SettingsUpdateRequest(BaseModel):
    default_model: Optional[str] = Field(default=None, min_length=1, max_length=120)
    default_temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
