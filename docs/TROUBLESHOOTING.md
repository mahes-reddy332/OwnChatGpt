# Troubleshooting & Known Issues

## 1. Resolved Historical Issues

### 1.1 Groq Rate Limits (TPM / TPD Overflow)
- **Symptom**: `openai.RateLimitError: 429 - Rate limit reached for model openai/gpt-oss-120b on tokens per minute (TPM): Limit 8000`.
- **Root Cause**: Passing excessive system prompt tokens, full raw tool schemas, and uncompressed conversation history on every streaming turn.
- **Resolution**:
  1. Streamlined system instructions to a concise prompt template.
  2. Implemented rolling summarization in `summarize_conversation_node` keeping only the 4 most recent turns.
  3. Switched to `ChatOpenAI(base_url="https://api.groq.com/openai/v1")` with model `openai/gpt-oss-120b`.

---

### 1.2 GitHub MCP 401 Unauthorized Error
- **Symptom**: `github_get_my_repos` returned `401 Requires authentication`.
- **Root Cause**: FastMCP spawns separate child processes via `sys.executable`. The subprocess was not inheriting `GITHUB_PERSONAL_ACCESS_TOKEN` unless `.env` was explicitly loaded in the child module.
- **Resolution**: Added `from dotenv import load_dotenv; load_dotenv()` at top of `backend/app/mcp/servers/github_server.py`.

---

### 1.3 Google Calendar Subscribed / Course Events Missing
- **Symptom**: Querying Google Calendar returned no course events (e.g. IITM BS Degree events) even though they showed on the user's web calendar.
- **Root Cause**:
  1. IITM BS Degree courses are **secondary / subscribed calendars**, not in `calendarId="primary"`.
  2. Initial OAuth consent only requested `calendar.events` (primary only) instead of `calendar.readonly` / `calendar`.
  3. Omission of RFC 3339 `Z` timezone offset in `timeMin`/`timeMax` caused HTTP 400 Bad Request on specific date queries.
- **Resolution**:
  1. Updated scopes to include `https://www.googleapis.com/auth/calendar`.
  2. Enhanced `gcalendar_list_events` with robust ISO RFC 3339 date handling (`YYYY-MM-DDT00:00:00Z`).
  3. Added multi-calendar traversal via `service.calendarList().list()`.

---

### 1.4 HITL LangGraph Interrupt Handling
- **Symptom**: `interrupt()` calls in custom tool execution functions were bypassed or failing to pause Pregel graph execution.
- **Root Cause**: Custom wrapper nodes around tool calling interfered with LangGraph's internal `ToolNode` interrupt bubbling.
- **Resolution**: Converted graph to direct `ToolNode` creation in `app/agent/nodes/tools.py` allowing native `langgraph.types.interrupt()` propagation to `astream_events()`.
