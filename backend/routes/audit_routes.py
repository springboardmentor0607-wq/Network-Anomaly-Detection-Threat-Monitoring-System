from typing import Optional
from fastapi import APIRouter, Depends
from database import fetch_all
from auth import get_optional_user
from mongo_db import get_recent_security_events

audit_router = APIRouter(tags=['Audit & Compliance'])
audit_bp = audit_router

@audit_router.get('/audit-logs')
async def get_audit_logs(current_user: Optional[dict] = Depends(get_optional_user)):
    logs = fetch_all("SELECT a.id, a.user_id, u.name as user_name, a.action, a.module, a.ip_address, a.timestamp FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.timestamp DESC LIMIT 100")
    return {'audit_logs': logs or []}

@audit_router.get('/mongo/events')
async def get_mongo_security_events(limit: int = 50, current_user: Optional[dict] = Depends(get_optional_user)):
    events = get_recent_security_events(limit=min(limit, 200))
    return {'events': events, 'count': len(events), 'database': 'MongoDB (Active Collection: network_security_events)'}
