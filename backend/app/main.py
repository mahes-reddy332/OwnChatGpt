from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# Ensure all database models are imported before any database operation
import app.auth.models  # noqa: F401
import app.connectors.models  # noqa: F401

settings = get_settings()
logger = setup_logging(settings.LOG_LEVEL)


def get_cors_origins() -> list[str]:
    """Build CORS origins list combining defaults and configured origins."""
    origins = [
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nexus-nine-flax-34.vercel.app",
    ]
    if settings.CORS_ALLOWED_ORIGINS:
        for orig in settings.CORS_ALLOWED_ORIGINS.split(","):
            cleaned = orig.strip()
            if cleaned and cleaned not in origins:
                origins.append(cleaned)
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info(f"Starting Nexus AI Workspace Backend [{settings.ENVIRONMENT}]...")
    
    # 1. Initialize Database Schema
    try:
        await init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}", exc_info=True)

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
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler ensuring CORS headers are always attached with diagnostic detail
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    allowed = get_cors_origins()
    headers = {}
    if origin and (origin in allowed or "*" in allowed):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers=headers,
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
