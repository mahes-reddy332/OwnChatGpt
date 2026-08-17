# REST API & WebSocket/SSE Endpoints

## 1. Overview & Base URL

- **Backend Host**: `http://127.0.0.1:8000`
- **Swagger / OpenAPI Documentation**: `http://127.0.0.1:8000/docs`
- **OpenAPI JSON Spec**: `http://127.0.0.1:8000/openapi.json`

---

## 2. API Endpoints Reference

### 2.1 Chat & Streaming

#### `POST /api/chat/stream`
Initiate a streaming conversation turn.

**Request Body**:
```json
{
  "message": "List my Google Calendar events for tomorrow",
  "thread_id": "792673e1-6236-4323-88ea-06cc84e3a934",
  "user_id": "default_user",
  "disabled_tools": []
}
```
**Response**: `text/event-stream` (SSE events: `stream_start`, `token`, `tool_call_start`, `tool_call_end`, `hitl_interrupt`, `rag_sources`, `stream_end`).

---

#### `POST /api/chat/resume/stream`
Resume execution of an interrupted Human-in-the-Loop task.

**Request Body**:
```json
{
  "thread_id": "792673e1-6236-4323-88ea-06cc84e3a934",
  "interrupt_id": "5b4ec2b8-f07f-4318-8f83-e1d5ba5d39d9",
  "decision": "approve",
  "modified_args": null
}
```
**Response**: `text/event-stream` (resumes tool execution and streaming response).

---

### 2.2 Threads & State

- **`GET /api/threads`**: List all active conversation threads.
- **`GET /api/threads/{thread_id}/history`**: Fetch the complete message history for a thread.
- **`DELETE /api/threads/{thread_id}`**: Delete a conversation thread and its checkpoints.

---

### 2.3 Memory Management

- **`GET /api/memory?user_id=...`**: List all stored atomic memories for a user.
- **`POST /api/memory`**: Manually insert a memory item.
- **`PUT /api/memory/{memory_id}`**: Update an existing memory item.
- **`DELETE /api/memory/{memory_id}`**: Delete a single memory item.
- **`DELETE /api/memory/clear/all`**: Delete all memories for a user.
- **`POST /api/memory/cleanup/reconcile`**: Trigger automated LLM contradiction resolution.

---

### 2.4 Knowledge Base (RAG)

- **`POST /api/documents/upload`**: Upload PDF, TXT, or Markdown document for vector indexing (`multipart/form-data`).
- **`GET /api/documents`**: List all indexed documents in ChromaDB.
- **`DELETE /api/documents/{doc_id}`**: Delete document chunks from ChromaDB.

---

### 2.5 Tools & MCP Management

- **`GET /api/tools`**: List all registered built-in, RAG, and MCP tools with schemas.
- **`GET /api/mcp/servers`**: List configured MCP servers and connection health.
- **`POST /api/mcp/servers`**: Register a new MCP server.
- **`DELETE /api/mcp/servers/{server_id}`**: Remove an MCP server.
- **`POST /api/mcp/reload`**: Force tool rediscovery across all servers.

---

### 2.6 Observability

- **`GET /api/observability/status`**: Check LangSmith tracing configuration.
- **`POST /api/observability/toggle`**: Enable or disable LangSmith tracing at runtime.
