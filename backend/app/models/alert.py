import uuid
import enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.traffic import TrafficFlow
    from app.models.user import User
    from app.models.incident import Incident

class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(str, enum.Enum):
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

class Alert(Base):
    __tablename__ = "alerts"

    alert_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity, name="alert_severity_enum"), nullable=False, index=True)
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus, name="alert_status_enum"), default=AlertStatus.NEW, nullable=False, index=True)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    flow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("traffic_flows.id", ondelete="CASCADE"), nullable=False, index=True)
    flow: Mapped["TrafficFlow"] = relationship("TrafficFlow", back_populates="alerts")

    assigned_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_to: Mapped[Optional["User"]] = relationship("User")

    incident_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    incident: Mapped[Optional["Incident"]] = relationship("Incident", back_populates="alerts")

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
