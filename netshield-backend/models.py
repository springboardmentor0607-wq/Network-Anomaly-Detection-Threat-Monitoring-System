from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(
        String,
        nullable=False,
        default="security_analyst"
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    record_id = Column(Integer, nullable=False)
    dataset = Column(String, nullable=False)

    attack_category = Column(String, nullable=False)
    attack_probability = Column(Float, nullable=False)

    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)

    status = Column(
        String,
        nullable=False,
        default="NEW"
    )

    srcip = Column(String, nullable=True)
    dstip = Column(String, nullable=True)
    proto = Column(String, nullable=True)

    description = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    alert_id = Column(Integer, nullable=False)

    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    severity = Column(String, nullable=False)

    is_read = Column(
        Integer,
        nullable=False,
        default=0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )