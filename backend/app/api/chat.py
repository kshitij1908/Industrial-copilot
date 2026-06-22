import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.models.base import get_db
from app.models.query_history import QueryHistory
from app.models.equipment import Equipment, EquipmentAccessLog
from app.rag.pipeline import get_pipeline
from app.utils.equipment_detector import detect_equipment_tags

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    equipment_tag_filter: Optional[str] = None


class SourceItem(BaseModel):
    document_name: str
    page_number: int
    similarity: float
    document_id: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    confidence: int
    confidence_label: str
    equipment_tags: List[str]
    query_id: str
    total_time_ms: int


@router.post("/query", response_model=ChatResponse)
async def query(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Main RAG query endpoint. Accepts a natural language question and returns grounded answer."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        pipeline = get_pipeline()
        result = await pipeline.query(
            question=request.question,
            session_id=request.session_id,
        )
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

    # Persist to query history
    query_id = str(uuid.uuid4())
    history = QueryHistory(
        id=query_id,
        question=request.question,
        answer=result["answer"],
        confidence=result["confidence"],
        sources=result["sources"],
        equipment_tags=result["equipment_tags"],
        query_embedding_time_ms=result.get("query_embedding_time_ms", 0),
        retrieval_time_ms=result.get("retrieval_time_ms", 0),
        generation_time_ms=result.get("generation_time_ms", 0),
        session_id=request.session_id,
    )
    db.add(history)

    # Update equipment access counts
    for tag in result.get("equipment_tags", []):
        # Upsert equipment record
        eq_result = await db.execute(select(Equipment).where(Equipment.tag == tag))
        eq = eq_result.scalar_one_or_none()
        if eq:
            eq.access_count = (eq.access_count or 0) + 1
        else:
            from datetime import datetime
            eq = Equipment(
                id=str(uuid.uuid4()),
                tag=tag,
                equipment_type=_guess_equipment_type(tag),
                access_count=1,
                last_accessed=datetime.utcnow(),
            )
            db.add(eq)

        log = EquipmentAccessLog(
            id=str(uuid.uuid4()),
            equipment_tag=tag,
            query_id=query_id,
        )
        db.add(log)

    await db.commit()

    return ChatResponse(
        answer=result["answer"],
        sources=[
            SourceItem(
                document_name=s["document_name"],
                page_number=int(s["page"]) if str(s["page"]).isdigit() or isinstance(s["page"], (int, float)) else 1,
                similarity=s["similarity_score"],
                document_id=s["document_id"],
            )
            for s in result["sources"]
        ],
        confidence=result["confidence"],
        confidence_label=result["confidence_label"],
        equipment_tags=result["equipment_tags"],
        query_id=query_id,
        total_time_ms=result.get("total_time_ms", 0),
    )


@router.get("/suggestions")
async def get_suggestions(doc_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Get suggested questions based on uploaded documents."""
    try:
        from app.models.document import Document, DocumentStatus
        if doc_id:
            result = await db.execute(select(Document).where(Document.id == doc_id))
            docs = [result.scalar_one_or_none()]
            docs = [d for d in docs if d]
        else:
            result = await db.execute(
                select(Document)
                .where(Document.status == DocumentStatus.READY)
                .order_by(Document.upload_date.desc())
                .limit(5)
            )
            docs = list(result.scalars().all())

        if not docs:
            return {"suggestions": _default_suggestions()}

        # Use the most recent ready document's equipment tags to generate suggestions
        doc = docs[0]
        tags = doc.equipment_tags or []
        return {"suggestions": _generate_tag_suggestions(tags, doc.original_name)}
    except Exception as e:
        logger.warning(f"Suggestions error: {e}")
        return {"suggestions": _default_suggestions()}


def _guess_equipment_type(tag: str) -> str:
    from app.utils.equipment_detector import get_equipment_type
    return get_equipment_type(tag)


def _default_suggestions() -> List[str]:
    return [
        "What are the startup procedures for this equipment?",
        "Show all maintenance history for P-101",
        "What are the safety precautions for this process?",
        "When was the last inspection performed?",
        "What are the OEM recommendations for lubrication intervals?",
    ]


def _generate_tag_suggestions(tags: List[str], doc_name: str) -> List[str]:
    suggestions = []
    for tag in tags[:2]:
        suggestions.extend([
            f"What is the startup procedure for {tag}?",
            f"When was {tag} last inspected?",
            f"Show all maintenance history for {tag}",
        ])
    suggestions.append(f"What are the key procedures in {doc_name}?")
    suggestions.append("What safety precautions should be followed?")
    return suggestions[:6]


class RCARequest(BaseModel):
    equipment_tag: str


class RCAResponse(BaseModel):
    equipment_tag: str
    analysis: str
    chunks_used: int
    error: Optional[str] = None


@router.post("/root-cause", response_model=RCAResponse)
async def generate_root_cause(request: RCARequest):
    """Generate root-cause analysis (RCA) for a specific piece of equipment."""
    if not request.equipment_tag.strip():
        raise HTTPException(status_code=400, detail="Equipment tag cannot be empty")
    
    try:
        pipeline = get_pipeline()
        # Since root_cause_analysis is synchronous in pipeline.py, we call it synchronously
        result = pipeline.root_cause_analysis(request.equipment_tag)
        return RCAResponse(
            equipment_tag=result["equipment_tag"],
            analysis=result["analysis"],
            chunks_used=result["chunks_used"],
            error=result["error"],
        )
    except Exception as e:
        logger.error(f"RCA generation failed for tag {request.equipment_tag}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"RCA generation failed: {str(e)}")
