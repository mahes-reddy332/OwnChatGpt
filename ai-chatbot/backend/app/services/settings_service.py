"""Runtime application settings persisted in MongoDB."""

from datetime import datetime, timezone

from app.config import settings
from app.database import get_db

SETTINGS_ID = "application"


def _collection():
    return get_db()["app_settings"]


def get_settings() -> dict:
    document = _collection().find_one({"_id": SETTINGS_ID}) or {}
    return {
        "provider": settings.llm_provider,
        "default_model": document.get("default_model") or settings.default_model,
        "default_temperature": document.get("default_temperature", 0.7),
        "frontend_url": settings.frontend_url,
        "mongodb_connected": True,
    }


def update_settings(default_model: str | None = None, default_temperature: float | None = None) -> dict:
    update: dict = {"updated_at": datetime.now(timezone.utc)}
    if default_model is not None:
        update["default_model"] = default_model
    if default_temperature is not None:
        update["default_temperature"] = default_temperature

    _collection().update_one(
        {"_id": SETTINGS_ID},
        {"$set": update, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return get_settings()
