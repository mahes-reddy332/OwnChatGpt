import uuid
import logging
from datetime import datetime, timezone
from typing import Any
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore
from app.memory.models import MemoryEntry

logger = logging.getLogger("app.memory.store")

# Global LangGraph BaseStore instance
_global_store = InMemoryStore()


def get_memory_store() -> BaseStore:
    """Get the global LangGraph store instance."""
    global _global_store
    return _global_store


class MemoryStoreManager:
    """Helper manager for manipulating user long-term memories in the BaseStore."""

    def __init__(self, store: BaseStore | None = None):
        self.store = store or get_memory_store()

    def _get_namespace(self, user_id: str) -> tuple[str, str, str]:
        return ("user", user_id, "memories")

    def put_memory(
        self,
        user_id: str,
        text: str,
        memory_id: str | None = None,
        category: str = "fact",
    ) -> MemoryEntry:
        """Store a new long-term memory for a user."""
        mem_id = memory_id or str(uuid.uuid4())
        ns = self._get_namespace(user_id)
        now_iso = datetime.now(timezone.utc).isoformat()

        value = {
            "id": mem_id,
            "text": text.strip(),
            "category": category,
            "user_id": user_id,
            "created_at": now_iso,
        }

        self.store.put(ns, mem_id, value)
        logger.info(f"Stored LTM for user '{user_id}': [{mem_id}] {text}")
        
        # Enforce max memory bound
        self.prune_excess_memories(user_id, max_entries=50)
        
        return MemoryEntry(**value)

    def update_memory(
        self,
        user_id: str,
        memory_id: str,
        text: str,
        category: str | None = None,
    ) -> MemoryEntry | None:
        """Update an existing long-term memory."""
        ns = self._get_namespace(user_id)
        memories = self.get_user_memories(user_id)
        existing = next((m for m in memories if m.id == memory_id), None)
        if not existing:
            return None

        updated_val = {
            "id": memory_id,
            "text": text.strip(),
            "category": category or existing.category,
            "user_id": user_id,
            "created_at": existing.created_at,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        self.store.put(ns, memory_id, updated_val)
        logger.info(f"Updated LTM for user '{user_id}': [{memory_id}] {text}")
        return MemoryEntry(**updated_val)

    def get_user_memories(self, user_id: str, limit: int = 1000) -> list[MemoryEntry]:
        """Retrieve all stored memories for a user."""
        ns = self._get_namespace(user_id)
        try:
            items = self.store.search(ns, limit=limit)
            results = []
            for it in items:
                val = it.value if isinstance(it.value, dict) else {"text": str(it.value)}
                val.setdefault("id", it.key)
                val.setdefault("user_id", user_id)
                val.setdefault("category", "fact")
                val.setdefault("created_at", datetime.now(timezone.utc).isoformat())
                results.append(MemoryEntry(**val))
            return sorted(results, key=lambda x: x.created_at, reverse=True)
        except Exception as e:
            logger.error(f"Error reading user memories: {e}")
            return []

    def format_memories_for_prompt(self, user_id: str) -> str:
        """Format existing user memories into a bulleted string for prompt injection."""
        memories = self.get_user_memories(user_id)
        if not memories:
            return "(No existing user memories)"
        
        return "\n".join(f"- {m.text}" for m in memories)

    def delete_memory(self, user_id: str, memory_id: str) -> bool:
        """Delete a specific memory by ID."""
        ns = self._get_namespace(user_id)
        try:
            self.store.delete(ns, memory_id)
            logger.info(f"Deleted memory '{memory_id}' for user '{user_id}'")
            return True
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False

    def clear_all_memories(self, user_id: str) -> int:
        """Wipe all long-term memories for a user."""
        ns = self._get_namespace(user_id)
        memories = self.get_user_memories(user_id)
        count = len(memories)
        for m in memories:
            try:
                self.store.delete(ns, m.id)
            except Exception:
                pass
        logger.info(f"Cleared all {count} memories for user '{user_id}'")
        return count

    def prune_excess_memories(self, user_id: str, max_entries: int = 50) -> int:
        """Prune oldest memories if count exceeds max_entries to avoid unbounded growth."""
        memories = self.get_user_memories(user_id)
        if len(memories) <= max_entries:
            return 0

        # Excess sorted oldest first
        excess = memories[max_entries:]
        ns = self._get_namespace(user_id)
        pruned = 0
        for m in excess:
            try:
                self.store.delete(ns, m.id)
                pruned += 1
            except Exception:
                pass
        logger.info(f"Pruned {pruned} excess memories for user '{user_id}' (limit: {max_entries})")
        return pruned


# Global manager singleton
memory_manager = MemoryStoreManager()


def get_memory_manager() -> MemoryStoreManager:
    """Get the global MemoryStoreManager singleton."""
    global memory_manager
    return memory_manager
