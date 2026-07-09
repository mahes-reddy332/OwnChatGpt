"""Settings API routes."""

import logging

from fastapi import APIRouter, HTTPException

from app.database import ping_database
from app.models.schemas import SettingsResponse, SettingsUpdateRequest
from app.services.settings_service import get_settings, update_settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/settings", response_model=SettingsResponse)
@router.get("/api/settings", response_model=SettingsResponse, include_in_schema=False)
async def fetch_settings():
    try:
        settings = get_settings()
        settings["mongodb_connected"] = ping_database()
        return SettingsResponse(**settings)
    except Exception as exc:
        logger.exception("Settings fetch failed")
        raise HTTPException(status_code=500, detail="Failed to load settings") from exc


@router.patch("/settings", response_model=SettingsResponse)
@router.patch("/api/settings", response_model=SettingsResponse, include_in_schema=False)
async def patch_settings(request: SettingsUpdateRequest):
    try:
        settings = update_settings(
            default_model=request.default_model,
            default_temperature=request.default_temperature,
        )
        settings["mongodb_connected"] = ping_database()
        return SettingsResponse(**settings)
    except Exception as exc:
        logger.exception("Settings update failed")
        raise HTTPException(status_code=500, detail="Failed to update settings") from exc
