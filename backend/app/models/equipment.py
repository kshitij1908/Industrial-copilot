import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON

from app.models.base import Base


class Equipment(Base):
    """Represents a physical piece of plant equipment identified by its tag."""

    __tablename__ = "equipment"

    id: str = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    # Equipment tag, e.g. P-101, HX-302A
    tag: str = Column(String(50), nullable=False, unique=True, index=True)
    # Human-readable equipment classification
    equipment_type: str = Column(
        String(100),
        nullable=True,
        comment="Pump, Valve, Compressor, Boiler, Heat Exchanger, Tank, Motor, etc.",
    )
    description: str = Column(Text, nullable=True)
    # UUIDs of Document rows that mention this equipment
    related_document_ids: list = Column(JSON, nullable=False, default=list)
    # Number of times this equipment tag has been queried
    access_count: int = Column(Integer, nullable=False, default=0)
    last_accessed: datetime = Column(DateTime, nullable=True)
    created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self) -> str:
        return (
            f"<Equipment id={self.id!r} tag={self.tag!r} "
            f"type={self.equipment_type!r} access_count={self.access_count!r}>"
        )


class EquipmentAccessLog(Base):
    """Fine-grained audit log recording every time an equipment tag is accessed."""

    __tablename__ = "equipment_access_log"

    id: str = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    equipment_tag: str = Column(String(50), nullable=False, index=True)
    # References QueryHistory.id (kept as a loose foreign key for flexibility)
    query_id: str = Column(String(200), nullable=True)
    timestamp: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self) -> str:
        return (
            f"<EquipmentAccessLog id={self.id!r} tag={self.equipment_tag!r} "
            f"timestamp={self.timestamp!r}>"
        )
