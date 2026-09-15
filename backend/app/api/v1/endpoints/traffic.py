import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.traffic import TrafficFlowListResponse, TrafficFlowResponse, TrafficStatsResponse, DatasetUploadResponse
from app.services.traffic_service import TrafficService
from app.models.traffic import TrafficFlow
from app.models.user import User
from app.core.permissions import get_current_user

router = APIRouter(prefix="/traffic", tags=["Traffic Telemetry"])

@router.get("", response_model=TrafficFlowListResponse)
def get_traffic(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    protocol: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return TrafficService.get_paginated_flows(
        db, page=page, page_size=page_size, protocol=protocol, search=search
    )

@router.get("/stats", response_model=TrafficStatsResponse)
def get_traffic_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return TrafficService.get_traffic_stats(db)

@router.get("/{id}", response_model=TrafficFlowResponse)
def get_traffic_flow(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    flow = db.query(TrafficFlow).filter(TrafficFlow.id == id).first()
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Traffic flow with ID {id} not found"
        )
    return TrafficFlowResponse.model_validate(flow)

@router.post("/upload", response_model=DatasetUploadResponse)
def upload_dataset_csv(
    file: UploadFile = File(...),
    dataset_type: str = Form("CICIDS2017"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return TrafficService.process_csv_upload(db, file=file, dataset_type=dataset_type)
