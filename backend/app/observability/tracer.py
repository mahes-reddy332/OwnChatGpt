import os
import logging
from typing import Any
from app.core.config import get_settings

logger = logging.getLogger("app.observability.tracer")


def setup_langsmith() -> bool:
    """
    Initialize LangSmith environment variables from application settings.
    
    Returns:
        bool: True if LangSmith tracing is active, False otherwise.
    """
    settings = get_settings()

    tracing_enabled = (
        settings.LANGCHAIN_TRACING_V2
        or settings.LANGSMITH_TRACING
        or bool(settings.LANGCHAIN_API_KEY)
        or bool(settings.LANGSMITH_API_KEY)
    )

    api_key = settings.LANGCHAIN_API_KEY or settings.LANGSMITH_API_KEY
    project = settings.LANGCHAIN_PROJECT or settings.LANGSMITH_PROJECT or "agentic-rag-chatbot"
    endpoint = settings.LANGCHAIN_ENDPOINT or "https://api.smith.langchain.com"

    if tracing_enabled and api_key:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = api_key
        os.environ["LANGCHAIN_PROJECT"] = project
        os.environ["LANGCHAIN_ENDPOINT"] = endpoint
        logger.info(f"LangSmith Tracing ENABLED for project: '{project}' at {endpoint}")
        return True
    elif tracing_enabled and not api_key:
        logger.warning(
            "LangSmith Tracing requested, but no LANGCHAIN_API_KEY / LANGSMITH_API_KEY provided. "
            "Traces will run locally without remote publishing."
        )
        return False
    else:
        logger.info("LangSmith Tracing is currently DISABLED.")
        return False


def build_tracer_config(
    thread_id: str,
    run_name: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Build a standard RunnableConfig containing trace tags, metadata, and thread_id
    for LangGraph graph invocations and streaming.
    
    Args:
        thread_id (str): Conversation thread ID.
        run_name (str | None): Custom name for the trace run in LangSmith.
        tags (list[str] | None): Searchable tags for LangSmith trace filtering.
        metadata (dict[str, Any] | None): Custom metadata attributes.
        
    Returns:
        dict[str, Any]: Formatted RunnableConfig dictionary.
    """
    settings = get_settings()
    
    default_tags = ["agentic-rag-chat", "langgraph-react"]
    if tags:
        default_tags.extend(tags)

    default_metadata = {
        "thread_id": thread_id,
        "model": settings.OPENAI_MODEL,
        "framework": "langgraph",
    }
    if metadata:
        default_metadata.update(metadata)

    return {
        "configurable": {"thread_id": thread_id},
        "run_name": run_name or f"ChatExecution-{thread_id[:8]}",
        "tags": list(set(default_tags)),
        "metadata": default_metadata,
    }
