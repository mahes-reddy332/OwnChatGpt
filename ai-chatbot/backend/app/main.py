"""
AI Chatbot Backend — FastAPI Application Entry Point

Production-ready AI chatbot with RAG, vector database, and agent capabilities.

Run with: uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import ping_database
from app.routes import chat, files, settings as settings_router, system
from app.utils.logging import setup_logging

# ---- Logging Setup ----
setup_logging()
logger = logging.getLogger(__name__)

# ---- Rate Limiter ----
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting AI Chatbot API — provider: {settings.llm_provider}")
    logger.info("MongoDB connected: %s", ping_database())
    yield
    logger.info("Shutting down AI Chatbot API")


# ---- App ----
app = FastAPI(
    title="AI Chatbot API",
    description="Production-ready AI chatbot with multi-provider LLM support",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("%s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response


# ---- Global error handler ----
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


# ---- Routes ----
app.include_router(chat.router, tags=["Chat"])
app.include_router(files.router, tags=["Files"])
app.include_router(settings_router.router, tags=["Settings"])
app.include_router(system.router, tags=["System"])


@app.get("/")
async def root():
    return {
        "name": "AI Chatbot API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
