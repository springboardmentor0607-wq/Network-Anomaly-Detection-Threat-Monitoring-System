import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.traffic import TrafficFlowResponse

class PredictionResponse(BaseModel):
    id: uuid.UUID
    flow_id: uuid.UUID
    predicted_class: str
    confidence: float
    model_name: str
    model_version: str
    created_at: datetime
    flow: Optional[TrafficFlowResponse] = None

    class Config:
        from_attributes = True

class PredictionListResponse(BaseModel):
    items: List[PredictionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    top_threat_classes: Dict[str, int]
