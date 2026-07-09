"""Health, models, and status API routes."""

import time
import logging
from fastapi import APIRouter

from app.database import ping_database
from app.models.schemas import HealthResponse, ModelsResponse, ModelInfo, StatusResponse
from app.services.conversation import conversation_manager
from app.services.llm_service import llm_router
from app.services.settings_service import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse, include_in_schema=False)
async def health():
    """Server health check — verifies LLM API connectivity."""
    connected = llm_router.health_check()
    mongo_connected = ping_database()
    return HealthResponse(
        status="healthy" if connected and mongo_connected else "degraded",
        provider=llm_router.provider_name,
        api_connected=connected,
        mongodb_connected=mongo_connected,
    )


@router.get("/models", response_model=ModelsResponse)
@router.get("/api/models", response_model=ModelsResponse, include_in_schema=False)
async def list_models():
    """List available LLM models for the current provider."""
    raw_models = llm_router.list_models()
    models = [
        ModelInfo(
            id=m["id"],
            name=m["name"],
            provider=llm_router.provider_name,
            max_tokens=m["max_tokens"],
        )
        for m in raw_models
    ]
    return ModelsResponse(models=models, current_provider=llm_router.provider_name)


@router.get("/status", response_model=StatusResponse)
@router.get("/api/status", response_model=StatusResponse, include_in_schema=False)
async def status():
    """API usage and server status information."""
    app_settings = get_settings()
    return StatusResponse(
        provider=llm_router.provider_name,
        model=app_settings["default_model"],
        total_conversations=conversation_manager.total_conversations,
        total_messages=conversation_manager.total_messages,
        total_uploads=conversation_manager.total_uploads,
        uptime_seconds=round(time.time() - _start_time, 2),
    )
