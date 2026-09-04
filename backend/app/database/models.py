from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, inspect, text
)
from sqlalchemy.orm import relationship
from .connection import Base, engine


# ==============================================================================
# EXISTING MILESTONE 1 & 2 MODELS (PRESERVED)
# ==============================================================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, nullable=True)
    department = Column(String, default="SOC Operations")
    employee_id = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Security Analyst")
    created_at = Column(DateTime, default=datetime.utcnow)


class MLModelRecord(Base):
    __tablename__ = "ml_models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)
    version = Column(String, default="v1.0")
    dataset = Column(String, default="NSL-KDD")
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    is_active = Column(Boolean, default=False)
    status = Column(String, default="Ready", nullable=False)
    artifact_path = Column(String, nullable=True)
    metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ThreatRecord(Base):
    __tablename__ = "threats"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String, nullable=False, index=True)
    destination_ip = Column(String, default="10.0.0.15")
    protocol = Column(String, default="TCP")
    threat_type = Column(String, nullable=False, index=True)
    severity = Column(String, nullable=False, index=True)
    risk_score = Column(Float, nullable=False, default=0.0)
    confidence = Column(Float, nullable=False, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    occurrences = Column(Integer, default=1)
    status = Column(String, default="open", index=True)
    recommended_action = Column(String, default="Block IP & Drop Traffic")
    is_demo = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)


class AnomalyRecord(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String, nullable=False, index=True)
    destination_ip = Column(String, nullable=False)
    protocol = Column(String, default="TCP")
    anomaly_score = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="Detected")
    is_demo = Column(Boolean, default=False)


# ==============================================================================
# MILESTONE 3 MODELS (SQLAlchemy)
# ==============================================================================

class Alert(Base):
    __tablename__ = "soc_alerts"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    first_seen = Column(DateTime, default=datetime.utcnow, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String, nullable=False, index=True)
    destination_ip = Column(String, default="10.0.0.15")
    target_port = Column(Integer, default=80)
    protocol = Column(String, default="TCP")
    attack_type = Column(String, nullable=False, index=True)
    severity = Column(String, nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    risk_score = Column(Float, nullable=False, default=0.0)
    confidence = Column(Float, nullable=False, default=0.0)
    occurrences = Column(Integer, default=1)
    status = Column(String, default="OPEN", index=True)  # OPEN, ACKNOWLEDGED, INVESTIGATING, CONTAINED, RESOLVED, CLOSED
    recommended_action = Column(String, default="Inspect Flow & Apply Mitigation")
    assigned_analyst = Column(String, default="Unassigned")
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    notifications = relationship("Notification", back_populates="alert", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "soc_notifications"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("soc_alerts.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False, index=True)
    source_ip = Column(String, nullable=False, index=True)
    attack_type = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    alert = relationship("Alert", back_populates="notifications")


class Prediction(Base):
    __tablename__ = "soc_predictions"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    attack_class = Column(String, nullable=False, index=True)
    probability = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False, index=True)
    model_used = Column(String, default="Random Forest Classifier")
    model_version = Column(String, default="v2.0")
    source_ip = Column(String, default="127.0.0.1", index=True)
    inference_latency_ms = Column(Float, default=0.0)


class Incident(Base):
    __tablename__ = "soc_incidents"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False, index=True)
    priority = Column(String, default="P2 - High")
    status = Column(String, default="OPEN", index=True)  # OPEN -> ACKNOWLEDGED -> INVESTIGATING -> CONTAINED -> RESOLVED -> CLOSED
    assigned_analyst = Column(String, default="SOC Analyst")
    linked_alert_id = Column(Integer, ForeignKey("soc_alerts.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    audit_logs = relationship("IncidentAuditLog", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentAuditLog.timestamp.asc()")
    notes = relationship("IncidentNoteRecord", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentNoteRecord.timestamp.desc()")


class IncidentAuditLog(Base):
    __tablename__ = "soc_incident_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("soc_incidents.id"), nullable=False, index=True)
    previous_state = Column(String, nullable=False)
    new_state = Column(String, nullable=False)
    analyst = Column(String, default="SOC Analyst")
    action_note = Column(String, default="State Transition")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    incident = relationship("Incident", back_populates="audit_logs")


class IncidentNoteRecord(Base):
    __tablename__ = "soc_incident_notes"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("soc_incidents.id"), nullable=False, index=True)
    analyst = Column(String, default="SOC Analyst")
    note = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    incident = relationship("Incident", back_populates="notes")


class ThreatIndicator(Base):
    __tablename__ = "soc_threat_indicators"
    id = Column(Integer, primary_key=True, index=True)
    source_ip = Column(String, unique=True, index=True, nullable=False)
    indicator_type = Column(String, default="IP")
    attack_vector = Column(String, nullable=False, index=True)
    occurrence_count = Column(Integer, default=1)
    max_risk_score = Column(Float, nullable=False, default=0.0)
    severity = Column(String, nullable=False, index=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String, default="INTERNAL")  # INTERNAL, ABUSE_IPDB, VIRUSTOTAL, ALIENVAULT_OTX


def run_safe_schema_migrations():
    """Dynamically applies table creation and verifies columns on startup."""
    Base.metadata.create_all(bind=engine)
    try:
        inspector = inspect(engine)
        if "threats" in inspector.get_table_names():
            cols = [c["name"] for c in inspector.get_columns("threats")]
            with engine.connect() as conn:
                if "last_seen" not in cols:
                    conn.execute(text("ALTER TABLE threats ADD COLUMN last_seen DATETIME"))
                if "occurrences" not in cols:
                    conn.execute(text("ALTER TABLE threats ADD COLUMN occurrences INTEGER DEFAULT 1"))
                if "acknowledged_at" not in cols:
                    conn.execute(text("ALTER TABLE threats ADD COLUMN acknowledged_at DATETIME"))
                if "resolved_at" not in cols:
                    conn.execute(text("ALTER TABLE threats ADD COLUMN resolved_at DATETIME"))
        if "ml_models" in inspector.get_table_names():
            cols = [c["name"] for c in inspector.get_columns("ml_models")]
            with engine.connect() as conn:
                if "status" not in cols:
                    conn.execute(text("ALTER TABLE ml_models ADD COLUMN status VARCHAR DEFAULT 'Ready' NOT NULL"))
                if "artifact_path" not in cols:
                    conn.execute(text("ALTER TABLE ml_models ADD COLUMN artifact_path VARCHAR"))
                conn.commit()
                conn.commit()
    except Exception as e:
        print(f"[!] Migration check log: {e}")

run_safe_schema_migrations()
