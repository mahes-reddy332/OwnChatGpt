# REST API & WebSocket/SSE Endpoints

## 1. Overview & Base URL

- **Backend Host**: `http://127.0.0.1:8000`
- **Swagger / OpenAPI Documentation**: `http://127.0.0.1:8000/docs`
- **OpenAPI JSON Spec**: `http://127.0.0.1:8000/openapi.json`
- **Authentication**: Opaque session token stored in `HttpOnly` cookie (`nexus_session`).
- **CSRF Protection**: Double-submit `nexus_csrf` cookie matching `X-CSRF-Token` header on mutating methods (`POST`, `PUT`, `DELETE`).

---

## 2. API Endpoints Reference

### 2.1 Authentication & User Session Management (`/api/auth`)

| Method | Endpoint | Auth Required | CSRF Exempt | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | No | Yes | Register new user account; issues session and CSRF cookies |
| `POST` | `/api/auth/login` | No | Yes | Authenticate with email/password; issues cookies |
| `POST` | `/api/auth/logout` | Yes | No | Revoke current session and clear cookies |
| `POST` | `/api/auth/logout-all` | Yes | No | Revoke all active sessions across all devices |
| `GET` | `/api/auth/me` | Yes | N/A | Get authenticated user profile and metadata |
| `PUT` | `/api/auth/profile` | Yes | No | Update display name and custom avatar URL |
| `GET` | `/api/auth/preferences` | Yes | N/A | Get AI response style, custom instructions, theme |
| `PUT` | `/api/auth/preferences` | Yes | No | Update AI personalization and appearance settings |
| `GET` | `/api/auth/sessions` | Yes | N/A | List all active sessions with user-agent and IP |
| `POST` | `/api/auth/touch-session`| Yes | No | Explicitly refresh idle timeout (e.g. click "Stay signed in") |
| `POST` | `/api/auth/forgot-password`| No | Yes | Development recovery stub returning safe generic message |

---

### 2.2 Chat & Streaming (`/api/chat`)

#### `POST /api/chat/stream`
Initiate a streaming conversation turn.
- **Headers**: `X-CSRF-Token: <nexus_csrf_value>`
- **Request Body**:
```json
{
  "message": "List my Google Calendar events for tomorrow",
  "thread_id": "792673e1-6236-4323-88ea-06cc84e3a934",
  "disabled_tools": []
}
```
- **Response**: `text/event-stream` (SSE events: `stream_start`, `token`, `tool_call_start`, `tool_call_end`, `hitl_interrupt`, `rag_sources`, `stream_end`).

#### `POST /api/chat/resume/stream`
Resume execution of an interrupted Human-in-the-Loop task.
- **Headers**: `X-CSRF-Token: <nexus_csrf_value>`
- **Request Body**:
```json
{
  "thread_id": "792673e1-6236-4323-88ea-06cc84e3a934",
  "decision": "approve",
  "modified_args": null
}
```
- **Response**: `text/event-stream`

---

### 2.3 Conversation Threads (`/api/threads`)

- **`GET /api/threads`**: List all threads owned by the authenticated user.
- **`POST /api/threads`**: Create a new thread (requires `X-CSRF-Token`).
- **`GET /api/threads/{thread_id}`**: Get thread details and message history (isolated to owner).
- **`PATCH /api/threads/{thread_id}`**: Rename thread title (requires `X-CSRF-Token`).
- **`DELETE /api/threads/{thread_id}`**: Delete thread (requires `X-CSRF-Token`).

---

### 2.4 Long-Term Memory (`/api/memory`)

- **`GET /api/memory`**: List all long-term memories for authenticated user.
- **`POST /api/memory`**: Store a new memory item (requires `X-CSRF-Token`).
- **`PUT /api/memory/{memory_id}`**: Update memory text/category (requires `X-CSRF-Token`).
- **`DELETE /api/memory/{memory_id}`**: Delete a single memory item (requires `X-CSRF-Token`).
- **`DELETE /api/memory/clear`**: Clear all memories for authenticated user (requires `X-CSRF-Token`).
- **`POST /api/memory/cleanup`**: Trigger automatic contradiction resolution & pruning.

---

### 2.5 Knowledge Base RAG (`/api/documents`)

- **`POST /api/documents/upload`**: Upload and ingest document into ChromaDB (requires `X-CSRF-Token`).
- **`GET /api/documents`**: List all ingested documents.

---

### 2.6 Tools & MCP Management (`/api/tools`, `/api/mcp`)

- **`GET /api/tools`**: List all registered built-in, RAG, and MCP tools with schemas.
- **`GET /api/mcp/servers`**: List configured MCP servers and status.
- **`POST /api/mcp/servers`**: Register/update an MCP server (requires `X-CSRF-Token`).
- **`DELETE /api/mcp/servers/{id}`**: Delete an MCP server (requires `X-CSRF-Token`).
- **`POST /api/mcp/reload`**: Force tool rediscovery across servers.
