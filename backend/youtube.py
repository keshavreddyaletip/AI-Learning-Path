import os
import math
from datetime import datetime, timezone
from dotenv import load_dotenv
import requests

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
if not YOUTUBE_API_KEY:
    raise RuntimeError("YOUTUBE_API_KEY is missing in backend/.env")

BASE = "https://www.googleapis.com/youtube/v3"

def _search(topic: str, profile: dict):
    level = profile.get("experience", "Beginner")
    query = f"{topic} {level} tutorial"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 8,
        "order": "relevance",
        "key": YOUTUBE_API_KEY,
    }
    r = requests.get(f"{BASE}/search", params=params, timeout=20)
    r.raise_for_status()
    return r.json().get("items", [])

def _details(ids):
    if not ids:
        return {}
    params = {
        "part": "snippet,statistics,contentDetails",
        "id": ",".join(ids),
        "key": YOUTUBE_API_KEY,
    }
    r = requests.get(f"{BASE}/videos", params=params, timeout=20)
    r.raise_for_status()
    return {x["id"]: x for x in r.json().get("items", [])}

def _comments(video_id):
    try:
        params = {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": 20,
            "order": "relevance",
            "textFormat": "plainText",
            "key": YOUTUBE_API_KEY,
        }
        r = requests.get(f"{BASE}/commentThreads", params=params, timeout=20)
        if r.status_code != 200:
            return []
        return [
            x["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            for x in r.json().get("items", [])
        ]
    except requests.RequestException:
        return []

def _engagement_score(stats):
    views = int(stats.get("viewCount", 0))
    likes = int(stats.get("likeCount", 0))
    comments = int(stats.get("commentCount", 0))
    if views <= 0:
        return 0
    like_ratio = min(likes / views * 1000, 100)
    comment_ratio = min(comments / views * 10000, 100)
    return round(0.65 * like_ratio + 0.35 * comment_ratio, 2)

def recommend_video(topic: str, profile: dict):
    candidates = _search(topic, profile)
    ids = [x["id"]["videoId"] for x in candidates]
    details = _details(ids)

    ranked = []
    for item in candidates:
        vid = item["id"]["videoId"]
        detail = details.get(vid, {})
        stats = detail.get("statistics", {})
        comments = _comments(vid)

        title = item["snippet"]["title"]
        description = item["snippet"].get("description", "")
        text = f"{title} {description}".lower()

        relevance = 100 if topic.lower() in text else 65
        engagement = _engagement_score(stats)
        comment_bonus = 10 if comments else 0

        score = round(0.55 * relevance + 0.35 * engagement + 0.10 * comment_bonus, 2)

        ranked.append({
            "video_id": vid,
            "title": title,
            "channel": item["snippet"]["channelTitle"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "url": f"https://www.youtube.com/watch?v={vid}",
            "views": int(stats.get("viewCount", 0)),
            "likes": int(stats.get("likeCount", 0)),
            "comments": int(stats.get("commentCount", 0)),
            "score": score,
            "feedback_sample": comments[:5],
        })

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return {
        "topic": topic,
        "recommended": ranked[0] if ranked else None,
        "alternatives": ranked[1:4],
        "ranking_note": "Ranking combines topic relevance, engagement signals and availability of learner comments. Comment sentiment can be added through the AI key in the next iteration."
    }
