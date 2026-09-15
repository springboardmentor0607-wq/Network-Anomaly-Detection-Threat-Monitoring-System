import uuid
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    ip_address: Mapped[str] = mapped_column(String(45), unique=True, nullable=False, index=True)
    threat_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    reputation: Mapped[str] = mapped_column(String(50), nullable=False, default="Clean")
    country_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    country_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    isp: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    known_attack_types: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    ioc_matches: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
