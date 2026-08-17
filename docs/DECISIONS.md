# Architecture Decision Records (ADRs)

## ADR-001: Adoption of LangGraph for State Management and Cyclical Agent Loops
- **Status**: Accepted
- **Context**: Needed an extensible, type-safe framework supporting cyclical agent execution, short-term checkpointers, memory stores, and human-in-the-loop interrupts.
- **Decision**: Adopt LangGraph with `StateGraph` and `MemorySaver`.
- **Consequences**: Standardizes graph nodes (`remember`, `summarize`, `chat`, `tools`), enables native SSE event streaming, and eliminates ad-hoc while-loops.

---

## ADR-002: Model Context Protocol (MCP) for External Integrations
- **Status**: Accepted
- **Context**: Needed a standardized way to connect Google Workspace, GitHub, and custom third-party tools with process isolation and security.
- **Decision**: Implement FastMCP servers via `langchain-mcp-adapters` using standard I/O (`stdio`).
- **Consequences**: MCP tools are dynamically discovered at startup, run in isolated subprocesses, and can be extended without altering the core agent graph.

---

## ADR-003: Hybrid Dual-Tier Memory Architecture (STM + LTM)
- **Status**: Accepted
- **Context**: Conversations required both immediate thread context and durable cross-thread personalization without polluting the LLM context window.
- **Decision**: Use `MemorySaver` checkpointer for thread-level Short-Term Memory and `InMemoryStore` under namespace `("user", user_id, "memories")` for atomic Long-Term Memory facts.
- **Consequences**: Enables memory persistence across threads, structured extraction via `remember_node`, and conflict reconciliation via `cleaner.py`.

---

## ADR-004: Server-Enforced Human-in-the-Loop (HITL) Safety
- **Status**: Accepted
- **Context**: Actions with real-world side effects (email dispatch, SQL mutations) required user consent.
- **Decision**: Enforce interrupts at the backend graph execution level via `langgraph.types.interrupt()` and resume via `POST /api/chat/resume/stream`.
- **Consequences**: Prevents unapproved execution even if client connections drop; guarantees that state transitions only occur upon explicit user authorization.

---

## ADR-005: LLM Provider Architecture via Groq and OpenAI Compatibility
- **Status**: Accepted
- **Context**: Needed ultra-low latency streaming inference with tool calling support.
- **Decision**: Integrate `ChatOpenAI(base_url="https://api.groq.com/openai/v1")` with model `openai/gpt-oss-120b`.
- **Consequences**: Provides high-throughput streaming token generation and function calling while avoiding vendor-specific grammar streaming bugs.
