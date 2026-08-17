from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.database.session import init_db
from app.auth.router import router as auth_router
from app.api.health import router as health_router
from app.api.chat import router as chat_router
from app.api.threads import router as threads_router
from app.api.documents import router as documents_router
from app.api.tools import router as tools_router
from app.api.mcp import router as mcp_router
from app.api.memory import router as memory_router
from app.mcp.manager import get_mcp_manager
from app.observability.tracer import setup_langsmith
import app.tools.builtin  # Registers all built-in tools
import app.hitl.tools   # Registers all HITL tools

settings = get_settings()
logger = setup_logging(settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Starting Nexus AI Agentic Workspace Backend...")
    
    # 1. Initialize Database Schema
    try:
        await init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization notice: {e}")

    # 2. Initialize LangSmith Tracing
    setup_langsmith()

    # 3. Initialize MCP server connections
    try:
        mcp_manager = get_mcp_manager()
        await mcp_manager.initialize()
    except Exception as e:
        logger.warning(f"MCP initialization notice: {e}")

    yield
    logger.info("Shutting down Nexus AI Backend...")


app = FastAPI(title="Nexus AI — Agentic Assistant API", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(health_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(threads_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(tools_router, prefix="/api")
app.include_router(mcp_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
