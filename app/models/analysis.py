from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from bson import ObjectId


# ── Helpers ────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.utcnow()


# ── Score Models ───────────────────────────────────────────────────────────

class ScoreCategory(BaseModel):
    score: int
    max: int


class ScoreBreakdown(BaseModel):
    contact_info: ScoreCategory
    skills: ScoreCategory
    experience: ScoreCategory
    education: ScoreCategory
    quality: ScoreCategory


class Score(BaseModel):
    total_score: int
    breakdown: ScoreBreakdown


# ── Suggestion ─────────────────────────────────────────────────────────────

class Suggestion(BaseModel):
    category: str
    priority: str            # high | medium | low
    icon: str
    message: str


# ── Job Match ──────────────────────────────────────────────────────────────

class JobMatch(BaseModel):
    title: str
    company: str
    location: str
    salary: str
    match_percentage: int
    matched_skills: list[str]
    missing_skills: list[str]


# ── Full Analysis Result ───────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    filename: str
    name: str
    email: str
    phone: str
    skills: list[str]
    education: str
    experience: str
    score: Score
    suggestions: list[Suggestion]
    job_matches: list[JobMatch]


# ── DB Document ───────────────────────────────────────────────────────────

class AnalysisDocument(BaseModel):
    """Stored in MongoDB."""
    id: str | None = Field(default=None, alias="_id")
    timestamp: datetime = Field(default_factory=_now)
    data: dict[str, Any]          # raw AnalysisResult as dict

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


# ── API Response for History ───────────────────────────────────────────────

class HistoryItem(BaseModel):
    id: str
    timestamp: datetime
    filename: str
    name: str
    total_score: int
    skill_count: int
    job_match_count: int


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    total: int
