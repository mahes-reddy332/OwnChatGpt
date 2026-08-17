import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """User account model."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Session(Base):
    """User session model with SHA-256 hashed opaque tokens."""
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)

    user = relationship("User", back_populates="sessions")


class UserPreferences(Base):
    """User AI response personalization and appearance settings."""
    __tablename__ = "user_preferences"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    response_style = Column(String(50), default="balanced", nullable=False)  # 'concise', 'balanced', 'detailed'
    custom_instructions = Column(Text, default="", nullable=False)
    theme = Column(String(20), default="dark", nullable=False)  # 'dark', 'light', 'system'
    show_citations = Column(Boolean, default=True, nullable=False)
    show_tool_activity = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="preferences")
