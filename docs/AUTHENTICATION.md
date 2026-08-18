# Authentication & Session Security Architecture

This document describes the authentication system, session lifecycle, CSRF defense, and cross-origin cookie security for **Nexus AI**.

---

## 1. Authentication Architecture

Nexus AI uses a high-security, database-backed **opaque session token** model:

```mermaid
sequenceDiagram
    autonumber
    participant Browser as React Frontend (Vercel)
    participant FastAPI as FastAPI Backend (Render)
    participant PostgreSQL as PostgreSQL (Render)

    Note over Browser,FastAPI: Signup / Login (CSRF-Exempt Bootstrap)
    Browser->>FastAPI: POST /api/auth/signup (email, password, display_name)
    FastAPI->>FastAPI: Hash password (bcrypt rounds=12)
    FastAPI->>PostgreSQL: INSERT into users & user_preferences
    FastAPI->>FastAPI: Generate 32-byte opaque token & SHA-256 hash
    FastAPI->>PostgreSQL: INSERT into sessions (user_id, token_hash, expires_at)
    FastAPI-->>Browser: Set-Cookie: nexus_session=...; HttpOnly; Secure; SameSite=None<br/>Set-Cookie: nexus_csrf=...; Secure; SameSite=None
    Browser-->>Browser: Store User info in React AuthContext

    Note over Browser,FastAPI: Authenticated Request (e.g. Chat, Threads)
    Browser->>FastAPI: POST /api/chat (credentials: 'include', X-CSRF-Token: ...)
    FastAPI->>FastAPI: Hash cookie token & validate against DB
    FastAPI->>PostgreSQL: SELECT * FROM sessions WHERE token_hash = ...
    FastAPI-->>Browser: Response Stream
```

---

## 2. Session Lifecycle & Security Policies

1. **Opaque Tokens**:
   - 32-byte cryptographically secure URL-safe tokens generated via `secrets.token_urlsafe(32)`.
   - The raw token is stored exclusively in an `HttpOnly` cookie in the user's browser.
   - The database stores only the `SHA-256` hash of the token (`token_hash`), preventing session hijacking if the database is ever compromised.

2. **Expiration Policy**:
   - **Absolute Lifetime**: 7 days (`AUTH_SESSION_MAX_DAYS = 7`). Hard cutoff requiring re-authentication.
   - **Idle Inactivity Timeout**: 30 minutes (`AUTH_IDLE_TIMEOUT_MINUTES = 30`). Throttled DB touch every 60 seconds on user activity.

3. **Cross-Origin Cookie Configuration**:
   When the frontend is deployed on **Vercel** (`https://nexus-nine-flax-34.vercel.app`) and the backend on **Render** (`https://ownchatgpt-mo8j.onrender.com`):
   - `AUTH_COOKIE_SECURE=True`: Mandatory HTTPS transmission.
   - `AUTH_COOKIE_SAMESITE=none`: Mandatory for cross-site cookie transmission with `credentials: 'include'`.

4. **Double-Submit Anti-CSRF**:
   - A random 24-byte anti-CSRF token is set in the readable `nexus_csrf` cookie on login/signup.
   - For mutating actions (`POST`, `PUT`, `DELETE`, `PATCH`), the frontend reads `nexus_csrf` and sends it in the `X-CSRF-Token` request header.
   - Bootstrap endpoints (`/api/auth/signup`, `/api/auth/login`, `/api/auth/forgot-password`) are exempt.

---

## 3. Database URL Auto-Normalization

Cloud hosting providers (Render, Heroku, Railway) inject `DATABASE_URL` with `postgres://` or `postgresql://`.
SQLAlchemy AsyncIO strictly requires the `postgresql+asyncpg://` dialect.

The backend automatically normalizes the URL in [`backend/app/database/session.py`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/backend/app/database/session.py):
```python
def get_normalized_database_url(raw_url: str) -> str:
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return raw_url
```
