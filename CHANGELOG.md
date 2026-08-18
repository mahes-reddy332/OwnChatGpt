# Changelog

All notable changes to the **Nexus AI** Agentic AI Workspace project will be documented in this file.

---

## [1.4.1] — 2026-08-18 (Database URL Auto-Normalization & Cross-Origin Robustness)

### Added & Fixed
- **Database URL Auto-Normalization** (`backend/app/database/session.py`, `backend/alembic/env.py`):
  - Added `get_normalized_database_url()` to automatically convert standard Cloud `postgres://` or `postgresql://` connection strings into `postgresql+asyncpg://` for SQLAlchemy AsyncIO and Alembic.
  - Added `pool_pre_ping=True` to prevent stale database pool connections.
- **Global Error Handling with CORS Guarantee** (`backend/app/main.py`):
  - Wrapped unhandled server exceptions to guarantee `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials` are attached even on HTTP 500 error responses, preventing browser `Failed to fetch` false negatives.
- **Model Registration & Alembic Migrations**:
  - Explicitly registered all models (`User`, `Session`, `UserPreferences`, `Connector`, `ConnectorCredential`, `MCPCapability`) in `session.py` and `alembic/env.py`.
  - Added migration `002_add_connectors_tables.py`.
- **Documentation**:
  - Created [`docs/AUTHENTICATION.md`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/AUTHENTICATION.md).
  - Updated [`PROJECT_DOCUMENTATION.md`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/PROJECT_DOCUMENTATION.md).

---

## [1.4.0] — 2026-08-18 (Production Readiness & Vercel Deployment Hardening)

### Added & Fixed
- **Authoritative Vercel SPA Routing** (`frontend/vercel.json`):
  - Configured SPA rewrite (`/(.*)` $\to$ `/index.html`) so subroutes (`/signup`, `/login`, `/chat`, `/settings`) do not 404 on direct load or refresh.
- **Dynamic Frontend API Base URL** (`frontend/src/services/api.ts`):
  - Added support for `VITE_API_URL` environment variable with automated `/api` normalization for connecting to external backend deployments.
  - Upgraded error parser to log diagnostic error codes (e.g. `HTTP 404: Not Found`) instead of swallowing failures into generic strings.
- **Production Backend Dependencies & CORS**:
  - Added `asyncpg`, `sqlalchemy`, `alembic`, `bcrypt`, `cryptography`, `langchain-groq`, `fastmcp` to `backend/requirements.txt`.
  - Added `CORS_ALLOWED_ORIGINS` and dynamic CORS origin resolution in `backend/app/main.py`.
- **Production Deployment Runbook & Documentation**:
  - Created [`docs/DEPLOYMENT.md`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/DEPLOYMENT.md) with container deployment instructions, environment variable matrix, and Alembic migration guide.
  - Created [`docs/VERCEL.md`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/VERCEL.md) explaining frontend Vercel deployment and routing.
  - Updated [`docs/TROUBLESHOOTING.md`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/docs/TROUBLESHOOTING.md) with root-cause analysis and resolution for the Vercel signup 404.

---

## [1.3.0] — 2026-08-18 (Rich Message Renderer & Structured Chat UX)

### Added
- **Rich Message Renderer Architecture**:
  - Integrated `react-markdown` and `remark-gfm` with full AST component mappings.
  - **CodeBlock Component** (`CodeBlock.tsx`): Language label badge, copy-to-clipboard button with visual feedback, horizontal scrolling.
  - **DataTable Component** (`DataTable.tsx`): Responsive Markdown table wrapper preserving horizontal scrolling.
  - **Streaming Markdown Normalization**: In-memory code fence balancer for incomplete streaming chunks.
  - Headings, lists, blockquotes, inline code, and clickable links.

---

## [1.2.0] — 2026-08-17 (Phase 1: Information Architecture & Navigation Refactoring)

### Added
- **Refactored 8-Destination User Account Menu**:
  - `UserAccountMenu.tsx`: Clean dropup menu organized into `/profile`, `/personalization`, `/settings`, `/skills`, `/connectors`, `/plugins`, `/settings/language`, `/help`, and `/logout`.
- **Strict Separation of Concerns Across Workspace Pages**:
  - `/profile` (User Identity), `/personalization` (AI behavior & instructions), `/settings` (App config & memory), `/settings/language` (Language), `/skills` (Agent capabilities), `/connectors` (External accounts & remote MCP), `/plugins` (Extensions), `/help` (System reference).

---

## [1.1.0] — 2026-08-17

### Added
- **Authentication & User Accounts**:
  - Opaque database-backed sessions with SHA-256 token hashing and `HttpOnly` cookie.
  - Authoritative backend expiration: 30-minute idle timeout + 7-day absolute lifetime.
  - Anti-CSRF double-submit protection.
  - Public landing page, login, and registration screens.

---

## [1.0.0] — 2026-08-16

### Initial Core Capabilities
- LangGraph ReAct agent orchestration with Groq `openai/gpt-oss-120b`.
- FastMCP servers for Google Workspace (Drive, Gmail, Calendar) and GitHub.
- Built-in tool suite, ChromaDB vector knowledge base, long-term memory, and HITL safety.
