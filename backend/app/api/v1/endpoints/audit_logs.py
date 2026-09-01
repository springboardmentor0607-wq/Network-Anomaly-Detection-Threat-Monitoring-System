from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

MOCK_AUDIT_LOGS = [
    {
        "id": "aud-1092",
        "timestamp": "2026-08-10T09:45:12Z",
        "user_email": "admin@netshield.ai",
        "user_role": "ADMINISTRATOR",
        "action": "MODEL_ACTIVATED",
        "resource": "AI Model: mdl-xgb-01 (XGBoost v2.4.1)",
        "result": "SUCCESS",
        "ip_address": "192.168.1.15",
        "details": "Switched active inference model from IsolationForest to XGBoost Classifier."
    },
    {
        "id": "aud-1091",
        "timestamp": "2026-08-10T09:30:00Z",
        "user_email": "analyst@netshield.ai",
        "user_role": "SOC_ANALYST",
        "action": "INCIDENT_RESOLVED",
        "resource": "Incident: INC-2026-0891",
        "result": "SUCCESS",
        "ip_address": "192.168.1.42",
        "details": "Status changed from INVESTIGATING to CONTAINED. Resolution notes updated."
    },
    {
        "id": "aud-1090",
        "timestamp": "2026-08-10T08:15:04Z",
        "user_email": "system@netshield.ai",
        "user_role": "SYSTEM",
        "action": "ALERT_ESCALATED",
        "resource": "Alert: ALT-8921 (DDoS SYN Flood)",
        "result": "SUCCESS",
        "ip_address": "127.0.0.1",
        "details": "Automatic escalation triggered due to Risk Score 96 exceeding threshold 80."
    },
    {
        "id": "aud-1089",
        "timestamp": "2026-08-10T08:00:10Z",
        "user_email": "admin@netshield.ai",
        "user_role": "ADMINISTRATOR",
        "action": "USER_ROLE_UPDATED",
        "resource": "User: viewer@netshield.ai",
        "result": "SUCCESS",
        "ip_address": "192.168.1.15",
        "details": "Assigned role SECURITY_ANALYST to user."
    },
    {
        "id": "aud-1088",
        "timestamp": "2026-08-10T07:45:00Z",
        "user_email": "admin@netshield.ai",
        "user_role": "ADMINISTRATOR",
        "action": "SETTINGS_MODIFIED",
        "resource": "System Settings",
        "result": "SUCCESS",
        "ip_address": "192.168.1.15",
        "details": "Updated critical alert risk score threshold from 85 to 80."
    }
]

@router.get("", response_model=List[dict])
def list_audit_logs(
    action: Optional[str] = None,
    user_email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filtered = MOCK_AUDIT_LOGS
    if action and action.upper() != "ALL":
        filtered = [log for log in filtered if log["action"] == action.upper()]
    if user_email:
        filtered = [log for log in filtered if user_email.lower() in log["user_email"].lower()]
    return filtered
