# Vercel Deployment & SPA Routing

This document explains the Vercel deployment configuration for the **Nexus AI** frontend.

---

## 1. Project Root & Build Configuration

- **Framework Preset**: Vite / React
- **Root Directory**: `frontend` (or project root if monorepo configuration is used)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: `20.x` or `22.x`

---

## 2. Authoritative `vercel.json`

Located at [`frontend/vercel.json`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/frontend/vercel.json):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Why this rule is critical:
React Router uses browser History API routes (`/signup`, `/login`, `/chat`, `/profile`, `/settings`, etc.). Without this rewrite, direct browser visits or page refreshes on subroutes will return an HTTP 404 from Vercel's static asset router.

---

## 3. Environment Variables on Vercel

Under **Project Settings $\to$ Environment Variables**, configure:

- `VITE_API_URL`: The public base URL of the deployed FastAPI backend (e.g. `https://nexus-ai-backend.onrender.com` or `https://nexus-ai.up.railway.app`).

When `VITE_API_URL` is set, [`frontend/src/services/api.ts`](file:///c:/Users/PC-ACER/Documents/DeepLearning/ChatGpt/frontend/src/services/api.ts) automatically dispatches all authentication, chat streaming, and thread management requests to the live backend.
