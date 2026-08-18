# Production Deployment Guide

This guide provides end-to-end instructions for deploying the **Nexus AI** Agentic Workspace to production.

---

## 1. Production Architecture Overview

```mermaid
flowchart LR
    subgraph FrontendPlatform["Frontend (Vercel)"]
        FE[React 19 + TypeScript SPA]
        VERCEL_JSON[vercel.json SPA Rewrite]
    end

    subgraph BackendPlatform["Backend Container (Render / Railway / Fly.io)"]
        FASTAPI[FastAPI + Uvicorn]
        LANGGRAPH[LangGraph Cyclic ReAct Graph]
        SSE[Streaming SSE Engine]
        MCP[FastMCP Connectors]
    end

    subgraph Persistence["Managed Infrastructure"]
        PG[(PostgreSQL Database: Users, Sessions, Connectors)]
        CHROMA[(Persistent Volume: ChromaDB Vector RAG)]
    end

    FE -->|HTTPS / WSS| FASTAPI
    FASTAPI --> PG
    FASTAPI --> CHROMA
    FASTAPI --> LANGGRAPH
```

---

## 2. Environment Variables Configuration

### A. Frontend Environment Variables (Vercel Dashboard)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Public URL of the deployed FastAPI backend API. | `https://nexus-ai-backend.onrender.com` |

### B. Backend Environment Variables (Render / Railway / Fly.io / Docker)

| Variable | Description | Example / Default |
|---|---|---|
| `ENVIRONMENT` | Deployment environment identifier. | `production` |
| `DATABASE_URL` | Managed PostgreSQL async connection string. | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| `LLM_PROVIDER` | Active LLM bridge provider. | `groq` (or `openai`, `huggingface`) |
| `GROQ_API_KEY` | Groq Cloud API Secret Key. | `gsk_...` |
| `GROQ_MODEL` | Fast reasoning model. | `openai/gpt-oss-120b` |
| `AUTH_SECRET_KEY` | High-entropy random secret key for session token encryption. | `min-32-char-random-string` |
| `AUTH_COOKIE_SECURE` | Enforce HTTPS-only transmission on session cookies. | `True` |
| `AUTH_COOKIE_SAMESITE` | Cookie SameSite policy (`none` for cross-origin, `lax` for same-origin). | `none` (or `lax`) |
| `FRONTEND_URL` | Primary deployed frontend domain for CORS. | `https://nexus-nine-flax-34.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed web origins. | `https://nexus-nine-flax-34.vercel.app` |
| `CHROMA_PERSIST_DIR` | Directory on persistent disk for vector embeddings. | `/data/chroma` |

---

## 3. Database Migration Runbook

Before routing live traffic to the backend, apply all Alembic migrations:

```bash
# Run database migrations against production PostgreSQL
cd backend
alembic upgrade head
```

Verify tables created:
- `users`
- `sessions`
- `user_preferences`
- `connectors`
- `connector_credentials`
- `mcp_capabilities`

---

## 4. Pre-Flight Production Checklist

- [x] **Authoritative Vercel Configuration**: `frontend/vercel.json` SPA rewrite configured.
- [x] **Dynamic Frontend API Client**: `VITE_API_URL` environment variable support.
- [x] **Secure Cookies**: `AUTH_COOKIE_SECURE=True` and `AUTH_COOKIE_SAMESITE=none` for cross-origin deployments.
- [x] **Anti-CSRF Protection**: Bootstrap endpoints (`/signup`, `/login`) exempt; mutating routes guarded.
- [x] **PostgreSQL Connection**: `asyncpg` async driver installed in `backend/requirements.txt`.
- [x] **CORS Configuration**: Production domain included in `CORSMiddleware`.
- [x] **LLM Factory**: Groq configured via provider factory without hardcoding.
- [x] **Pytest Automated Tests**: 100% passing (44/44 unit and integration tests).
