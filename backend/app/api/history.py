import logging
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from pydantic import BaseModel

from app.models.base import get_db
from app.models.query_history import QueryHistory

logger = logging.getLogger(__name__)
router = APIRouter()


class HistoryItem(BaseModel):
    id: str
    question: str
    answer: str
    confidence: int
    sources: list
    equipment_tags: list
    timestamp: str
    session_id: Optional[str] = None


@router.get("/", response_model=List[HistoryItem])
async def get_history(
    skip: int = 0,
    limit: int = 50,
    equipment_tag: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get query history with optional equipment tag filter."""
    query = select(QueryHistory).order_by(desc(QueryHistory.timestamp))
    if equipment_tag:
        query = query.where(QueryHistory.question.ilike(f"%{equipment_tag}%"))
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()
    return [
        HistoryItem(
            id=h.id,
            question=h.question,
            answer=h.answer,
            confidence=h.confidence or 0,
            sources=h.sources or [],
            equipment_tags=h.equipment_tags or [],
            timestamp=h.timestamp.isoformat() if h.timestamp else "",
            session_id=h.session_id,
        )
        for h in items
    ]


@router.delete("/{history_id}")
async def delete_history_item(history_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a single history entry."""
    await db.execute(delete(QueryHistory).where(QueryHistory.id == history_id))
    await db.commit()
    return {"message": "Deleted"}


@router.delete("/")
async def clear_all_history(db: AsyncSession = Depends(get_db)):
    """Clear all query history."""
    await db.execute(delete(QueryHistory))
    await db.commit()
    return {"message": "All history cleared"}
