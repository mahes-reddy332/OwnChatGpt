import logging
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage
from app.memory.store import get_memory_manager
from app.llm.factory import get_chat_model
from app.core.config import get_settings

logger = logging.getLogger("app.memory.cleaner")


class ConsolidatedMemories(BaseModel):
    """Consolidated list of non-contradictory, cleaned user memories."""
    clean_memories: list[str] = Field(description="Consolidated, updated list of atomic factual statements with contradictions resolved.")


CLEANUP_PROMPT = """You are an intelligent memory reconciliation and conflict resolution agent.
Review the following user memories.

RAW USER MEMORIES:
{raw_memories}

INSTRUCTIONS:
1. Detect and resolve contradictions (e.g. If 'Lives in London' and 'Moved to Tokyo' both exist, keep ONLY the latest state 'Lives in Tokyo').
2. Merge duplicate or overlapping preferences into a single clear statement.
3. Remove obsolete or superseded facts.
4. Output a clean, consolidated list of atomic memory statements."""


async def reconcile_user_memories(user_id: str = "default_user") -> int:
    """
    Reconcile memory contradictions, remove duplicates, and consolidate memory store.
    
    Returns:
        int: Number of clean memories remaining.
    """
    manager = get_memory_manager()
    existing_memories = manager.get_user_memories(user_id)
    if len(existing_memories) <= 1:
        return len(existing_memories)

    raw_texts = [m.text for m in existing_memories]
    raw_str = "\n".join(f"- {t}" for t in raw_texts)

    settings = get_settings()
    clean_texts: list[str] = []

    has_valid_key = (
        (settings.LLM_PROVIDER == "groq" and bool(settings.GROQ_API_KEY)) or
        (settings.LLM_PROVIDER == "huggingface" and settings.HUGGINGFACE_API_KEY.startswith("hf_")) or
        (settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY.startswith("sk-"))
    )

    if has_valid_key:
        try:
            model = get_chat_model(temperature=0.0)
            structured_model = model.with_structured_output(ConsolidatedMemories, method="function_calling")

            messages = [
                SystemMessage(content=CLEANUP_PROMPT.format(raw_memories=raw_str)),
                HumanMessage(content="Consolidate and resolve any contradictions in these memories."),
            ]

            result: ConsolidatedMemories = await structured_model.ainvoke(messages)
            clean_texts = result.clean_memories
        except Exception as e:
            logger.warning(f"Error in LLM memory reconciliation: {e}")
            clean_texts = list(dict.fromkeys(raw_texts))
    else:
        # Fallback deduplication without LLM
        clean_texts = list(dict.fromkeys(raw_texts))

    if clean_texts:
        # Clear existing memories and replace with consolidated atomic items
        manager.clear_all_memories(user_id)
        for text in clean_texts:
            manager.put_memory(user_id=user_id, text=text, category="fact")

    logger.info(f"Reconciled memories for user '{user_id}'. Original: {len(raw_texts)}, Consolidated: {len(clean_texts)}")
    return len(clean_texts)
