# Nexus AI — Project Master Documentation

Welcome to the **Nexus AI** Agentic AI Workspace project documentation. This document serves as the master entrypoint and overview of the entire system architecture, technical implementations, integrations, deployment guides, and operational runbooks.

---

## 1. System Overview

Nexus AI is an enterprise-grade, event-driven assistant built with **LangGraph**, **FastAPI**, **React 19 + TypeScript**, and the **Model Context Protocol (MCP)**. It integrates conversational intelligence, dynamic tool execution, long-term memory personalization, semantic RAG retrieval, and server-enforced Human-in-the-Loop (HITL) safety controls.

```mermaid
flowchart LR
    subgraph Client["Frontend (Vercel)"]
        REACT[React 19 + TypeScript SPA]
    end

    subgraph Server["Backend (Container)"]
        FASTAPI[FastAPI SSE Server]
        GRAPH[LangGraph Agent Graph]
    end

    subgraph Data["Persistence & Services"]
        MCP[FastMCP: Workspace & GitHub]
        CHROMA[(ChromaDB: RAG)]
        PG[(PostgreSQL / SQLite: Users & Sessions)]
        MEM[(InMemoryStore: LTM)]
        CHECK[(MemorySaver: STM)]
    end

    REACT <-->|SSE Stream & REST| FASTAPI
    FASTAPI <--> GRAPH
    FASTAPI <--> PG
    GRAPH <--> MCP
    GRAPH <--> CHROMA
    GRAPH <--> MEM
    GRAPH <--> CHECK
```

---

## 2. Documentation Directory Index

Detailed technical specifications and subsystem guides are located in the [`docs/`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/) directory:

| Document | Description |
|---|---|
| 🚀 [**Production Deployment Guide**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/DEPLOYMENT.md) | Containerized FastAPI deployment runbook, PostgreSQL setup, environment variable matrix, and pre-flight checklist. |
| ⚡ [**Vercel Configuration Guide**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/VERCEL.md) | Vercel SPA rewrites (`vercel.json`), root directory setup, and frontend environment variables. |
| 📐 [**Architecture Guide**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/ARCHITECTURE.md) | High-level system design, LangGraph graph topology, node execution flows, and state schemas. |
| 🛡️ [**HITL Safety Guidelines**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/HITL_GUIDELINES.md) | Human-in-the-loop safety principles, risk-tiered tool matrix, interrupt/resume lifecycle, and UI contracts. |
| 🧠 [**Memory Architecture**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/MEMORY.md) | Short-Term Memory checkpointer, Long-Term Memory extraction, atomic categories, and conflict resolution. |
| 📚 [**RAG Knowledge Base**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/RAG.md) | PDF/TXT/MD ingestion, RecursiveCharacterTextSplitter chunking, ChromaDB vector store, and citations. |
| 🔌 [**MCP Protocol & Servers**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/MCP.md) | FastMCP architecture, stdio transport, Google Workspace OAuth2, and GitHub REST API integration. |
| 🛠️ [**Tool Registry & Inventory**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/TOOLS.md) | Complete list of built-in, MCP, and RAG tools, side-effect classifications, and runtime permissions. |
| ⚡ [**Streaming Protocol (SSE)**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/STREAMING.md) | Server-Sent Events specification, event taxonomy (`token`, `tool_call_*`, `hitl_interrupt`), and wire payloads. |
| 🔍 [**Observability & LangSmith**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/LANGSMITH.md) | Distributed tracing, run trees, metadata tags, structured logging, and dynamic tracing toggles. |
| 💾 [**Database & Persistence**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/DATABASE.md) | Checkpoint storage (`MemorySaver`), memory store namespaces, PostgreSQL schema, and ChromaDB vector collections. |
| 🌐 [**REST & SSE API Reference**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/API.md) | Comprehensive FastAPI endpoints, request/response models, and error definitions. |
| 💻 [**Frontend Architecture**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/FRONTEND.md) | React 19 + TypeScript components, `useChat` custom hook, rich message renderer, and modals. |
| 🚀 [**Development & Setup**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/DEVELOPMENT.md) | Quickstart guide, environment configuration, virtual environments, and running `pytest`. |
| 🔧 [**Troubleshooting & Bug Fixes**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/TROUBLESHOOTING.md) | Log of historical issues, root-cause analyses, and validated bug fixes. |
| 📋 [**Architecture Decisions (ADRs)**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/DECISIONS.md) | Architectural Decision Records ADR-001 through ADR-005. |
| 📝 [**Changelog**](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/CHANGELOG.md) | Chronological log of versions, additions, and updates. |

---

## 3. Quick Verification Commands

```bash
# 1. Run all backend tests
cd backend
.venv\Scripts\pytest -v

# 2. Test live MCP GitHub query
.venv\Scripts\python -c "from app.mcp.servers.github_server import github_get_my_repos; print(github_get_my_repos(limit=3))"

# 3. Test live Google Calendar query
.venv\Scripts\python -c "from app.mcp.servers.google_workspace import gcalendar_list_events; print(gcalendar_list_events(date='2026-08-18'))"
```
