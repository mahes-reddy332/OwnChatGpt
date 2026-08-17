import re
import uuid
from datetime import datetime, timezone
from typing import Any
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.persistence.models import Thread, ThreadMetadata, ChatMessageItem
from app.agent.graph import get_agent_graph


def format_short_title(text: str) -> str:
    """
    Condense a user prompt into a sweet, short, polished thread heading (2-4 words max).
    Example:
      'Can you speak hindi . If yes write some...' -> 'Hindi Conversation'
      'List 10 Repositories in my github' -> 'GitHub Repositories'
      'List my tomorrow from google calendar events on august 18' -> 'Google Calendar'
    """
    if not text:
        return "New Conversation"

    clean = text.strip()
    # Normalize whitespace & remove code blocks/newlines
    clean = re.sub(r"```[\s\S]*?```", "", clean)
    clean = clean.split("\n")[0].strip()
    lower = clean.lower()

    # High-signal intent mappings
    if "hindi" in lower:
        return "Hindi Conversation"
    if "telugu" in lower:
        return "Telugu Conversation"
    if "calendar" in lower or "meeting" in lower or "event" in lower:
        return "Google Calendar"
    if "github" in lower or "repo" in lower or "commit" in lower:
        return "GitHub Repositories"
    if "drive" in lower or "gdrive" in lower:
        return "Google Drive"
    if "email" in lower or "gmail" in lower:
        return "Gmail Messages"
    if "resume" in lower:
        return "Resume Analysis"
    if "hitl" in lower or "approval" in lower:
        return "HITL Safety Review"
    if "rag" in lower or "knowledge base" in lower:
        return "Knowledge Base RAG"
    if "memory" in lower:
        return "Memory Management"
    if "langgraph" in lower:
        return "LangGraph Architecture"
    if "fastapi" in lower:
        return "FastAPI Backend"
    if "weather" in lower:
        return "Weather Lookup"

    # Strip conversational lead-in phrases
    patterns = [
        r"^(can\s+you\s+(please\s+)?(tell\s+me|write|explain|show|help\s+with|speak|do))\s+",
        r"^(please\s+(write|explain|show|tell\s+me|help\s+with|list|give))\s+",
        r"^(i\s+want\s+to\s+(know|learn|see|list|test|check|find))\s+",
        r"^(could\s+you\s+(please\s+)?(explain|show|write|give))\s+",
        r"^(what\s+is\s+the|how\s+to|how\s+do\s+i|where\s+is)\s+",
        r"^(tell\s+me\s+about|explain\s+to\s+me|show\s+me)\s+",
    ]
    for pat in patterns:
        clean = re.sub(pat, "", clean, flags=re.IGNORECASE).strip()

    # Take 3 to 4 core words
    words = clean.split()
    if len(words) > 4:
        words = words[:4]

    title = " ".join(words).strip(" .,!?:;-").title()
    if not title:
        title = "New Chat"

    # Limit to 28 characters max
    if len(title) > 28:
        title = title[:25].rstrip() + "..."

    return title


class ThreadStore:
    """
    In-memory and persistent storage manager for conversation threads and metadata.
    Provides thread CRUD operations and extracts past conversation state from LangGraph.
    """

    def __init__(self):
        self._threads: dict[str, Thread] = {}

    async def create_thread(
        self, thread_id: str | None = None, title: str | None = None
    ) -> Thread:
        """Create and store a new conversation thread."""
        tid = thread_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        thread = Thread(
            id=tid,
            title=title or "New Conversation",
            created_at=now,
            updated_at=now,
            metadata=ThreadMetadata(),
        )
        self._threads[tid] = thread
        return thread

    async def list_threads(self) -> list[Thread]:
        """List all threads sorted by most recently updated."""
        threads = list(self._threads.values())
        for t in threads:
            if len(t.title) > 28 or "..." in t.title:
                t.title = format_short_title(t.title)
        threads.sort(key=lambda t: t.updated_at, reverse=True)
        return threads

    async def get_thread(self, thread_id: str) -> Thread | None:
        """Retrieve a thread by its ID."""
        t = self._threads.get(thread_id)
        if t and (len(t.title) > 28 or "..." in t.title):
            t.title = format_short_title(t.title)
        return t

    async def update_thread(self, thread_id: str, title: str) -> Thread | None:
        """Update a thread's title and updated_at timestamp."""
        thread = self._threads.get(thread_id)
        if not thread:
            return None
        thread.title = title
        thread.updated_at = datetime.now(timezone.utc)
        return thread

    async def touch_thread(
        self, thread_id: str, auto_title_candidate: str | None = None
    ) -> Thread:
        """
        Update the thread's last active timestamp. If the thread is new or default-titled,
        automatically generate a sweet, short, topical title.
        """
        thread = self._threads.get(thread_id)
        now = datetime.now(timezone.utc)

        if not thread:
            # Auto-create with concise title
            title = format_short_title(auto_title_candidate) if auto_title_candidate else "New Conversation"
            thread = Thread(
                id=thread_id,
                title=title,
                created_at=now,
                updated_at=now,
                metadata=ThreadMetadata(),
            )
            self._threads[thread_id] = thread
            return thread

        thread.updated_at = now
        if thread.title in ("New Conversation", "New Chat") and auto_title_candidate:
            thread.title = format_short_title(auto_title_candidate)

        return thread

    async def delete_thread(self, thread_id: str) -> bool:
        """Delete a thread from the store."""
        if thread_id in self._threads:
            del self._threads[thread_id]
            return True
        return False

    async def get_thread_messages(self, thread_id: str) -> list[ChatMessageItem]:
        """
        Restore past conversation messages directly from the LangGraph checkpointer.
        """
        graph = get_agent_graph()
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            state_snapshot = await graph.aget_state(config=config)
            if not state_snapshot or not state_snapshot.values:
                return []

            messages = state_snapshot.values.get("messages", [])
            chat_items: list[ChatMessageItem] = []

            for msg in messages:
                # Omit internal SystemMessages from user-visible chat history
                if isinstance(msg, SystemMessage):
                    continue

                role = "user" if isinstance(msg, HumanMessage) else "assistant"
                content = str(msg.content)
                msg_id = getattr(msg, "id", None) or str(uuid.uuid4())

                chat_items.append(
                    ChatMessageItem(
                        id=str(msg_id),
                        role=role,
                        content=content,
                    )
                )

            return chat_items
        except Exception:
            return []


# Global singleton instance
_thread_store = ThreadStore()


def get_thread_store() -> ThreadStore:
    """Get the global singleton ThreadStore instance."""
    global _thread_store
    return _thread_store
