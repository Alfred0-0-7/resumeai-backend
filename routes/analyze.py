"""
POST /api/analyze
Accepts a PDF upload, extracts text, runs OpenAI analysis,
persists to MongoDB, and returns the structured result.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import get_settings
from app.database import analyses_collection
from app.services.pdf_parser import extract_text
from app.services.openai_analyzer import analyze_resume
from app.models.analysis import AnalysisResult
import datetime

router = APIRouter()
settings = get_settings()

MAX_BYTES = settings.max_upload_size_mb * 1024 * 1024


@router.post(
    "/analyze",
    response_model=AnalysisResult,
    summary="Analyze a resume PDF",
    status_code=status.HTTP_200_OK,
)
async def analyze(resume: UploadFile = File(..., description="PDF resume file")):
    # ── Validate file type ─────────────────────────────────────
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    # ── Read & size-check ──────────────────────────────────────
    pdf_bytes = await resume.read()
    if len(pdf_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB.",
        )

    # ── Extract text ───────────────────────────────────────────
    try:
        resume_text = extract_text(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    # ── OpenAI analysis ────────────────────────────────────────
    try:
        result = await analyze_resume(resume_text, resume.filename)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI analysis failed: {str(e)}",
        )

    # ── Persist to MongoDB ─────────────────────────────────────
    doc = {
        "timestamp": datetime.datetime.utcnow(),
        "data": result.model_dump(),
    }
    collection = analyses_collection()
    insert_result = await collection.insert_one(doc)
    result_dict = result.model_dump()
    result_dict["_id"] = str(insert_result.inserted_id)

    return result
