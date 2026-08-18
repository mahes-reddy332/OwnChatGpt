from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import get_settings

settings = get_settings()

# Ensure local data directory exists for SQLite
if "sqlite" in settings.DATABASE_URL:
    db_path = Path(__file__).resolve().parent.parent.parent / "data"
    db_path.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables with all registered SQLAlchemy models."""
    # Explicitly import all models to populate Base.metadata
    from app.auth.models import User, Session, UserPreferences  # noqa: F401
    from app.connectors.models import Connector, ConnectorCredential, MCPCapability  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
