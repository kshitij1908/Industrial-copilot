import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel

from app.models.base import get_db
from app.models.equipment import Equipment, EquipmentAccessLog
from app.models.document import Document, DocumentStatus

logger = logging.getLogger(__name__)
router = APIRouter()


class EquipmentResponse(BaseModel):
    id: str
    tag: str
    equipment_type: Optional[str]
    description: Optional[str]
    access_count: int
    related_document_ids: List[str]
    documents: List[dict] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[EquipmentResponse])
async def list_equipment(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all discovered equipment tags sorted by access frequency."""
    result = await db.execute(
        select(Equipment)
        .order_by(desc(Equipment.access_count))
        .offset(skip)
        .limit(limit)
    )
    equipment_list = result.scalars().all()

    response = []
    for eq in equipment_list:
        # Fetch related documents
        docs = await _get_equipment_documents(eq.tag, db)
        response.append(EquipmentResponse(
            id=eq.id,
            tag=eq.tag,
            equipment_type=eq.equipment_type,
            description=eq.description,
            access_count=eq.access_count or 0,
            related_document_ids=eq.related_document_ids or [],
            documents=docs,
        ))
    return response


@router.get("/search")
async def search_equipment(q: str, db: AsyncSession = Depends(get_db)):
    """Search equipment by tag prefix."""
    result = await db.execute(
        select(Equipment)
        .where(Equipment.tag.ilike(f"%{q}%"))
        .order_by(desc(Equipment.access_count))
        .limit(20)
    )
    equipment_list = result.scalars().all()
    return [
        {"tag": eq.tag, "equipment_type": eq.equipment_type, "access_count": eq.access_count}
        for eq in equipment_list
    ]


@router.get("/{tag}")
async def get_equipment_detail(tag: str, db: AsyncSession = Depends(get_db)):
    """
    Get full equipment details including all related documents,
    maintenance history, and recent queries.
    """
    tag_upper = tag.upper()

    # Get equipment record
    result = await db.execute(select(Equipment).where(Equipment.tag == tag_upper))
    eq = result.scalar_one_or_none()

    # Get documents mentioning this tag
    docs = await _get_equipment_documents(tag_upper, db)

    # Get recent queries for this tag
    from app.models.query_history import QueryHistory
    from sqlalchemy import cast, String
    # Simple approach: get recent history
    history_result = await db.execute(
        select(QueryHistory)
        .where(QueryHistory.question.ilike(f"%{tag_upper}%"))
        .order_by(desc(QueryHistory.timestamp))
        .limit(10)
    )
    recent_queries = [
        {
            "question": h.question,
            "confidence": h.confidence,
            "timestamp": h.timestamp.isoformat() if h.timestamp else None,
        }
        for h in history_result.scalars().all()
    ]

    # Increment access count
    if eq:
        eq.access_count = (eq.access_count or 0) + 1
        from datetime import datetime
        eq.last_accessed = datetime.utcnow()
    else:
        from app.utils.equipment_detector import get_equipment_type
        from datetime import datetime
        eq_new = Equipment(
            id=str(uuid.uuid4()),
            tag=tag_upper,
            equipment_type=get_equipment_type(tag_upper),
            access_count=1,
            last_accessed=datetime.utcnow(),
            related_document_ids=[d["id"] for d in docs],
        )
        db.add(eq_new)
        eq = eq_new

    await db.commit()

    return {
        "tag": tag_upper,
        "equipment_type": eq.equipment_type if eq else "Unknown",
        "description": eq.description if eq else None,
        "access_count": eq.access_count if eq else 1,
        "documents": docs,
        "document_count": len(docs),
        "recent_queries": recent_queries,
    }


async def _get_equipment_documents(tag: str, db: AsyncSession) -> List[dict]:
    """Find all documents that reference a given equipment tag."""
    result = await db.execute(
        select(Document).where(Document.status == DocumentStatus.READY)
    )
    all_docs = result.scalars().all()
    matching = []
    for doc in all_docs:
        tags = doc.equipment_tags or []
        if tag.upper() in [t.upper() for t in tags]:
            matching.append({
                "id": doc.id,
                "original_name": doc.original_name,
                "document_type": doc.document_type or "Other",
                "upload_date": doc.upload_date.isoformat() if doc.upload_date else None,
                "page_count": doc.page_count or 0,
            })
    return matching
