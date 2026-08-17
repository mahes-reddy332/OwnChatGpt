import logging
from langchain_core.messages import SystemMessage, HumanMessage, RemoveMessage
from langchain_core.runnables import RunnableConfig
from app.agent.state import AgentState
from app.llm.factory import get_chat_model
from app.core.config import get_settings

logger = logging.getLogger("app.agent.nodes.summarize")

SUMMARIZE_PROMPT = """You are an expert conversation summarizer.
Your goal is to maintain a concise, comprehensive rolling summary of the conversation so far.

EXISTING SUMMARY:
{existing_summary}

NEW MESSAGES TO INCORPORATE:
{new_messages}

INSTRUCTIONS:
1. Merge the new messages with the existing summary.
2. Preserve key facts, user requests, assistant solutions, decisions made, and unresolved questions.
3. Keep the summary concise, objective, and structured in short paragraphs or bullet points.
4. Output ONLY the updated summary text."""

# Message threshold for triggering rolling summarization
MESSAGE_THRESHOLD = 6
# Number of recent messages to preserve verbatim
MESSAGES_TO_KEEP = 4


async def summarize_conversation_node(state: AgentState, config: RunnableConfig) -> dict:
    """
    Rolling summarization node.
    If the conversation exceeds MESSAGE_THRESHOLD, compresses older messages into
    a running summary and removes them from the active message list using RemoveMessage.
    """
    messages = state.get("messages", [])
    if len(messages) <= MESSAGE_THRESHOLD:
        return {}

    existing_summary = state.get("summary", "") or "(No previous summary)"
    
    # Partition messages: older ones to summarize, newest ones to keep verbatim
    messages_to_summarize = messages[:-MESSAGES_TO_KEEP]
    
    # Format messages for summarization prompt
    formatted_new_msgs = []
    for m in messages_to_summarize:
        role = getattr(m, "type", "message")
        content = getattr(m, "content", "")
        if isinstance(content, str) and content.strip():
            formatted_new_msgs.append(f"{role.upper()}: {content.strip()}")

    new_messages_text = "\n".join(formatted_new_msgs)
    if not new_messages_text:
        return {}

    settings = get_settings()
    has_valid_key = (
        (settings.LLM_PROVIDER == "groq" and bool(settings.GROQ_API_KEY)) or
        (settings.LLM_PROVIDER == "huggingface" and settings.HUGGINGFACE_API_KEY.startswith("hf_")) or
        (settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY.startswith("sk-"))
    )

    if has_valid_key:
        try:
            model = get_chat_model(temperature=0.0)
            prompt = SUMMARIZE_PROMPT.format(
                existing_summary=existing_summary,
                new_messages=new_messages_text,
            )
            response = await model.ainvoke([HumanMessage(content=prompt)], config=config)
            updated_summary = str(response.content).strip()
        except Exception as e:
            logger.warning(f"LLM summarization failed, falling back to basic summary: {e}")
            updated_summary = f"{existing_summary}\n\n[Recent topic]: {new_messages_text[:200]}"
    else:
        # Heuristic fallback summary for test/mock environments
        updated_summary = f"{existing_summary}\n\n[Recent discussion]: {new_messages_text[:200]}"

    logger.info(f"Summarized {len(messages_to_summarize)} messages. Retained {len(messages[-MESSAGES_TO_KEEP:])} recent messages.")

    # Remove the older messages from LangGraph state to prune context length
    delete_messages = [RemoveMessage(id=m.id) for m in messages_to_summarize if hasattr(m, "id") and m.id]

    return {
        "summary": updated_summary,
        "messages": delete_messages,
    }
