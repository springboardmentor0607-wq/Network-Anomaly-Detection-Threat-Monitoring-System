from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from .connection import Base

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
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    is_active = Column(Boolean, default=False)
    metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ThreatRecord(Base):
    __tablename__ = "threats"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_ip = Column(String, nullable=False)
    destination_ip = Column(String, nullable=False)
    protocol = Column(String, default="TCP")
    threat_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    anomaly_score = Column(Float, default=0.0)
    status = Column(String, default="Blocked")
    recommended_action = Column(String, default="Block IP")
    is_demo = Column(Boolean, default=False)

class AnomalyRecord(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_ip = Column(String, nullable=False)
    destination_ip = Column(String, nullable=False)
    protocol = Column(String, default="TCP")
    anomaly_score = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="Detected")
    is_demo = Column(Boolean, default=False)