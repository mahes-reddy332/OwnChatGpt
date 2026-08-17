import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    # LLM Provider Configuration ('groq', 'huggingface', or 'openai')
    LLM_PROVIDER: str = "groq"
    
    # Groq Settings (Fast & Free)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    
    # Hugging Face Settings
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_BASE_URL: str = "https://router.huggingface.co/together/v1"
    HUGGINGFACE_MODEL: str = "Qwen/Qwen2.5-7B-Instruct-Turbo"
    
    # OpenAI Settings (Fallback / Alternative)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"
    
    # Database Configuration (SQLite dev / PostgreSQL prod)
    # Dev: sqlite+aiosqlite:///./data/nexus_ai.db
    # Prod: postgresql+asyncpg://user:pass@host:5432/nexus_ai
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/nexus_ai.db"
    
    # Authentication & Session Policy
    AUTH_IDLE_TIMEOUT_MINUTES: int = 30
    AUTH_IDLE_WARNING_MINUTES: int = 5
    AUTH_SESSION_MAX_DAYS: int = 7
    AUTH_COOKIE_SECURE: bool = False
    AUTH_COOKIE_SAMESITE: str = "lax"
    AUTH_SECRET_KEY: str = "nexus_ai_secure_dev_secret_key_change_in_prod"
    
    # GitHub Integration
    GITHUB_PERSONAL_ACCESS_TOKEN: str = ""
    
    # LangSmith / LangChain Tracing Observability
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "agentic-rag-chatbot"
    LANGCHAIN_ENDPOINT: str = "https://api.smith.langchain.com"
    
    # Aliases for backward compatibility
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_TRACING: bool = False
    LANGSMITH_PROJECT: str = "agentic-rag-chatbot"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
