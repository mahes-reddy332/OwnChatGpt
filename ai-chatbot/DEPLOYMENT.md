# Production Deployment Guide

## Overview

This AI chatbot has been architected for production deployment with:

- **Backend**: FastAPI + RAG (Retrieval Augmented Generation) with ChromaDB vector store
- **Frontend**: Next.js with NextAuth authentication
- **Database**: MongoDB for conversations + ChromaDB for vector embeddings
- **Cache**: Redis for rate limiting and session caching
- **LLM Providers**: Gemini (primary), OpenAI, Groq (fallback support)
- **Logging**: Structured JSON logging with file rotation

## Prerequisites

- Docker & Docker Compose (recommended) or Python 3.12+ + Node.js 20+
- MongoDB 7.0+
- At least one LLM API key (Gemini, OpenAI, or Groq)
- 2GB RAM minimum, 4GB recommended

## Quick Start (Docker Recommended)

### 1. Setup Environment Variables

```bash
cd ai-chatbot

# Create backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Create frontend environment
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local
```

Configure `.env` files:

```env
# backend/.env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here (optional)
GROQ_API_KEY=your_key_here (optional)
MONGODB_URI=mongodb://admin:password@localhost:27017/ai_chatbot
FRONTEND_URL=http://localhost:3001
```

```env
# frontend/.env.local
NEXTAUTH_SECRET=generate_random_secret_here
NEXTAUTH_URL=http://localhost:3001
```

### 2. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

Services will be available at:
- Backend API: http://localhost:8000
- Frontend: http://localhost:3001
- MongoDB: localhost:27017
- Redis: localhost:6379

### 3. Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend
curl http://localhost:3001
```

## Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations (if any)
python -m alembic upgrade head

# Start server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local

# Run development server
npm run dev

# For production build
npm run build
npm start
```

## Production Deployment

### Option 1: Render (Recommended for beginners)

#### Backend Deployment

1. Create Render account at render.com
2. Create new Web Service
3. Connect Your GitHub repo
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

5. Add environment variables from backend/.env

#### Frontend Deployment

1. Create new Web Service for frontend
2. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `frontend`
   - **Node Version**: 20

3. Add environment variables from frontend/.env.local
4. Set `NEXT_PUBLIC_API_URL` to your backend Render URL

### Option 2: Railway.app

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Option 3: AWS (ECS + ECR)

```bash
# Build and push Docker images
aws ecr create-repository --repository-name ai-chatbot-backend
aws ecr create-repository --repository-name ai-chatbot-frontend

# Build backend
docker build -f backend/Dockerfile -t ai-chatbot-backend:latest backend/
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag ai-chatbot-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/ai-chatbot-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/ai-chatbot-backend:latest

# Similar for frontend
```

### Option 4: DigitalOcean App Platform

1. Connect your GitHub repo
2. Add services:
   - **Backend**: Python, port 8000
   - **Frontend**: Node.js, port 3000
3. Add MongoDB service or use DigitalOcean's managed database
4. Configure environment variables
5. Deploy

## Database Setup

### MongoDB Atlas (Cloud)

1. Go to mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Get connection string
4. Update `MONGODB_URI` in backend/.env

### Local MongoDB

```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or install locally and run
mongod --dbpath /path/to/data
```

## Environment Configuration

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LLM_PROVIDER` | Primary LLM provider | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://...` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3001` |
| `LOG_LEVEL` | Logging level | `INFO` |

### Frontend Variables

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Session secret (generate with: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Frontend URL | 
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Production Checklist

- [ ] All API keys set in environment variables
- [ ] MongoDB configured and accessible
- [ ] Firewall/Security groups configured
- [ ] SSL/TLS certificates installed
- [ ] CORS settings properly configured
- [ ] Rate limiting enabled
- [ ] Logging configured to persistent storage
- [ ] Database backups configured
- [ ] Monitoring/alerting set up
- [ ] CDN configured for static assets (frontend)

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.yml update
backend:
  deploy:
    replicas: 3
  
frontend:
  deploy:
    replicas: 2
```

Use load balancer (Nginx, HAProxy) for multiple instances.

### Performance Tuning

1. **Vector DB**: Adjust ChromaDB batch size in `rag_service.py`
2. **LLM**: Use lighter models (Gemini Flash vs 1.5-pro) for latency
3. **Caching**: Enable Redis for frequent queries
4. **Compression**: Enable gzip for API responses

## Monitoring

### Logs

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Persistent logs in backend/logs/
tail -f backend/logs/app.log
```

### Health Checks

```bash
# Backend health
curl -s http://localhost:8000/health | jq .

# LLM Provider status
curl -s http://localhost:8000/api/models | jq .
```

### Metrics

Backend exposes JSON logs with execution time:

```json
{
  "timestamp": "2026-03-13T10:30:45Z",
  "level": "INFO",
  "message": "Chat completed",
  "conversation_id": "...",
  "tool": "search_documents",
  "duration_ms": 245,
  "tokens_used": 350
}
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Verify MongoDB connection
docker-compose logs mongodb

# Test LLM API key
python -c "from app.services.llm_service import llm_router; print(llm_router.health_check())"
```

### Frontend not connecting to backend

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running and accessible
- Check browser console for errors

### Slow responses

- Check MongoDB indexes
- Verify LLM API response times
- Monitor ChromaDB query performance
- Check system resources (CPU, memory)

### Out of memory

- Reduce `max_tokens` in prompts
- Clear old conversations: `db.conversations.deleteMany({last_message_at: {$lt: date}})`
- Enable Redis caching

## Updating

```bash
# Pull latest code
git pull origin main

# Rebuild Docker images
docker-compose build

# Restart services with new code
docker-compose down
docker-compose up -d
```

## Backup

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /backup

# Backup ChromaDB vectors
docker cp ai-chatbot-chroma:/app/data/vectors ./backups/vectors
```

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables are set
3. Test LLM API keys individually
4. Check system resources
5. Review GitHub issues

## License

[Your License Here]
