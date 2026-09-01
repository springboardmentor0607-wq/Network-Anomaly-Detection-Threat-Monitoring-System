import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.anomaly import AnomalyListResponse, AnomalyResponse
from app.services.detection_service import DetectionService
from app.models.anomaly import Anomaly
from app.models.user import User
from app.core.permissions import get_current_user

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.get("", response_model=AnomalyListResponse)
def get_anomalies(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    min_score: Optional[float] = Query(None, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return DetectionService.get_paginated_anomalies(
        db, page=page, page_size=page_size, min_score=min_score
    )

@router.get("/{id}", response_model=AnomalyResponse)
def get_anomaly(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    anomaly = db.query(Anomaly).filter(Anomaly.id == id).first()
    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Anomaly with ID {id} not found"
        )
    return AnomalyResponse.model_validate(anomaly)
