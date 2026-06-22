import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.models.base import get_db
from app.models.document import Document, DocumentStatus
from app.models.query_history import QueryHistory
from app.models.equipment import Equipment

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_analytics(db: AsyncSession = Depends(get_db)):
    """Aggregate dashboard statistics."""

    # Total documents
    doc_count = await db.execute(select(func.count(Document.id)))
    total_documents = doc_count.scalar() or 0

    # Ready documents
    ready_count = await db.execute(
        select(func.count(Document.id)).where(Document.status == DocumentStatus.READY)
    )
    ready_documents = ready_count.scalar() or 0

    # Total equipment tags
    eq_count = await db.execute(select(func.count(Equipment.id)))
    total_equipment = eq_count.scalar() or 0

    # Total queries
    query_count = await db.execute(select(func.count(QueryHistory.id)))
    total_queries = query_count.scalar() or 0

    # Most accessed equipment (top 5)
    top_eq_result = await db.execute(
        select(Equipment.tag, Equipment.equipment_type, Equipment.access_count)
        .order_by(desc(Equipment.access_count))
        .limit(5)
    )
    most_accessed_equipment = [
        {"tag": row[0], "equipment_type": row[1], "count": row[2] or 0}
        for row in top_eq_result.all()
    ]

    # Most accessed documents (by equipment tags count as proxy)
    doc_result = await db.execute(
        select(Document)
        .where(Document.status == DocumentStatus.READY)
        .order_by(desc(Document.chunk_count))
        .limit(5)
    )
    most_accessed_documents = [
        {"name": d.original_name, "document_type": d.document_type, "chunk_count": d.chunk_count or 0}
        for d in doc_result.scalars().all()
    ]

    # Average confidence
    avg_conf = await db.execute(select(func.avg(QueryHistory.confidence)))
    avg_confidence = round(avg_conf.scalar() or 0, 1)

    # Processing queue
    pending_result = await db.execute(
        select(func.count(Document.id)).where(
            Document.status.in_([DocumentStatus.PENDING, DocumentStatus.PROCESSING])
        )
    )
    processing_queue = pending_result.scalar() or 0

    # Recent queries (last 5)
    recent_q = await db.execute(
        select(QueryHistory).order_by(desc(QueryHistory.timestamp)).limit(5)
    )
    recent_queries = [
        {
            "question": q.question[:80] + "..." if len(q.question) > 80 else q.question,
            "confidence": q.confidence,
            "timestamp": q.timestamp.isoformat() if q.timestamp else None,
        }
        for q in recent_q.scalars().all()
    ]

    # Total chunks in vector store
    try:
        from app.vectorstore.store import ChromaVectorStore
        store = ChromaVectorStore()
        stats = store.get_collection_stats()
        total_chunks = stats.get("total_chunks", 0)
    except Exception:
        total_chunks = 0

    return {
        "total_documents": total_documents,
        "ready_documents": ready_documents,
        "total_equipment_tags": total_equipment,
        "total_queries": total_queries,
        "total_chunks": total_chunks,
        "avg_confidence": avg_confidence,
        "processing_queue": processing_queue,
        "most_accessed_equipment": most_accessed_equipment,
        "most_accessed_documents": most_accessed_documents,
        "recent_queries": recent_queries,
    }
