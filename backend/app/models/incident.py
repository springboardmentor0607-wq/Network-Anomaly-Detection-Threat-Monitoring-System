import uuid
import enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.alert import Alert, AlertSeverity
    from app.models.user import User

class IncidentStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Incident(Base):
    __tablename__ = "incidents"

    incident_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False, default="HIGH")
    status: Mapped[IncidentStatus] = mapped_column(Enum(IncidentStatus, name="incident_status_enum"), default=IncidentStatus.OPEN, nullable=False, index=True)

    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    owner: Mapped["User"] = relationship("User")

    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="incident")
    resolution_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
