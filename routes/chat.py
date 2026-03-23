from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import AsyncGroq
from app.config import get_settings

router = APIRouter()
settings = get_settings()
_client = AsyncGroq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """You are an expert AI Career Advisor specializing in the Indian job market.
You help people with:
- Resume writing and improvement tips
- Career path guidance
- Interview preparation
- Job search strategies
- Salary negotiation (in Indian Rupees - LPA format)
- Skills to learn for specific roles
- Tech industry advice in India

Be friendly, encouraging, specific and practical.
Keep responses concise but helpful — use bullet points when listing things.
Always relate salary info to Indian market (LPA format).
"""

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = await _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *[{"role": m.role, "content": m.content} for m in request.messages[-10:]]
            ],
            temperature=0.7,
            max_tokens=800,
        )
        reply = response.choices[0].message.content
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))