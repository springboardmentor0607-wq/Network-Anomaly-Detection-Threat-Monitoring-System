import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy import String, Integer, BigInteger, Float, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.anomaly import Anomaly
    from app.models.prediction import Prediction
    from app.models.risk import RiskScore
    from app.models.alert import Alert

class TrafficFlow(Base):
    __tablename__ = "traffic_flows"

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    source_ip: Mapped[str] = mapped_column(String(45), nullable=False, index=True)
    destination_ip: Mapped[str] = mapped_column(String(45), nullable=False, index=True)
    source_port: Mapped[int] = mapped_column(Integer, nullable=False)
    destination_port: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    protocol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    packets: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)
    bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    duration: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dataset_source: Mapped[str] = mapped_column(String(50), nullable=False, default="CICIDS2017")
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    anomalies: Mapped[List["Anomaly"]] = relationship("Anomaly", back_populates="flow", cascade="all, delete-orphan")
    predictions: Mapped[List["Prediction"]] = relationship("Prediction", back_populates="flow", cascade="all, delete-orphan")
    risk_scores: Mapped[List["RiskScore"]] = relationship("RiskScore", back_populates="flow", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="flow", cascade="all, delete-orphan")
