from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="analyst")  # "analyst" or "administrator"
    
    # --- NEW: Relationship linking the user to their audit logs ---
    audit_logs = relationship("AuditLog", back_populates="user")


# --- NEW: SOC AUDIT LOGGING TABLE ---
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # e.g., "LOGIN_SUCCESS", "SIMULATED_ATTACK", "DOWNLOAD_THREAT_REPORT"
    action = Column(String, index=True, nullable=False) 
    
    # e.g., "Network Anomaly Dashboard", "User Settings"
    target = Column(String) 
    
    # Any extra context like IP address or specific threat names
    details = Column(String, nullable=True) 
    
    # Automatically stamps the exact time the action occurred
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # --- NEW: Relationship linking back to the User table ---
    user = relationship("User", back_populates="audit_logs")