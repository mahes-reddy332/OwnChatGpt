# Observability & LangSmith Integration

## 1. Overview

The application features deep observability powered by **LangSmith** and structured JSON logging. Every conversation turn, agent state transition, LLM invocation, and tool execution is traced with complete inputs, outputs, latencies, and metadata.

---

## 2. Configuration & Environment Variables

Tracing is configured in `backend/.env` and loaded via `app/core/config.py`:

```ini
# LangSmith Observability
LANGCHAIN_TRACING_V2=True
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=agentic-rag-chatbot
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

---

## 3. Trace Hierarchy & Metadata

Every request dispatched through `stream_graph_events()` in `app/streaming/adapter.py` is enriched with custom trace metadata:

```python
config = {
    "configurable": {
        "thread_id": request.thread_id,
        "user_id": request.user_id,
    },
    "metadata": {
        "user_id": request.user_id,
        "thread_id": request.thread_id,
        "provider": settings.llm_provider,
        "model": settings.groq_model,
        "environment": "production" if not settings.debug else "development",
    },
    "tags": ["agentic-rag-chatbot", "langgraph", "fastapi"],
    "run_name": f"agent_turn_{request.thread_id[:8]}"
}
```

### Trace Run Tree:
```
agent_turn_792673e1 (Root Run)
  ├── remember_node (LTM Fact Extractor)
  ├── summarize_conversation_node (Context Condenser)
  ├── chat_node (LLM Completion via Groq / ChatOpenAI)
  └── tool_node (Tool Execution)
        ├── gcalendar_list_events (FastMCP Google Calendar)
        └── github_get_my_repos (FastMCP GitHub Server)
```

---

## 4. Tracing Toggle API

Tracing can be queried and enabled/disabled dynamically via the REST API:
- `GET /api/observability/status`: Check whether LangSmith tracing is currently active.
- `POST /api/observability/toggle`: Turn tracing on or off at runtime without restarting the server.
