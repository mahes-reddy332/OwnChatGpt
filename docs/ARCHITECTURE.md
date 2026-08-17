# System Architecture

## 1. High-Level Architecture

Nexus AI is an asynchronous, multi-agent AI workspace built on **LangGraph** (agent state graphs, checkpointers, and cyclical tool loops), **FastAPI** (streaming API, authentication, and MCP registry), and **React 19 + TypeScript** (responsive modular workspace shell).

```mermaid
flowchart TD
    subgraph Frontend["React 19 + TypeScript Frontend (Vite)"]
        UI[Chat Interface / Message Stream]
        HITL_UI[HITL Approval Modal & Cards]
        ROUTER[React Router: Public & Protected Routes]
        PAGES[Profile, Personalization, Settings, Skills, Connectors, Plugins, Language, Help]
    end

    subgraph Backend["FastAPI Backend (Python 3.11)"]
        API[FastAPI Router & SSE Streaming Adapter]
        AUTH[Auth Subsystem: Opaque Sessions & CSRF]
        CONN_REG[Connectors & Remote MCP Registry]
        TRACER[LangSmith Tracer Config]
        REGISTRY[Unified Tool Registry]
    end

    subgraph Agent["LangGraph Pregel StateGraph"]
        START((START))
        REMEMBER[remember_node: LTM Extraction]
        SUMMARIZE[summarize_conversation_node]
        CHAT[chat_node: ChatOpenAI / Groq LLM]
        ROUTER_NODE{tools_condition}
        TOOLS[tool_node: ToolNode Executor]
        INTERRUPT[HITL Interrupt Barrier]
        END_NODE((END))

        START --> REMEMBER --> SUMMARIZE --> CHAT
        CHAT --> ROUTER_NODE
        ROUTER_NODE -->|Tool Calls| TOOLS
        ROUTER_NODE -->|Final Response| END_NODE
        TOOLS -->|Pre-Approved / Read Tool| CHAT
        TOOLS -->|Sensitive Tool / HITL| INTERRUPT
    end

    subgraph Integrations["External Services, MCP & Persistence"]
        BUILTIN_MCP[Built-in FastMCP: Google Workspace, GitHub]
        CUSTOM_MCP[Custom Remote MCP Servers: Streamable HTTP, SSE]
        CHROMA[(ChromaDB Vector Store: RAG)]
        MEM_STORE[(In-Memory BaseStore: User LTM)]
        DB[(SQLAlchemy Relational Store: Users, Sessions, Connectors)]
    end

    ROUTER --> UI
    UI -->|POST /api/chat/stream| API
    HITL_UI -->|POST /api/chat/resume/stream| API
    API --> AUTH
    AUTH --> DB
    API --> Agent
    CHAT --> REGISTRY
    REGISTRY --> CONN_REG
    CONN_REG --> BUILTIN_MCP
    CONN_REG --> CUSTOM_MCP
    TOOLS --> CHROMA
    REMEMBER --> MEM_STORE
```

---

## 2. Information Architecture & Navigation Separation

Nexus AI strictly separates user concerns into dedicated product areas:

- **My Profile (`/profile`)**: Strictly user identity (Avatar, Full Name, Display Name, Email, Account Join Date).
- **Personalization (`/personalization`)**: Assistant interaction behavior (Response Style, Conversation Tone, Preferred Language, Custom Instructions, Citation Pills toggle, Tool Badges toggle).
- **Settings (`/settings`)**: Application configuration (General shortcuts, Appearance theme, Privacy & Data export, Active security sessions, Long-Term Memory manager).
- **Language (`/settings/language`)**: Dedicated interface and conversational language selection.
- **Skills (`/skills`)**: High-level agent workflows (Code Debugging, RAG Research, GitHub Assistant, Google Workspace, SQL Inspection) mapping required tools and MCP capabilities.
- **Connectors (`/connectors`)**: External service connections (GitHub, Google Workspace, Slack, Notion) and custom remote MCP server registrations.
- **Plugins (`/plugins`)**: Modular extension packages (ChromaDB RAG, Python Code Sandbox, Long-Term Memory Engine, FastMCP Universal Bridge).
- **Help & Capabilities (`/help`)**: System reference explaining agent loops, tools, connectors, and safety rules.

---

## 3. Storage and Persistence Layers

| Layer | Implementation | Purpose | Lifespan |
|---|---|---|---|
| **User & Session Store** | SQLAlchemy + Alembic (`sqlite+aiosqlite` / `asyncpg`) | `users`, `sessions`, `user_preferences`, `connectors` | Persistent DB |
| **Short-Term Memory** | `MemorySaver` checkpointer | Graph checkpoints per `thread_id`, task interrupts, tool execution states | Current session / Thread |
| **Long-Term Memory** | `InMemoryStore` (`BaseStore`) | Atomic user facts and preferences (`("user", user_id, "memories")`) | Cross-thread / User lifetime |
| **RAG Vector Database** | `ChromaDB` (`langchain-chroma`) | Chunk embeddings and cosine similarity retrieval for uploaded PDFs/documents | Persistent disk |
| **MCP Workspace Store** | `backend/data/google_workspace/*.json` | Google Drive mock files, Gmail queue, and Calendar events fallback | Persistent disk |
| **Google OAuth Store** | `backend/data/google_workspace/token.json` | Google Cloud OAuth2 refresh tokens for live Workspace API | Persistent disk |

---

## 4. Streaming Architecture (SSE)

Communication between FastAPI and React uses **Server-Sent Events (SSE)** via `stream_graph_events()` in `app/streaming/adapter.py`:

```
Client (React)                             Server (FastAPI / LangGraph)
      |                                                  |
      | -------- POST /api/chat/stream ----------------> |
      | <------- event: stream_start ------------------- |
      | <------- event: tool_call_start ---------------- |
      | <------- event: hitl_interrupt ----------------- | (Execution paused)
      |                                                  |
 [User clicks Approve]                                   |
      | -------- POST /api/chat/resume/stream ---------> |
      | <------- event: tool_call_end ------------------ |
      | <------- event: token (streaming text) --------- |
      | <------- event: stream_end --------------------- |
```
