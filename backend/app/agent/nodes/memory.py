import logging
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from app.agent.state import AgentState
from app.memory.store import get_memory_manager
from app.memory.extractor import extract_memories

logger = logging.getLogger("app.agent.nodes.memory")


async def remember_node(state: AgentState, config: RunnableConfig) -> dict:
    """
    Background memory extraction node.
    Inspects the latest user message, extracts durable facts/preferences,
    and updates the Long-Term Memory store.
    """
    configurable = config.get("configurable", {}) if config else {}
    user_id = configurable.get("user_id", "default_user")
    
    messages = state.get("messages", [])
    if not messages:
        return {}

    # Find the latest human message
    last_human_msg = next((m for m in reversed(messages) if isinstance(m, HumanMessage)), None)
    if not last_human_msg or not isinstance(last_human_msg.content, str):
        return {}

    memory_manager = get_memory_manager()
    existing_memories_str = memory_manager.format_memories_for_prompt(user_id)

    try:
        decision = await extract_memories(last_human_msg.content, existing_memories_str)
        if decision.should_write:
            for item in decision.memories:
                if item.is_new and item.text.strip():
                    memory_manager.put_memory(
                        user_id=user_id,
                        text=item.text,
                        category=item.category,
                    )
    except Exception as e:
        logger.error(f"Error in remember_node: {e}", exc_info=True)

    return {}
