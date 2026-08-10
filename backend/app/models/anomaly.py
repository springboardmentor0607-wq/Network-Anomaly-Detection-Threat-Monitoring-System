import uuid
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import Float, Boolean, String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.traffic import TrafficFlow

class Anomaly(Base):
    __tablename__ = "anomalies"

    flow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("traffic_flows.id", ondelete="CASCADE"), nullable=False, index=True)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    contributing_features: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    flow: Mapped["TrafficFlow"] = relationship("TrafficFlow", back_populates="anomalies")
