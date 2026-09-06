from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from database import fetch_all, fetch_one, execute_query
from auth import get_optional_user

alert_router = APIRouter(tags=['Alerts'])
alert_bp = alert_router

class AlertStatusUpdate(BaseModel):
    status: str

@alert_router.get('/alerts')
async def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    query = """
        SELECT a.id, a.threat_id, a.title, a.description, a.severity, a.alert_type, a.status, a.created_at,
               COALESCE(t.attack_type, 'Threat Detected') AS attack_type,
               COALESCE(t.destination_ip, '10.0.0.1') AS destination_ip,
               COALESCE(t.source_ip, '192.168.1.100') AS source_ip
        FROM security_alerts a
        LEFT JOIN threats t ON a.threat_id = t.id
        WHERE 1=1
    """
    params = []
    if status and status.strip():
        query += " AND UPPER(a.status) = UPPER(%s)"
        params.append(status.strip())
    if severity and severity.strip():
        query += " AND UPPER(a.severity) = UPPER(%s)"
        params.append(severity.strip())
    
    query += " ORDER BY a.created_at DESC LIMIT 100"
    alerts = fetch_all(query, tuple(params) if params else None)
    return {'alerts': alerts or []}

@alert_router.put('/alerts/{alert_id}')
@alert_router.put('/alerts/{alert_id}/status')
async def update_alert_status(alert_id: int, req: AlertStatusUpdate, current_user: Optional[dict] = Depends(get_optional_user)):
    execute_query("UPDATE security_alerts SET status = %s WHERE id = %s", (req.status, alert_id))
    return {'message': f'Alert #{alert_id} status updated to {req.status}'}
