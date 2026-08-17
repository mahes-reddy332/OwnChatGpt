# Frontend Architecture & Component Guide

## 1. Technology Stack

- **Framework**: React 19 (`react` 19.2.8, `react-dom` 19.2.8)
- **Language**: TypeScript (`~6.0.2`)
- **Build Tool**: Vite (`vite` 8.2.0, `@vitejs/plugin-react` 6.0.4)
- **Styling**: TailwindCSS v4 (`tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3)
- **Icons**: Lucide React (`lucide-react` 1.31.0)
- **Linter**: Oxlint (`oxlint` 1.75.0)

---

## 2. Component Hierarchy

```text
App.tsx (Main Layout & State Orchestration)
  ├── Sidebar (Thread list, new chat button, server status)
  ├── Header (Active thread title, model selector badge, modal triggers)
  ├── ChatArea (Main scrollable message viewport)
  │     ├── MessageItem (User / Assistant messages with markdown formatting)
  │     ├── ToolExecutionCard (Live status, arguments, execution duration, result dropdown)
  │     ├── HitlApprovalCard (Interactive approval modal for sensitive actions)
  │     └── RagCitationPills (Source document chips with page numbers)
  ├── InputBar (Text input, file attachment button, tool toggles, submit button)
  └── Modals:
        ├── KnowledgeBaseModal (Document upload, ChromaDB collection viewer)
        ├── ToolsModal (Toggle individual tools on/off)
        ├── McpServersModal (Manage MCP server connections and stdio scripts)
        └── MemoryModal (View, edit, delete, reconcile user LTM facts)
```

---

## 3. Key Custom Hooks & State Management

### `useChat` Hook
Manages the real-time chat lifecycle, SSE streams, active thread state, and interrupts:
- **`messages`**: Chronological list of turns (`role`, `content`, `toolCalls`, `hitlInterrupt`, `sources`).
- **`sendMessage(content)`**: Dispatches `POST /api/chat/stream`, opens SSE stream reader, and incrementally appends tokens.
- **`resolveHitlInterrupt(interruptId, decision, modifiedArgs)`**: Dispatches `POST /api/chat/resume/stream` to continue paused execution.
- **`activeThreadId`**: Current conversation thread UUID.

---

## 4. HITL Approval Component (`HitlApprovalCard`)

When the backend emits `hitl_interrupt`, the UI renders an interactive approval card:
- Displays target tool name (e.g. `send_email_action`, `execute_database_mutation`).
- Previews the action payload (recipient, subject, SQL mutation).
- Provides three actions:
  - **Approve**: Resumes execution immediately.
  - **Decline**: Aborts the action and informs the agent.
  - **Edit & Approve**: Allows the user to edit parameters before dispatching.
