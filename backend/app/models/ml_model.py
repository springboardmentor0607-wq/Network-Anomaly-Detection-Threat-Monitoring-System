import uuid
from typing import Optional, Dict, Any
from sqlalchemy import String, Boolean, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class MLModel(Base):
    __tablename__ = "ml_models"

    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    algorithm: Mapped[str] = mapped_column(String(100), nullable=False)
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)  # anomaly_detection / classification
    dataset_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    metrics_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    artifact_path: Mapped[str] = mapped_column(String(255), nullable=False)
