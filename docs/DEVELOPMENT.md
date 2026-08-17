# Development & Setup Guide

## 1. Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+ & npm
- **API Keys**:
  - Groq API Key (Primary LLM provider)
  - GitHub Personal Access Token (for GitHub MCP)
  - Google Cloud OAuth2 `credentials.json` (for Google Workspace MCP)

---

## 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Run Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 4. Running Backend Tests

The test suite includes 42 automated tests covering agent graph execution, LTM extraction, MCP tools, and HITL interrupts:

```bash
cd backend
.venv\Scripts\pytest -v
```

---

## 5. Environment Variables Reference (`backend/.env`)

```ini
# Primary LLM Configuration
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b

# GitHub MCP Integration
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...

# Google Workspace Integration
# Placed in backend/data/google_workspace/credentials.json & token.json

# Server Settings
HOST=127.0.0.1
PORT=8000
DEBUG=True
FRONTEND_URL=http://localhost:5173

# Observability (Optional)
LANGCHAIN_TRACING_V2=False
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=agentic-rag-chatbot
```
