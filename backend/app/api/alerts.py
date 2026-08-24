import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.handler import get_current_user
from app.database.database import get_db
from app.schemas.alert import AlertAcknowledge, AlertCreate, AlertResolve, AlertResponse, AlertFromDataset
from app.services.alert_service import (
    acknowledge_alert,
    create_alert,
    delete_alert,
    get_alert_by_id,
    get_alerts,
    resolve_alert,
)
from app.services.audit_logger import log_audit_event
from app.services.risk_scoring import RiskScoringService

router = APIRouter()
logger = logging.getLogger("netshield.backend.alerts.api")


@router.get("", response_model=List[AlertResponse])
@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    request: Request,
    status_param: Optional[str] = Query(default=None, alias="status", description="Filter by status: Open, Acknowledged, Resolved"),
    severity: Optional[str] = Query(default=None, description="Filter by severity: Critical, High, Medium, Low, Safe"),
    attack_type: Optional[str] = Query(default=None, description="Filter by attack type e.g. DDoS"),
    limit: int = Query(default=100, ge=1, le=1000),
    skip: int = Query(default=0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve a list of security alerts with optional filtering and pagination.
    """
    await log_audit_event(request, current_user, "Alerts List Viewed", "Alerts")
    try:
        alerts = await get_alerts(
            db=db,
            status_filter=status_param,
            severity_filter=severity,
            attack_type_filter=attack_type,
            limit=limit,
            skip=skip
        )
        return alerts
    except Exception as exc:
        logger.exception("Failed to retrieve alerts from MongoDB: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to fetch alerts: {exc}"
        ) from exc


@router.get("/{id}", response_model=AlertResponse)
async def get_alert(
    id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get alert details by alert_id or MongoDB document ID.
    """
    await log_audit_event(request, current_user, f"Alert Details Viewed ({id})", "Alerts")
    alert = await get_alert_by_id(db, id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{id}' not found"
        )
    return alert


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_new_alert(
    alert_in: AlertCreate,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Manually create a new security alert document.
    """
    try:
        created_alert = await create_alert(
            alert_data=alert_in,
            db=db,
            request=request,
            user=current_user
        )
        return created_alert
    except Exception as exc:
        logger.exception("Failed to create alert document")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create alert"
        ) from exc


@router.patch("/{id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert_endpoint(
    id: str,
    request: Request,
    body: Optional[AlertAcknowledge] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Acknowledge an alert and transition its status to 'Acknowledged'.
    """
    assigned_to = body.assigned_to if body else None
    try:
        updated_alert = await acknowledge_alert(
            db=db,
            alert_identifier=id,
            assigned_to=assigned_to,
            user=current_user,
            request=request
        )
        return updated_alert
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to acknowledge alert '{id}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to acknowledge alert"
        ) from exc


@router.patch("/{id}/resolve", response_model=AlertResponse)
async def resolve_alert_endpoint(
    id: str,
    request: Request,
    body: Optional[AlertResolve] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Resolve an alert and transition its status to 'Resolved'.
    """
    assigned_to = body.assigned_to if body else None
    try:
        updated_alert = await resolve_alert(
            db=db,
            alert_identifier=id,
            assigned_to=assigned_to,
            user=current_user,
            request=request
        )
        return updated_alert
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to resolve alert '{id}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve alert"
        ) from exc


@router.delete("/{id}")
async def delete_alert_endpoint(
    id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete an alert document from MongoDB.
    """
    try:
        res = await delete_alert(
            db=db,
            alert_identifier=id,
            user=current_user,
            request=request
        )
        return res
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to delete alert '{id}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete alert"
        ) from exc


@router.post("/from-dataset", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert_from_dataset(
    alert_in: AlertFromDataset,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Promote a dataset-based attack prediction to a security alert document.
    """
    # 1. Validate that the prediction is actually an attack
    if str(alert_in.prediction).lower() != "attack":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only attack predictions can generate security alerts."
        )

    # 2. Prevent duplicates: stable check based on source, IPs, attack type, and timestamp
    duplicate_query = {
        "source": "Dataset",
        "source_ip": alert_in.source_ip,
        "destination_ip": alert_in.destination_ip,
        "attack_type": alert_in.attack_type,
        "timestamp": alert_in.timestamp
    }
    existing = await db["alerts"].find_one(duplicate_query)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Alert already exists"
        )

    try:
        # Convert Pydantic model to dictionary
        alert_dict = alert_in.model_dump(exclude_none=False)
        # Ensure correct source label
        alert_dict["source"] = "Dataset"
        
        # Calculate risk score & severity using modular risk scoring service
        risk_data = RiskScoringService.calculate_risk(alert_in.attack_type, alert_in.confidence)
        alert_dict["risk_score"] = int(round(risk_data["risk_score"]))
        alert_dict["severity"] = risk_data["severity"]

        created_alert = await create_alert(
            alert_data=alert_dict,
            db=db,
            request=request,
            user=current_user
        )
        return created_alert
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to create alert from dataset")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate alert from dataset row"
        ) from exc
