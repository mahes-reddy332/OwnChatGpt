from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import get_settings

settings = get_settings()


def get_normalized_database_url(raw_url: str) -> str:
    """
    Ensure the database URL uses the asyncpg driver for PostgreSQL or aiosqlite for SQLite.
    Cloud providers like Render/Heroku inject 'postgresql://' or 'postgres://', which must
    be mapped to 'postgresql+asyncpg://' for SQLAlchemy AsyncIO.
    """
    if not raw_url:
        return "sqlite+aiosqlite:///./data/nexus_ai.db"
    
    url = raw_url.strip()
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite://") and not url.startswith("sqlite+"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


db_url = get_normalized_database_url(settings.DATABASE_URL)

# Ensure local data directory exists for SQLite
if "sqlite" in db_url:
    db_path = Path(__file__).resolve().parent.parent.parent / "data"
    db_path.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
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
