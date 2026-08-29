import os
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from ai import generate_roadmap, generate_quiz
from youtube import recommend_video

load_dotenv()

app = FastAPI(title="AI Personalized Learning Path", version="2.0.0")

# Comma-separated origins make local + production deployment easy to configure.
DEFAULT_ORIGINS = "http://localhost:5173,https://ai-learning-path-inky.vercel.app"
FRONTEND_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
)


class LearnerProfile(BaseModel):
    goal: str = Field(min_length=2, max_length=300)
    skills: List[str] = Field(default_factory=list)
    experience: str = "Beginner"
    hours_per_week: int = Field(default=5, ge=1, le=80)
    interests: List[str] = Field(default_factory=list)


class TopicRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=300)
    profile: LearnerProfile


class QuizRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=300)
    profile: LearnerProfile
    count: int = Field(default=5, ge=3, le=10)


@app.get("/")
def root():
    return {"message": "AI Learning Path API is running", "version": "2.0.0"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": bool(os.getenv("AI_API_KEY")),
        "youtube_configured": bool(os.getenv("YOUTUBE_API_KEY")),
        "model": os.getenv("AI_MODEL", "gemini-3.6-flash"),
    }


@app.post("/roadmap")
def roadmap(profile: LearnerProfile):
    try:
        return generate_roadmap(profile.model_dump())
    except Exception as exc:
        print(f"/roadmap error: {exc}")
        raise HTTPException(status_code=502, detail="AI roadmap generation failed. Check backend configuration and provider logs.")


@app.post("/youtube")
def youtube(req: TopicRequest):
    try:
        return recommend_video(req.topic, req.profile.model_dump())
    except Exception as exc:
        print(f"/youtube error: {exc}")
        raise HTTPException(status_code=502, detail="YouTube resource lookup failed. Check the YouTube API key/quota.")


@app.post("/quiz")
def quiz(req: QuizRequest):
    try:
        return generate_quiz(req.topic, req.profile.model_dump(), req.count)
    except Exception as exc:
        print(f"/quiz error: {exc}")
        raise HTTPException(status_code=502, detail="AI quiz generation failed. Check backend configuration and provider logs.")
