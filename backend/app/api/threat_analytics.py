import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.handler import get_current_user
from app.database.database import get_db
from app.services.audit_logger import log_audit_event
from app.services.threat_analytics_service import compute_threat_intelligence_analytics

router = APIRouter()
logger = logging.getLogger("netshield.backend.threat_analytics.api")


@router.get("/analytics")
@router.get("/threat-intelligence/analytics")
async def get_threat_intelligence_analytics_endpoint(
    request: Request,
    severity: Optional[str] = Query(default=None, description="Filter by severity: Critical, High, Medium, Low, Safe"),
    attack_type: Optional[str] = Query(default=None, description="Filter by attack type e.g. DDoS, DoS"),
    start_date: Optional[str] = Query(default=None, description="Filter start date ISO string"),
    end_date: Optional[str] = Query(default=None, description="Filter end date ISO string"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Return comprehensive Threat Intelligence Analytics with interactive filters:
    (severity, attack_type, date range).
    """
    await log_audit_event(request, current_user, "Threat Intelligence Analytics Viewed", "Analytics")
    try:
        data = await compute_threat_intelligence_analytics(
            db=db,
            severity_filter=severity,
            attack_type_filter=attack_type,
            start_date=start_date,
            end_date=end_date
        )
        return data
    except Exception as exc:
        logger.exception("Failed to compute threat intelligence analytics")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve threat intelligence analytics"
        ) from exc
