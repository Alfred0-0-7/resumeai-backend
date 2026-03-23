"""
History routes:
  GET    /api/history              – paginated list of past analyses
  GET    /api/history/{id}         – single analysis by MongoDB _id
  DELETE /api/history/{id}         – delete one entry
  DELETE /api/history              – clear all history
"""
from fastapi import APIRouter, HTTPException, status, Query
from bson import ObjectId
from bson.errors import InvalidId
from app.database import analyses_collection
from app.models.analysis import HistoryItem, HistoryListResponse, AnalysisResult

router = APIRouter()


def _oid(id_str: str) -> ObjectId:
    """Convert string to ObjectId or raise 400."""
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ID format: {id_str}",
        )


def _to_history_item(doc: dict) -> HistoryItem:
    data = doc.get("data", {})
    return HistoryItem(
        id=str(doc["_id"]),
        timestamp=doc["timestamp"],
        filename=data.get("filename", "resume.pdf"),
        name=data.get("name", "Unknown"),
        total_score=data.get("score", {}).get("total_score", 0),
        skill_count=len(data.get("skills", [])),
        job_match_count=len(data.get("job_matches", [])),
    )


# ── GET /api/history ───────────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=HistoryListResponse,
    summary="List all past analyses",
)
async def list_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    col = analyses_collection()
    skip = (page - 1) * limit
    total = await col.count_documents({})
    cursor = col.find({}, {"data.skills": 1, "data.name": 1, "data.filename": 1,
                           "data.score": 1, "data.job_matches": 1, "timestamp": 1})\
                .sort("timestamp", -1)\
                .skip(skip)\
                .limit(limit)
    docs = await cursor.to_list(length=limit)
    items = [_to_history_item(d) for d in docs]
    return HistoryListResponse(items=items, total=total)


# ── GET /api/history/{id} ──────────────────────────────────────────────────

@router.get(
    "/history/{id}",
    summary="Get a single analysis by ID",
)
async def get_analysis(id: str):
    col = analyses_collection()
    doc = await col.find_one({"_id": _oid(id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")
    result = doc["data"]
    result["_id"] = str(doc["_id"])
    result["timestamp"] = doc["timestamp"].isoformat()
    return result


# ── DELETE /api/history/{id} ───────────────────────────────────────────────

@router.delete(
    "/history/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a single analysis",
)
async def delete_analysis(id: str):
    col = analyses_collection()
    result = await col.delete_one({"_id": _oid(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")


# ── DELETE /api/history ────────────────────────────────────────────────────

@router.delete(
    "/history",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear all history",
)
async def clear_history():
    col = analyses_collection()
    await col.delete_many({})
