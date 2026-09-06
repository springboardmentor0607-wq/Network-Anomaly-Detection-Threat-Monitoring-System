from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from database import fetch_all, fetch_one
from auth import get_optional_user

threat_router = APIRouter(tags=['Threats'])
threat_bp = threat_router

@threat_router.get('/threats')
async def get_threats(limit: int = 50, current_user: Optional[dict] = Depends(get_optional_user)):
    threats = fetch_all(f"SELECT id, attack_type, source_ip, destination_ip, protocol, confidence, risk_score, severity, status, detected_at FROM threats ORDER BY detected_at DESC LIMIT {min(limit, 100)}")
    return {'threats': threats or []}

@threat_router.get('/threats/{threat_id}')
async def get_threat_detail(threat_id: int, current_user: Optional[dict] = Depends(get_optional_user)):
    threat = fetch_one("SELECT * FROM threats WHERE id = %s", (threat_id,))
    if not threat:
        raise HTTPException(status_code=404, detail='Threat record not found.')
    return {'threat': threat}
