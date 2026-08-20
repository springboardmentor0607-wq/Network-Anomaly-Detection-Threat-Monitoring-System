from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str


class UserLogin(BaseModel):
    email: str
    password: str


class IncidentCreate(BaseModel):
    alert_id: Optional[int] = None
    dataset: str
    attack_type: str
    severity: str
    source: str
    risk_score: int
    assigned_to: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None

class AlertCreate(BaseModel):
    dataset: str
    source: str
    source_ip: str | None = None
    destination_ip: str | None = None
    protocol: str | None = None
    attack_type: str
    severity: str
    risk_score: int
    risk_level: str
    detection_details: str