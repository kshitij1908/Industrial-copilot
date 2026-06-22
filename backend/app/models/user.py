import uuid
from sqlalchemy import Column, String, Boolean
from app.models.base import Base


class User(Base):
    """Represents a registered user of the Industrial Knowledge Copilot platform."""

    __tablename__ = "users"

    id: str = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    username: str = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password: str = Column(String(200), nullable=False)
    email: str = Column(String(100), nullable=True)
    full_name: str = Column(String(100), nullable=True)
    is_active: bool = Column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<User username={self.username!r}>"
