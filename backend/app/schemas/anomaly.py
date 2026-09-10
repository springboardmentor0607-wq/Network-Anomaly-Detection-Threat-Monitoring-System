import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.traffic import TrafficFlowResponse

class AnomalyResponse(BaseModel):
    id: uuid.UUID
    flow_id: uuid.UUID
    anomaly_score: float
    is_anomaly: bool
    model_name: str
    model_version: str
    contributing_features: Optional[Dict[str, Any]] = None
    created_at: datetime
    flow: Optional[TrafficFlowResponse] = None

    class Config:
        from_attributes = True

class AnomalyListResponse(BaseModel):
    items: List[AnomalyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    total_anomalies_count: int
    avg_anomaly_score: float
