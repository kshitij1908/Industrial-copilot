import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from app.models.base import Base


class DocumentStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class Document(Base):
    """Represents an uploaded industrial document stored in the system."""

    __tablename__ = "documents"

    id: str = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    filename: str = Column(String(500), nullable=False)
    original_name: str = Column(String(500), nullable=False)
    file_type: str = Column(String(50), nullable=False)
    file_size: int = Column(Integer, nullable=True)
    document_type: str = Column(
        String(100),
        nullable=True,
        comment=(
            "One of: SOP, Maintenance Record, Inspection Report, Engineering Manual, "
            "OEM Documentation, Safety Procedure, Work Order, Project Document, "
            "P&ID, Regulatory Document, Other"
        ),
    )
    status: str = Column(
        SAEnum(DocumentStatus, name="documentstatus"),
        nullable=False,
        default=DocumentStatus.PENDING,
    )
    page_count: int = Column(Integer, nullable=False, default=0)
    equipment_tags: list = Column(JSON, nullable=False, default=list)
    upload_date: datetime = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    processed_date: datetime = Column(DateTime, nullable=True)
    error_message: str = Column(Text, nullable=True)
    chunk_count: int = Column(Integer, nullable=False, default=0)
    chroma_collection: str = Column(
        String(200),
        nullable=False,
        default="industrial_docs",
    )

    def __repr__(self) -> str:
        return (
            f"<Document id={self.id!r} original_name={self.original_name!r} "
            f"status={self.status!r}>"
        )
