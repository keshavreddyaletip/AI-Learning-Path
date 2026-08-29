import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("AI_API_KEY")
if not API_KEY:
    raise RuntimeError("AI_API_KEY is missing in backend/.env")

MODEL = os.getenv("AI_MODEL", "gemini-3.6-flash")
client = genai.Client(api_key=API_KEY)


def _extract_json(text: str) -> Any:
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.I)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _ask(prompt: str) -> Any:
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    if not response.text:
        raise RuntimeError("Gemini returned an empty response")
    return _extract_json(response.text)


def generate_roadmap(profile: dict) -> dict:
    prompt = f"""
You are an expert personalized learning-path planner.

Learner profile:
{json.dumps(profile, indent=2)}

Create a practical roadmap for this learner. Use the learner's existing skills,
experience level, interests, and available weekly time. Do not repeat skills the
learner already knows unless they are required prerequisites.

Return ONLY valid JSON in this exact shape:
{{
  "goal": "string",
  "summary": "short explanation",
  "roadmap": [
    {{
      "step": 1,
      "title": "string",
      "description": "string",
      "why": "why this is recommended for this learner",
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimated_hours": 5,
      "prerequisites": [],
      "milestone": "string"
    }}
  ]
}}

Generate 5 to 8 ordered steps. Make the sequence realistic and personalized.
"""
    data = _ask(prompt)
    if not isinstance(data, dict) or not isinstance(data.get("roadmap"), list):
        raise RuntimeError("Gemini returned an invalid roadmap structure")
    return data


def generate_quiz(topic: str, profile: dict, count: int = 5) -> dict:
    count = max(3, min(count, 10))
    prompt = f"""
Create an objective learning quiz for:
Topic: {topic}
Learner profile:
{json.dumps(profile, indent=2)}

Generate exactly {count} single-answer multiple-choice questions.
Return ONLY valid JSON:
{{
  "topic": "{topic}",
  "questions": [
    {{
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "short explanation"
    }}
  ]
}}

The answer field is the zero-based index of the correct option.
Questions must be appropriate for the learner's level and test understanding,
not just memorization.
"""
    data = _ask(prompt)
    questions = data.get("questions") if isinstance(data, dict) else None
    if not isinstance(questions, list) or len(questions) != count:
        raise RuntimeError("Gemini returned an invalid quiz structure")
    return data
