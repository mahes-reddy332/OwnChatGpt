from typing import Any
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 characters)")
    display_name: str = Field(..., min_length=1, max_length=100, description="Visible display name")
    avatar_url: str | None = None


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="Password")


class UserProfileResponse(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: str | None = None
    is_active: bool
    created_at: str
    last_login_at: str | None = None


class ProfileUpdateRequest(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=100)
    avatar_url: str | None = None


class UserPreferencesResponse(BaseModel):
    response_style: str = "balanced"
    custom_instructions: str = ""
    theme: str = "dark"
    show_citations: bool = True
    show_tool_activity: bool = True


class UserPreferencesUpdateRequest(BaseModel):
    response_style: str | None = None
    custom_instructions: str | None = None
    theme: str | None = None
    show_citations: bool | None = None
    show_tool_activity: bool | None = None


class SessionResponse(BaseModel):
    id: str
    created_at: str
    last_activity_at: str
    expires_at: str
    is_current: bool = False
    user_agent: str | None = None
    ip_address: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class GenericMessageResponse(BaseModel):
    message: str
    detail: str | None = None
