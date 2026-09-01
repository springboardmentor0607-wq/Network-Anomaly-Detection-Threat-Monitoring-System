from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

class SystemSettingsSchema(BaseModel):
    demo_mode_enabled: bool = True
    simulation_speed_ms: int = 1500
    alert_risk_threshold: int = 75
    auto_escalation_enabled: bool = True
    sound_notifications_enabled: bool = True
    threat_intel_api_enabled: bool = True
    max_log_retention_days: int = 90
    primary_ml_model: str = "mdl-xgb-01"

SYSTEM_SETTINGS = {
    "demo_mode_enabled": True,
    "simulation_speed_ms": 1500,
    "alert_risk_threshold": 75,
    "auto_escalation_enabled": True,
    "sound_notifications_enabled": True,
    "threat_intel_api_enabled": True,
    "max_log_retention_days": 90,
    "primary_ml_model": "mdl-xgb-01"
}

@router.get("", response_model=Dict[str, Any])
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SYSTEM_SETTINGS

@router.post("", response_model=Dict[str, Any])
def update_settings(
    payload: SystemSettingsSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    SYSTEM_SETTINGS.update(payload.dict())
    return SYSTEM_SETTINGS
