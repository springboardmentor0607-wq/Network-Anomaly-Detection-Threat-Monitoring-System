import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.alert import AlertListResponse, AlertResponse, AlertAssignRequest, AlertActionRequest
from app.services.alert_service import AlertService
from app.models.alert import Alert
from app.models.user import User
from app.models.role import RoleEnum
from app.core.permissions import get_current_user, require_roles

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("", response_model=AlertListResponse)
def get_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return AlertService.get_paginated_alerts(
        db, page=page, page_size=page_size, status_filter=status_filter,
        severity_filter=severity_filter, search=search
    )

@router.get("/{id}", response_model=AlertResponse)
def get_alert(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {id} not found"
        )
    return AlertResponse.model_validate(alert)

@router.post("/{id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST]))
) -> Any:
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return AlertResponse.model_validate(AlertService.acknowledge_alert(db, alert, current_user))

@router.post("/{id}/assign", response_model=AlertResponse)
def assign_alert(
    id: uuid.UUID,
    payload: AlertAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST]))
) -> Any:
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    assignee = db.query(User).filter(User.id == payload.user_id).first()
    if not assignee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee user not found")

    return AlertResponse.model_validate(AlertService.assign_alert(db, alert, assignee, current_user))

@router.post("/{id}/resolve", response_model=AlertResponse)
def resolve_alert(
    id: uuid.UUID,
    payload: AlertActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST]))
) -> Any:
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return AlertResponse.model_validate(AlertService.resolve_alert(db, alert, current_user, notes=payload.notes))

@router.post("/{id}/false-positive", response_model=AlertResponse)
def mark_false_positive(
    id: uuid.UUID,
    payload: AlertActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST]))
) -> Any:
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return AlertResponse.model_validate(AlertService.mark_false_positive(db, alert, current_user, notes=payload.notes))
