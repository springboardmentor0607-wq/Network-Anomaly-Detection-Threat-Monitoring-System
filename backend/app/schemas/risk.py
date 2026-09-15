import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.models.risk import SeverityBand

class RiskScoreResponse(BaseModel):
    id: uuid.UUID
    flow_id: uuid.UUID
    score: int
    severity: SeverityBand
    explanation: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
