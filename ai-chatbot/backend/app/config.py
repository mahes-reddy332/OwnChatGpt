"""Application configuration loaded from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import Field


ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    # LLM Provider: groq | gemini | openai | claude
    llm_provider: str = Field(default="gemini")

    # API Keys
    gemini_api_key: str = Field(default="")
    openai_api_key: str = Field(default="")
    claude_api_key: str = Field(default="")
    groq_api_key: str = Field(default="")

    # Server
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    debug: bool = Field(default=False)

    # Database
    mongodb_uri: str = Field(default="mongodb://127.0.0.1:27017")
    mongodb_db_name: str = Field(default="ai_chatbot")

    # CORS
    frontend_url: str = Field(default="http://localhost:3000")

    # Defaults
    default_model: str = Field(default="gemini-2.0-flash")

    # Rate Limiting
    rate_limit: str = Field(default="60/minute")

    # Logging
    log_level: str = Field(default="INFO")

    model_config = {"env_file": str(ENV_FILE), "env_file_encoding": "utf-8"}


settings = Settings()
