from typing import Dict, Any

from pydantic import BaseModel


# ==========================================
# REQUEST SCHEMA
# ==========================================

class PredictionRequest(BaseModel):

    features: Dict[str, Any]


# ==========================================
# RESPONSE SCHEMA
# ==========================================

class PredictionResponse(BaseModel):

    dataset: str

    model: str

    prediction: str

    confidence: float

    risk_level: str

    recommendation: str

    timestamp: str