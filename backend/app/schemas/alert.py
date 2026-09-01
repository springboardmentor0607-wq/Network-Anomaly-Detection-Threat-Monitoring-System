import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.alert import AlertSeverity, AlertStatus
from app.schemas.auth import UserResponse
from app.schemas.traffic import TrafficFlowResponse

class AlertResponse(BaseModel):
    id: uuid.UUID
    alert_id: str
    title: str
    alert_type: str
    severity: AlertSeverity
    status: AlertStatus
    risk_score: int
    flow_id: uuid.UUID
    assigned_to_id: Optional[uuid.UUID] = None
    assigned_to: Optional[UserResponse] = None
    incident_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    flow: Optional[TrafficFlowResponse] = None

    class Config:
        from_attributes = True

class AlertListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    new_alerts_count: int
    critical_alerts_count: int

class AlertAssignRequest(BaseModel):
    user_id: uuid.UUID

class AlertActionRequest(BaseModel):
    notes: Optional[str] = None
