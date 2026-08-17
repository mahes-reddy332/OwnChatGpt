from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from app.agent.state import AgentState
from app.llm.factory import get_chat_model
from app.tools.registry import get_tool_registry
from app.memory.store import get_memory_manager
import app.tools.builtin  # ensures all built-in tools are registered
import app.hitl.tools   # ensures sensitive HITL tools are registered

BASE_SYSTEM_PROMPT = """You are an intelligent AI assistant with tools and Long-Term Memory.

USER CONTEXT:
{user_memories}
{conversation_summary}
Available Tools:
- Google Drive: `gdrive_search_files`, `gdrive_read_file`, `gdrive_list_files`
- Gmail: `gmail_search_emails`, `gmail_read_thread`, `gmail_send_email`
- Calendar: `gcalendar_list_events`, `gcalendar_create_event`
- GitHub: `github_get_my_repos`, `github_get_latest_push`, `github_get_repo`, `github_list_commits`, `github_search_issues`, `github_get_file_content`
- Other: `send_email_action`, `execute_database_mutation`, `code_evaluator`, `command_runner`, `filesystem_inspector`, `web_search`, `fetch_web_page`, `sql_inspector`, `search_knowledge_base`

Guidelines:
1. Always invoke tools when user queries Google Drive, Gmail, Calendar, GitHub, or web search.
2. For GitHub requests like "my latest push" or "my repos", call `github_get_latest_push` or `github_get_my_repos`.
3. Provide clear, structured, and helpful responses."""


async def chat_node(state: AgentState, config: RunnableConfig) -> dict:
    """
    Call the LLM with current messages, user memories, active summary, and registered tools.
    """
    configurable = config.get("configurable", {}) if config else {}
    user_id = configurable.get("user_id", "default_user")
    disabled_tools = set(configurable.get("disabled_tools", []))

    # 1. Retrieve user memories
    memory_manager = get_memory_manager()
    user_memories_str = memory_manager.format_memories_for_prompt(user_id)

    # 2. Retrieve conversation summary if present
    active_summary = state.get("summary", "")
    summary_block = f"\nSUMMARY OF PREVIOUS TURNS:\n{active_summary}\n" if active_summary else ""

    system_content = BASE_SYSTEM_PROMPT.format(
        user_memories=user_memories_str,
        conversation_summary=summary_block,
    )

    raw_messages = list(state.get("messages", []))

    # Filter messages to ensure clean history
    clean_messages = []
    for m in raw_messages:
        if isinstance(m, SystemMessage):
            continue
        clean_messages.append(m)

    # Keep at most last 10 messages to strictly conserve TPM on Groq
    if len(clean_messages) > 10:
        clean_messages = clean_messages[-10:]

    messages = [SystemMessage(content=system_content)] + clean_messages

    all_tools = get_tool_registry().get_all_tools()
    active_tools = [t for t in all_tools if t.name not in disabled_tools]

    if active_tools:
        model = get_chat_model().bind_tools(active_tools)
    else:
        model = get_chat_model()

    response = await model.ainvoke(messages, config=config)
    return {"messages": [response]}
