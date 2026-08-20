from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    # Dataset information
    dataset = Column(String)

    # Network/source information
    source = Column(String)
    source_ip = Column(String)
    destination_ip = Column(String)
    protocol = Column(String)

    # Threat information
    attack_type = Column(String)
    severity = Column(String)

    # Risk information
    risk_score = Column(Integer)
    risk_level = Column(String)

    # Alert state
    status = Column(String, default="Open")

    # Detection information
    detection_details = Column(String)

    detected_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    incident_id = Column(String, unique=True, index=True)

    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)

    dataset = Column(String)

    attack_type = Column(String)

    severity = Column(String)

    source = Column(String)

    risk_score = Column(Integer)

    status = Column(String, default="Open")

    assigned_to = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    resolved_at = Column(
        DateTime,
        nullable=True
    )