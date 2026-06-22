import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON

from app.models.base import Base


class QueryHistory(Base):
    """Persists every question/answer cycle for audit and analytics."""

    __tablename__ = "query_history"

    id: str = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    question: str = Column(Text, nullable=False)
    answer: str = Column(Text, nullable=False)
    # Confidence score in the range 0–100
    confidence: int = Column(Integer, nullable=True)
    # List of dicts: {document_name, page_number, chunk_ref, similarity}
    sources: list = Column(JSON, nullable=False, default=list)
    # Equipment tags detected/extracted from the query text
    equipment_tags: list = Column(JSON, nullable=False, default=list)
    # Performance timing in milliseconds
    query_embedding_time_ms: int = Column(Integer, nullable=True)
    retrieval_time_ms: int = Column(Integer, nullable=True)
    generation_time_ms: int = Column(Integer, nullable=True)
    timestamp: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    # Optional session grouping identifier
    session_id: str = Column(String(100), nullable=True, index=True)

    def __repr__(self) -> str:
        short_q = self.question[:60] + "..." if len(self.question) > 60 else self.question
        return f"<QueryHistory id={self.id!r} question={short_q!r} confidence={self.confidence!r}>"
