import uuid
import enum
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import Integer, String, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.traffic import TrafficFlow

class SeverityBand(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RiskScore(Base):
    __tablename__ = "risk_scores"

    flow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("traffic_flows.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    severity: Mapped[SeverityBand] = mapped_column(Enum(SeverityBand, name="severity_band_enum"), nullable=False, index=True)
    explanation: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    flow: Mapped["TrafficFlow"] = relationship("TrafficFlow", back_populates="risk_scores")
