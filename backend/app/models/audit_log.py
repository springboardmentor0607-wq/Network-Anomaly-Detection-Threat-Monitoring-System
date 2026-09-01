import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    status_result: Mapped[str] = mapped_column(String(50), nullable=False, default="SUCCESS")
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
