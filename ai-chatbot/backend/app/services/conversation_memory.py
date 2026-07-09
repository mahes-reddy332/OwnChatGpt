"""Conversation memory management with summarization and context window optimization."""

import logging
import time
from datetime import datetime, timedelta
from typing import Optional

from pymongo.database import Database
from app.services.llm_service import llm_router
from app.utils.logging import PerformanceMonitor

logger = logging.getLogger(__name__)


class ConversationMemory:
    """Manages conversation history with automatic summarization for sliding context window."""

    def __init__(self, db: Database):
        self.db = db
        self.conversations_col = db["conversations"]
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create necessary indexes for efficient queries."""
        self.conversations_col.create_index("conversation_id", unique=True)
        self.conversations_col.create_index("user_id")
        self.conversations_col.create_index("created_at")
        self.conversations_col.create_index("last_message_at")

    def create_conversation(self, user_id: str, title: Optional[str] = None) -> str:
        """Create a new conversation and return conversation_id."""
        import uuid
        conversation_id = str(uuid.uuid4())
        now = datetime.utcnow()

        doc = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "title": title or f"Chat {now.strftime('%b %d, %H:%M')}",
            "messages": [],
            "summary": None,
            "summary_updated_at": None,
            "short_term_memory": [],  # Last 5-10 messages
            "created_at": now,
            "last_message_at": now,
            "message_count": 0,
            "tokens_used": 0,
        }
        self.conversations_col.insert_one(doc)
        logger.info(f"Created conversation {conversation_id} for user {user_id}")
        return conversation_id

    def add_message(self, conversation_id: str, role: str, content: str,
                    tool_used: Optional[str] = None, sources: Optional[list] = None) -> None:
        """Add a message to conversation history."""
        start_time = time.time()
        estimated_tokens = llm_router.estimate_tokens(content)

        message = {
            "role": role,
            "content": content,
            "tool_used": tool_used,
            "sources": sources or [],
            "timestamp": datetime.utcnow(),
            "tokens": estimated_tokens,
        }

        conv = self.conversations_col.find_one({"conversation_id": conversation_id})
        if not conv:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Append message
        self.conversations_col.update_one(
            {"conversation_id": conversation_id},
            {
                "$push": {"messages": message},
                "$inc": {"message_count": 1, "tokens_used": estimated_tokens},
                "$set": {"last_message_at": datetime.utcnow()},
            },
        )

        # Auto-summarize if message count exceeds threshold
        if conv["message_count"] > 20 and not conv.get("summary"):
            self._summarize_conversation(conversation_id)

        elapsed = time.time() - start_time
        logger.debug(f"Added message to {conversation_id} in {elapsed:.2f}s")

    def get_conversation(self, conversation_id: str) -> Optional[dict]:
        """Get full conversation with context optimization."""
        conv = self.conversations_col.find_one({"conversation_id": conversation_id})
        if not conv:
            return None

        # Build context: summary (if exists) + recent messages
        context_window = []

        if conv.get("summary"):
            context_window.append({
                "role": "system",
                "content": f"Previous conversation summary:\n{conv['summary']}",
                "type": "summary",
            })

        # Add last 10 messages (or all if fewer)
        messages = conv.get("messages", [])
        recent_messages = messages[-10:] if len(messages) > 10 else messages

        for msg in recent_messages:
            context_window.append({
                "role": msg["role"],
                "content": msg["content"],
                "tool_used": msg.get("tool_used"),
                "sources": msg.get("sources", []),
            })

        conv["context_window"] = context_window
        return conv

    def get_recent_messages(self, conversation_id: str, limit: int = 10) -> list[dict]:
        """Get recent messages from conversation."""
        conv = self.conversations_col.find_one(
            {"conversation_id": conversation_id},
            {"messages": {"$slice": -limit}}
        )
        return conv.get("messages", []) if conv else []

    def list_conversations(self, user_id: str, limit: int = 20) -> list[dict]:
        """List user's conversations, sorted by most recent."""
        convs = list(
            self.conversations_col.find(
                {"user_id": user_id},
                {"messages": 0}  # Exclude messages for faster query
            )
            .sort("last_message_at", -1)
            .limit(limit)
        )
        for conv in convs:
            conv.pop("_id", None)
        return convs

    def _summarize_conversation(self, conversation_id: str) -> None:
        """Summarize conversation for long-term memory."""
        start_time = time.time()
        conv = self.conversations_col.find_one({"conversation_id": conversation_id})
        if not conv or len(conv.get("messages", [])) < 20:
            return

        # Build summarization prompt
        messages_text = "\n".join(
            [f"{msg['role'].upper()}: {msg['content'][:200]}..." 
             for msg in conv["messages"][-20:]]
        )

        summary_prompt = f"""Summarize this conversation in 2-3 sentences, focusing on key topics and decisions:

{messages_text}

Summary:"""

        try:
            result = llm_router.chat(
                [{"role": "user", "content": summary_prompt}],
                temperature=0.3,
                max_tokens=150,
            )
            summary = result.get("response", "").strip()

            self.conversations_col.update_one(
                {"conversation_id": conversation_id},
                {
                    "$set": {
                        "summary": summary,
                        "summary_updated_at": datetime.utcnow(),
                    }
                },
            )

            elapsed = time.time() - start_time
            PerformanceMonitor.log_llm_call("summarization", result.get("model"), result.get("usage", {}), elapsed)
            logger.info(f"Summarized conversation {conversation_id} in {elapsed:.2f}s")
        except Exception as e:
            logger.warning(f"Failed to summarize conversation: {e}")

    def delete_conversation(self, conversation_id: str) -> None:
        """Delete a conversation."""
        result = self.conversations_col.delete_one({"conversation_id": conversation_id})
        if result.deleted_count > 0:
            logger.info(f"Deleted conversation {conversation_id}")
        else:
            logger.warning(f"Conversation {conversation_id} not found")

    def cleanup_old_conversations(self, days: int = 30) -> int:
        """Delete conversations older than specified days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = self.conversations_col.delete_many({"last_message_at": {"$lt": cutoff}})
        logger.info(f"Cleaned up {result.deleted_count} conversations older than {days} days")
        return result.deleted_count


def get_conversation_memory(db: Database) -> ConversationMemory:
    """Get or create conversation memory manager (singleton pattern)."""
    if not hasattr(get_conversation_memory, "_instance"):
        get_conversation_memory._instance = ConversationMemory(db)
    return get_conversation_memory._instance
