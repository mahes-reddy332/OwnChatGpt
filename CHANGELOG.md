# Changelog

All notable changes to the Agentic AI RAG Chatbot project are documented in this file.

## [1.0.0] - 2026-08-17

### Added
- **LangGraph Multi-Node ReAct Graph**: Implemented cyclical state machine with `remember`, `summarize`, `chat`, and `tools` nodes.
- **FastMCP Google Workspace Server**: Live OAuth2 and sandbox support for Google Drive (`gdrive_*`), Gmail (`gmail_*`), and Google Calendar (`gcalendar_*`).
- **FastMCP GitHub Integration Server**: Authenticated REST API support for repositories, user profiles, commits, issues, and file content (`github_*`).
- **Human-in-the-Loop (HITL)**: Server-enforced safety interrupts using `langgraph.types.interrupt()`, SSE `hitl_interrupt` events, and interactive React `HitlApprovalCard` with approve/decline/edit options.
- **Long-Term Memory Store**: Cross-thread atomic fact extraction, category tagging (`profile`, `preference`, `project`, `fact`), and conflict reconciliation.
- **RAG Knowledge Base**: Document ingestion for PDF/TXT/MD, ChromaDB vector indexing, cosine similarity retrieval, and SSE citation pills.
- **Real-Time Streaming**: Server-Sent Events (SSE) protocol delivering token-by-token text, live tool call badges, execution times, and error handling.
- **React 19 + TypeScript Frontend**: Modern glassmorphism UI with thread navigation, modal managers (Tools, MCP, Memory, Knowledge Base), and responsive layouts.
- **Automated Test Suite**: 42/42 unit and integration tests passing with `pytest`.

### Fixed
- Fixed Groq TPM rate limits by introducing rolling summarization and concise prompt compaction.
- Fixed GitHub MCP 401 Unauthorized errors by loading `.env` in FastMCP subprocesses.
- Fixed Google Calendar RFC 3339 date filtering and multi-calendar query support for subscribed/course calendars.
- Fixed LangGraph interrupt bubbling by converting to direct `ToolNode` execution.
