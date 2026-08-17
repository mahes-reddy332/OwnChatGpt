import logging
from langchain_core.messages import SystemMessage, HumanMessage
from app.llm.factory import get_chat_model
from app.memory.models import MemoryDecision, MemoryItem
from app.core.config import get_settings

logger = logging.getLogger("app.memory.extractor")

MEMORY_EXTRACTION_PROMPT = """You are an accurate user memory extraction agent.
Your job is to identify stable, factual information about the user worth remembering long-term across conversation threads.

CURRENT USER MEMORIES:
{existing_memories}

INSTRUCTIONS:
1. Review the user's latest input message.
2. Extract atomic, concise facts about:
   - Identity / Role / Name (category: profile)
   - Preferences & Constraints (category: preference)
   - Projects, Tools & Stacks (category: project)
   - General facts (category: fact)
3. Compare against CURRENT USER MEMORIES:
   - Set is_new=true ONLY if this is genuinely NEW information or an update.
   - If the fact is already known or essentially identical, set is_new=false.
4. If the message is a transient question, greeting, or contains no durable user facts, return should_write=false with an empty list.
5. Never speculate; record ONLY facts directly stated or clearly implied by the user."""


async def extract_memories(user_message: str, existing_memories: str) -> MemoryDecision:
    """
    Analyze the user's message against existing memories and extract new atomic memory items.
    """
    settings = get_settings()

    # Safety check: if no real API key is configured (e.g. offline unit test mode)
    has_valid_key = (
        (settings.LLM_PROVIDER == "groq" and bool(settings.GROQ_API_KEY)) or
        (settings.LLM_PROVIDER == "huggingface" and settings.HUGGINGFACE_API_KEY.startswith("hf_")) or
        (settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY.startswith("sk-"))
    )
    if not has_valid_key:
        return _fallback_memory_extraction(user_message, existing_memories)

    try:
        model = get_chat_model(temperature=0.0)
        structured_model = model.with_structured_output(MemoryDecision, method="function_calling")

        messages = [
            SystemMessage(content=MEMORY_EXTRACTION_PROMPT.format(existing_memories=existing_memories)),
            HumanMessage(content=user_message),
        ]

        decision: MemoryDecision = await structured_model.ainvoke(messages)
        return decision

    except Exception as e:
        logger.warning(f"Error during LLM memory extraction, using heuristic fallback: {e}")
        return _fallback_memory_extraction(user_message, existing_memories)


def _fallback_memory_extraction(user_message: str, existing_memories: str) -> MemoryDecision:
    """Deterministic heuristic memory extraction for unit tests and local dev."""
    msg = user_message.lower().strip()
    memories: list[MemoryItem] = []

    # Heuristic identity detection
    if "i am a" in msg or "i'm a" in msg or "my name is" in msg:
        content = user_message.strip()
        if content not in existing_memories:
            memories.append(MemoryItem(text=content, category="profile", is_new=True))

    # Heuristic preference detection
    if "i prefer" in msg or "i like" in msg or "always use" in msg:
        content = user_message.strip()
        if content not in existing_memories:
            memories.append(MemoryItem(text=content, category="preference", is_new=True))

    # Heuristic project detection
    if "i am building" in msg or "i'm working on" in msg or "my project" in msg:
        content = user_message.strip()
        if content not in existing_memories:
            memories.append(MemoryItem(text=content, category="project", is_new=True))

    if memories:
        return MemoryDecision(should_write=True, memories=memories)
    return MemoryDecision(should_write=False, memories=[])
