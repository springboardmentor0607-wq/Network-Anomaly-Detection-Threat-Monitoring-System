import uuid
from typing import TYPE_CHECKING
from sqlalchemy import Float, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.traffic import TrafficFlow

class Prediction(Base):
    __tablename__ = "predictions"

    flow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("traffic_flows.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_class: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)

    flow: Mapped["TrafficFlow"] = relationship("TrafficFlow", back_populates="predictions")
