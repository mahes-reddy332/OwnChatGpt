# Server-Sent Events (SSE) Streaming Protocol

## 1. Overview

The backend uses standard HTTP Server-Sent Events (SSE) at `POST /api/chat/stream` and `POST /api/chat/resume/stream` to deliver real-time agent execution events to the frontend.

---

## 2. SSE Event Taxonomy

| Event Name | Description | Payload Schema |
|---|---|---|
| `stream_start` | Emitted when agent execution begins | `{"thread_id": "...", "user_id": "..."}` |
| `token` | Incremental LLM text chunk | `{"content": "..."}` |
| `tool_call_start`| Agent initiates a tool call | `{"tool_id": "...", "tool_name": "...", "args": {...}, "tool_type": "builtin"|"mcp"|"rag"}` |
| `tool_call_end` | Tool execution completed | `{"tool_id": "...", "tool_name": "...", "result": "...", "execution_time_ms": 120.5}` |
| `hitl_interrupt` | Graph paused awaiting human approval | `{"interrupt_id": "...", "tool_name": "...", "action": "...", "args": {...}, "thread_id": "..."}` |
| `rag_sources` | RAG citations retrieved | `{"sources": [{"filename": "...", "page": 1, "snippet": "..."}]}` |
| `memory_updated`| LTM facts updated or extracted | `{"memories": [{"id": "...", "category": "profile", "content": "..."}]}` |
| `error` | Fatal error during execution | `{"error": "...", "code": "..."}` |
| `stream_end` | Agent finished responding | `{"status": "completed", "total_duration_ms": 1420}` |

---

## 3. Example SSE Wire Protocol Sample

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: stream_start
data: {"thread_id": "792673e1", "user_id": "default_user"}

event: tool_call_start
data: {"tool_id": "c1", "tool_name": "github_get_my_repos", "args": {"limit": 5}, "tool_type": "mcp"}

event: tool_call_end
data: {"tool_id": "c1", "tool_name": "github_get_my_repos", "result": "1. OwnChatGpt...", "execution_time_ms": 850.2}

event: token
data: {"content": "Here are "}

event: token
data: {"content": "your recent repositories:"}

event: stream_end
data: {"status": "completed"}
```

---

## 4. Frontend Event Handling (`useChat` hook)

The frontend parses the SSE stream using `fetch()` and `ReadableStreamDefaultReader`:
- Buffers incoming bytes and splits on newline delimiters (`\n\n`).
- Decodes `event:` and `data:`.
- Updates React state incrementally without UI flashing.
