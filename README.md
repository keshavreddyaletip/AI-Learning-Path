# AI Learning Path — Extended Submission

> **Don't give learners more resources. Give them a direction.**

AI Learning Path turns a learner's goal and profile into a structured learning journey, finds a ranked real-world learning resource, and checks understanding through an AI-generated assessment.

## Product flow

**Goal → Profile → AI Roadmap → Ranked Resource → Quiz → Score → Progress**

## What is included in this extended version

- Personalized AI roadmap with ordered steps, rationale, prerequisites, estimated hours and milestones.
- YouTube resource discovery using learner level + topic.
- Transparent recommendation score based on topic relevance, engagement and comment availability.
- Learner feedback samples from YouTube comments.
- AI-generated 5-question assessment.
- 70% pass threshold for topic completion.
- Browser-local progress persistence using `localStorage`.
- Learning snapshot showing completed topics, progress and topics needing review.
- Explainable recommendation card.
- Health endpoint for deployment checks.
- Environment-driven CORS and API URL configuration.
- Render deployment configuration (`render.yaml`).
- Vercel frontend configuration (`frontend/vercel.json`).

## Tech stack

- Frontend: React + Vite
- Backend: FastAPI + Python
- AI: Google Gemini via `google-genai`
- Resource data: YouTube Data API v3
- Frontend hosting: Vercel
- Backend hosting: Render

## 1. Local setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Gemini API key
- YouTube Data API key

### Backend

Open terminal 1:

```bash
cd backend
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

macOS/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env` from `.env.example` and configure:

```env
AI_API_KEY=your_key
YOUTUBE_API_KEY=your_key
AI_MODEL=gemini-3.6-flash
FRONTEND_ORIGINS=http://localhost:5173,https://ai-learning-path-inky.vercel.app
```

Run:

```bash
uvicorn main:app --reload
```

Backend: `http://localhost:8000`

Health check: `http://localhost:8000/health`

### Frontend

Open terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

The frontend defaults to `http://localhost:8000`. To override it, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## 2. Production deployment

### Backend — Render

Create a new Render Web Service from this repository.

Recommended settings:

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Environment variables:

```text
AI_API_KEY=<Gemini key>
YOUTUBE_API_KEY=<YouTube key>
AI_MODEL=gemini-3.6-flash
FRONTEND_ORIGINS=https://ai-learning-path-inky.vercel.app
```

After deployment, open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

It should return JSON with `status: "ok"`.

### Frontend — Vercel

Import the repository into Vercel.

Set the project root to `frontend`.

Environment variable:

```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Deploy. Then make sure the exact Vercel production origin is present in the backend `FRONTEND_ORIGINS` value.

## 3. CORS troubleshooting

If the browser reports a preflight/CORS error:

1. Open DevTools → Network.
2. Find the `OPTIONS` request.
3. Check the `Origin` request header.
4. Make sure that exact origin is listed in `FRONTEND_ORIGINS` on Render.
5. Redeploy the backend after changing the environment variable.
6. Retry the actual `POST /roadmap` request.

Do not use `*` as a production shortcut when an explicit origin list is available.

## 4. Gemini model note

The original submission contained `gemini-2.5-flash`. The extended version uses `gemini-3.6-flash` as the default environment value because the deployment issue involved the old model identifier. Always verify the selected model is enabled for the API account before deployment.

## 5. Security

- Never commit `.env`.
- Never put Gemini or YouTube API keys in frontend source.
- Keep provider keys in Render environment variables.
- `VITE_API_URL` is safe to expose because it is only the backend URL, not a secret.

## 6. Standout behavior

A topic becomes completed only after a quiz score of at least 70%.

Example:

```text
Topic → Learn → Quiz → 80% → Completed ✓
Topic → Learn → Quiz → 40% → Needs review
```

Progress is stored locally in the browser so it survives refreshes without requiring a database.

## 7. Honest scope

This version is assessment-aware, not a full persistent adaptive-learning platform. Quiz results affect local progress and recommendations shown in the UI; they do not automatically rewrite the AI roadmap. A future version could persist learner history and use weak topics to regenerate the next step.
