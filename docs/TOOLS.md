# Tool Registry & Tool Specifications

## 1. Tool Types & Classification

The chatbot supports 3 categories of tools unified into a single `ToolRegistry`:
- **`[builtin]`**: Native Python developer, research, and sensitive tools.
- **`[mcp]`**: Dynamic tools exposed via Model Context Protocol servers.
- **`[rag]`**: Vector search knowledge base retrieval tools.

---

## 2. Complete Tools Inventory

| Tool Name | Type | Purpose | Side Effect | HITL Required? |
|---|---|---|---|---|
| `send_email_action` | `builtin` | Send an email with subject and body | YES | **YES (Mandatory)** |
| `execute_database_mutation` | `builtin` | Execute SQL INSERT/UPDATE/DELETE/DROP | YES | **YES (Mandatory)** |
| `code_evaluator` | `builtin` | Execute Python code in sandbox | NO | No |
| `command_runner` | `builtin` | Run terminal commands | YES | Protected |
| `filesystem_inspector` | `builtin` | Inspect workspace files & directories | NO | No |
| `web_search` | `builtin` | Search the web for current data | NO | No |
| `fetch_web_page` | `builtin` | Scrape and extract text from URLs | NO | No |
| `sql_inspector` | `builtin` | Run read-only SELECT queries | NO | No |
| `tech_docs_search` | `builtin` | Search developer documentation | NO | No |
| `search_knowledge_base` | `rag` | Retrieve context from uploaded PDFs | NO | No |
| `gdrive_search_files` | `mcp` | Search files in Google Drive | NO | No |
| `gdrive_read_file` | `mcp` | Read Google Drive file content | NO | No |
| `gdrive_list_files` | `mcp` | List all files in Google Drive | NO | No |
| `gmail_search_emails` | `mcp` | Search Gmail messages & threads | NO | No |
| `gmail_read_thread` | `mcp` | Read email thread content | NO | No |
| `gmail_send_email` | `mcp` | Send email via Gmail | YES | Configurable |
| `gcalendar_list_events` | `mcp` | List Google Calendar events | NO | No |
| `gcalendar_create_event` | `mcp` | Schedule event on Google Calendar | YES | Optional |
| `github_get_my_user_profile`| `mcp` | View authenticated GitHub profile | NO | No |
| `github_get_my_repos` | `mcp` | List user's GitHub repositories | NO | No |
| `github_get_latest_push` | `mcp` | Get latest push / commit | NO | No |
| `github_get_repo` | `mcp` | Inspect repository details & stars | NO | No |
| `github_search_issues` | `mcp` | Search repository issues & PRs | NO | No |
| `github_list_commits` | `mcp` | List commit history | NO | No |
| `github_get_file_content` | `mcp` | Read code file from repository | NO | No |

---

## 3. Tool Permissions & Dynamic Toggling

Users can enable or disable any registered tool on-the-fly via the **Tools Modal** in the UI:
- `GET /api/tools`: Returns all available tools with schemas, descriptions, and categories.
- Chat requests accept `disabled_tools: list[str]`.
- `chat_node` dynamically binds only `active_tools = [t for t in all_tools if t.name not in disabled_tools]`.
