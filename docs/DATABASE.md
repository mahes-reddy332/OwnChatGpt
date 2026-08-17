# Database Architecture & Migration Guide

## 1. Overview & Dual-Engine Configuration

Nexus AI supports two database persistence engines through SQLAlchemy 2.0 and Alembic:

- **Development Engine**: Async SQLite (`sqlite+aiosqlite:///./data/nexus_ai.db`) for lightweight zero-dependency local execution.
- **Production Engine**: PostgreSQL (`postgresql+asyncpg://user:password@host:5432/nexus_ai`) for scalable high-concurrency production deployments.

The engine is controlled via the `DATABASE_URL` environment variable in `backend/.env`.

---

## 2. Relational Schemas

### 2.1 `users` Table
Stores registered accounts with Bcrypt password hashes.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PRIMARY KEY | User UUID |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL, INDEX | User login email (lowercase) |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Bcrypt hashed password (12 rounds) |
| `display_name` | `VARCHAR(100)` | NOT NULL | Display name |
| `avatar_url` | `VARCHAR(500)` | NULL | Optional custom avatar URL |
| `is_active` | `BOOLEAN` | DEFAULT TRUE, NOT NULL | Account active status |
| `created_at` | `DATETIME` | NOT NULL | Registration timestamp |
| `updated_at` | `DATETIME` | NOT NULL | Profile update timestamp |
| `last_login_at` | `DATETIME` | NULL | Last successful login |

---

### 2.2 `sessions` Table
Stores opaque session records indexed by SHA-256 token hash.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PRIMARY KEY | Session UUID |
| `user_id` | `VARCHAR(36)` | FOREIGN KEY (users.id), INDEX | Owning user |
| `token_hash` | `VARCHAR(64)` | UNIQUE, NOT NULL, INDEX | SHA-256 hash of the 32-byte session token |
| `created_at` | `DATETIME` | NOT NULL | Session creation timestamp |
| `last_activity_at` | `DATETIME` | NOT NULL | Last meaningful user action timestamp |
| `expires_at` | `DATETIME` | NOT NULL | Absolute expiration (created_at + 7 days) |
| `is_revoked` | `BOOLEAN` | DEFAULT FALSE, NOT NULL | Revocation flag |
| `user_agent` | `VARCHAR(500)` | NULL | Client browser & OS info |
| `ip_address` | `VARCHAR(45)` | NULL | Client IP address |

---

### 2.3 `user_preferences` Table
Stores personalized assistant behaviors and appearance settings.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `VARCHAR(36)` | PRIMARY KEY, FOREIGN KEY (users.id) | Owning user |
| `response_style` | `VARCHAR(50)` | DEFAULT 'balanced', NOT NULL | 'concise', 'balanced', 'detailed' |
| `custom_instructions`| `TEXT` | DEFAULT '', NOT NULL | System prompt custom rules |
| `theme` | `VARCHAR(20)` | DEFAULT 'dark', NOT NULL | 'dark', 'light', 'system' |
| `show_citations` | `BOOLEAN` | DEFAULT TRUE, NOT NULL | Toggle RAG citation pills |
| `show_tool_activity`| `BOOLEAN` | DEFAULT TRUE, NOT NULL | Toggle tool execution cards |
| `updated_at` | `DATETIME` | NOT NULL | Update timestamp |

---

## 3. Alembic Migrations

Migrations are stored in `backend/alembic/versions/`.

### Commands
```bash
cd backend

# Apply migrations
.venv\Scripts\alembic upgrade head

# Generate a new migration after schema changes
.venv\Scripts\alembic revision --autogenerate -m "describe change"

# Check migration status
.venv\Scripts\alembic current
```

---

## 4. Vector & In-Memory Stores

- **ChromaDB**: Persistent vector database stored at `backend/data/chroma_db/` for RAG document chunk embeddings.
- **InMemoryStore**: LangGraph base store managing long-term memories under user-scoped namespaces `("user", user_id, "memories")`.
- **MemorySaver Checkpointer**: In-memory state history checkpointer for LangGraph conversation thread state.
