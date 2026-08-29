# Deployment Checklist

## Local
- [ ] Python venv activated
- [ ] `pip install -r backend/requirements.txt`
- [ ] backend `.env` configured
- [ ] `uvicorn main:app --reload`
- [ ] `/health` returns status ok
- [ ] frontend `npm install`
- [ ] `npm run dev`
- [ ] `VITE_API_URL` points to localhost:8000
- [ ] roadmap works
- [ ] YouTube recommendation works
- [ ] quiz works
- [ ] passing quiz marks topic complete
- [ ] refreshing browser preserves progress

## Render
- [ ] Root directory = `backend`
- [ ] Build = `pip install -r requirements.txt`
- [ ] Start = `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] AI_API_KEY set
- [ ] YOUTUBE_API_KEY set
- [ ] AI_MODEL set to a supported model
- [ ] FRONTEND_ORIGINS contains exact Vercel production origin
- [ ] `/health` works

## Vercel
- [ ] Root directory = `frontend`
- [ ] `VITE_API_URL` = Render backend URL
- [ ] Build = `npm run build`
- [ ] Output = `dist`
- [ ] Production URL added to Render FRONTEND_ORIGINS
- [ ] End-to-end test completed
