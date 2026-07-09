"""Conversation manager backed by MongoDB."""

import logging
import uuid
from datetime import datetime, timezone

from app.database import get_db

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert AI coding assistant. You help users debug code, \
explain concepts, write new code, and answer programming questions.
When a user shares code, you:
- Detect and explain any errors (syntax, logical, runtime).
- Suggest clear fixes with explanations.
- Provide corrected code in markdown code blocks.
- If the code is correct, explain how it works.
Be conversational, concise, and well-formatted using Markdown."""


class ConversationManager:
    def __init__(self):
        self._collection = get_db()["conversations"]

    def create_conversation(self, model: str | None = None, provider: str | None = None) -> str:
        conversation_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        self._collection.insert_one(
            {
                "_id": conversation_id,
                "model": model,
                "provider": provider,
                "messages": [{"role": "system", "content": SYSTEM_PROMPT, "created_at": now}],
                "created_at": now,
                "updated_at": now,
            }
        )
        return conversation_id

    def get_or_create(self, conversation_id: str | None, model: str | None = None, provider: str | None = None) -> str:
        if conversation_id and self._collection.find_one({"_id": conversation_id}, {"_id": 1}):
            return conversation_id
        return self.create_conversation(model=model, provider=provider)

    def add_message(self, conversation_id: str, role: str, content: str, files: list[dict] | None = None):
        result = self._collection.update_one(
            {"_id": conversation_id},
            {
                "$push": {
                    "messages": {
                        "role": role,
                        "content": content,
                        "files": files or [],
                        "created_at": datetime.now(timezone.utc),
                    }
                },
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )
        if result.matched_count == 0:
            raise KeyError(f"Conversation {conversation_id} not found")

    def get_messages(self, conversation_id: str) -> list[dict]:
        conversation = self._collection.find_one({"_id": conversation_id}, {"messages": 1})
        if not conversation:
            raise KeyError(f"Conversation {conversation_id} not found")
        return conversation.get("messages", [])

    @property
    def total_conversations(self) -> int:
        return self._collection.count_documents({})

    @property
    def total_messages(self) -> int:
        pipeline = [
            {"$project": {"count": {"$size": "$messages"}}},
            {"$group": {"_id": None, "total": {"$sum": "$count"}}},
        ]
        result = list(self._collection.aggregate(pipeline))
        return result[0]["total"] if result else 0

    @property
    def total_uploads(self) -> int:
        return get_db()["uploads"].count_documents({})


conversation_manager = ConversationManager()
