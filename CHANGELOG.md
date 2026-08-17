# Changelog

All notable changes to the **Nexus AI** Agentic AI Workspace project will be documented in this file.

---

## [1.3.0] — 2026-08-18 (Rich Message Renderer & Structured Chat UX)

### Added
- **Rich Message Renderer Architecture**:
  - Integrated `react-markdown` and `remark-gfm` with full AST component mappings.
  - **CodeBlock Component** (`CodeBlock.tsx`): Language label badge (`python`, `typescript`, `sql`), copy-to-clipboard button with visual feedback, horizontal scrolling, and monospace font.
  - **DataTable Component** (`DataTable.tsx`): Responsive Markdown table wrapper preserving horizontal scrolling for wide/complex tables with styled `thead`, alternating row hovers, and clean padding.
  - **Streaming Markdown Normalization**: Rendering-only in-memory code fence balancer that handles unclosed code blocks during token arrival without mutating state.
  - **Markdown Elements**:
    - Headings (`h1`, `h2`, `h3`, `h4`) with clear visual hierarchy and proper letter spacing.
    - Paragraphs with comfortable line-height and vertical rhythm.
    - Bullet and numbered lists with nested indentation.
    - Blockquotes and callouts with left accent border.
    - Clickable external links with `target="_blank"` and `rel="noopener noreferrer"`.
    - Pill-styled inline code tags (`code_evaluator`, `POST /api/chat`).
- **Message Action Bar** (`MessageActions.tsx`):
  - Copy assistant response to clipboard with animated checkmark feedback.
  - Timestamp rendering.
- **Modern Assistant Message Layout** (`Message.tsx`):
  - Nexus AI Sparkles avatar badge, assistant title, real-time "Generating" indicator.
  - Dedicated tool execution cards (`ToolCall.tsx`), interactive HITL cards (`HitlApprovalCard.tsx`), and RAG citation pills (`SourceCitation.tsx`) cleanly composed above and below the message body.
- **System Prompt Formatting Guidance** (`chat.py`):
  - Prompt instructions updated to encourage clean headings, short paragraphs, bullet points, and code blocks for snippets.
- **Verification**:
  - Frontend compiled in 549ms with 0 errors (`npm run build`).
  - Backend pytest suite passing (44/44 tests).

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
