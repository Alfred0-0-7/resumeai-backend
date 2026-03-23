import json
import re
from groq import AsyncGroq
from app.config import get_settings
from app.models.analysis import AnalysisResult

settings = get_settings()
_client = AsyncGroq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """You are an expert resume analyst and career coach.
Analyze the provided resume text and return a detailed JSON analysis.
Your response MUST be valid JSON only — no markdown fences, no explanation.

Return exactly this structure:
{
  "name": "Full Name or 'Unknown'",
  "email": "email@example.com or ''",
  "phone": "+1-234-567-8900 or ''",
  "skills": ["Python", "FastAPI", "React"],
  "education": "Concise education summary",
  "experience": "Concise experience summary",
  "score": {
    "total_score": 0,
    "breakdown": {
      "contact_info": {"score": 0, "max": 15},
      "skills":       {"score": 0, "max": 25},
      "experience":   {"score": 0, "max": 30},
      "education":    {"score": 0, "max": 20},
      "quality":      {"score": 0, "max": 10}
    }
  },
  "suggestions": [
    {
      "category": "Category Name",
      "priority": "high",
      "icon": "💡",
      "message": "Specific actionable advice."
    }
  ],
  "job_matches": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "salary": "₹X LPA - ₹Y LPA",
      "match_percentage": 80,
      "matched_skills": ["skill1", "skill2"],
      "missing_skills": ["skill3"]
    }
  ]
}

Rules:
- Extract ALL skills mentioned.
- Score honestly.
- Provide 3-5 specific suggestions.
- Generate 3-5 realistic job matches.
- total_score must equal sum of all breakdown scores.
- Always show salary in Indian Rupees format like '₹8 LPA - ₹12 LPA'.
- JSON only, no extra text."""


async def analyze_resume(resume_text: str, filename: str) -> AnalysisResult:
    user_msg = f"Resume filename: {filename}\n\n---RESUME TEXT---\n{resume_text[:12000]}"

    response = await _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        max_tokens=2500,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = _parse_json(raw)
    data["filename"] = filename
    return AnalysisResult(**data)


def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {e}")