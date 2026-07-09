# AI Code Debugger — Production Chatbot

A full-stack, production-ready AI chatbot with a ChatGPT-style interface.

## Architecture

```
User
 ↓
Frontend (Next.js + Tailwind CSS)      → http://localhost:3000
 ↓
Backend API (FastAPI + Python)          → http://localhost:8000
 ↓
LLM Router
 ├── Google Gemini (primary, free tier)
 ├── OpenAI GPT (optional fallback)
 └── Claude (optional)
```

## Quick Start

### 1. Get a Gemini API Key (FREE)

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### 2. Start the Backend

```bash
cd ai-chatbot/backend

# Add your API key to .env
# Edit .env and replace YOUR_GEMINI_API_KEY_HERE with your actual key

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

### 3. Start the Frontend

```bash
cd ai-chatbot/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be at http://localhost:3000

### 4. Test the API

```bash
cd ai-chatbot/backend
python tests/test_api.py
```

## API Endpoints

| Method | Endpoint      | Description              |
|--------|--------------|--------------------------|
| GET    | /api/health  | Health check             |
| GET    | /api/models  | List available models    |
| GET    | /api/status  | Server status & metrics  |
| POST   | /api/chat    | Send message to AI       |

### Chat Request Example

```json
POST /api/chat
{
  "message": "Debug this: for i in range(5) print(i)",
  "conversation_id": null,
  "model": null,
  "temperature": 0.7,
  "max_tokens": 4096
}
```

## Project Structure

```
ai-chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment config
│   │   ├── routes/
│   │   │   ├── chat.py          # /api/chat endpoint
│   │   │   └── system.py        # /api/health, /models, /status
│   │   ├── services/
│   │   │   ├── llm_service.py   # LLM providers + router
│   │   │   └── conversation.py  # Chat history manager
│   │   └── models/
│   │       └── schemas.py       # Pydantic schemas
│   ├── tests/
│   │   └── test_api.py          # API test script
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Main chat page
│   │   │   └── globals.css      # Global styles
│   │   ├── components/
│   │   │   ├── ChatMessage.tsx   # Message bubble
│   │   │   ├── ChatInput.tsx     # Input box
│   │   │   ├── LoadingDots.tsx   # Loading animation
│   │   │   └── Sidebar.tsx       # Conversation sidebar
│   │   └── lib/
│   │       └── api.ts           # API client
│   ├── package.json
│   ├── Dockerfile
│   └── tailwind.config.js
└── README.md
```

## Switching LLM Providers

Edit `backend/.env`:

```bash
# Use Gemini (default, free)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Use OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key

# Both configured → Gemini primary, OpenAI fallback
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

## Deployment

### Backend → Render / Railway
1. Push to GitHub
2. Connect repo to Render
3. Set environment variables
4. Deploy

### Frontend → Vercel
1. Push to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_API_URL` to your backend URL
4. Deploy

### Docker
```bash
# Backend
cd backend
docker build -t chatbot-backend .
docker run -p 8000:8000 --env-file .env chatbot-backend

# Frontend
cd frontend
docker build -t chatbot-frontend .
docker run -p 3000:3000 chatbot-frontend
```
