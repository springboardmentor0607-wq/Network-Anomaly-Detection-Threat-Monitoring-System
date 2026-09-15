import uuid
import math
import pandas as pd
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.session import get_db
from app.models.prediction import Prediction
from app.models.traffic import TrafficFlow
from app.models.user import User
from app.schemas.threat import PredictionListResponse, PredictionResponse
from app.ml.inference.attack_classifier import AttackClassifier
from app.core.permissions import get_current_user

router = APIRouter(prefix="/threats", tags=["Attack Classification"])

def evaluate_unprocessed_predictions(db: Session):
    classifier = AttackClassifier(dataset_name="cicids2017")
    flows = db.query(TrafficFlow).filter(~TrafficFlow.predictions.any()).all()

    pred_objs = []
    for flow in flows:
        flow_dict = {
            "Destination Port": [flow.destination_port],
            "Flow Duration": [flow.duration * 1000000.0],
            "Total Fwd Packets": [flow.packets],
            "Total Backward Packets": [0],
            "Total Length of Fwd Packets": [flow.bytes],
            "Total Length of Bwd Packets": [0],
            "Protocol": [flow.protocol],
            "packets": [flow.packets],
            "bytes": [flow.bytes]
        }
        df_flow = pd.DataFrame(flow_dict)
        pred_class, conf, _ = classifier.predict_attack(df_flow)

        pred = Prediction(
            flow_id=flow.id,
            predicted_class=pred_class,
            confidence=conf,
            model_name="Multi-Class Attack Classifier Baseline",
            model_version="1.0.0"
        )
        pred_objs.append(pred)

    if pred_objs:
        db.bulk_save_objects(pred_objs)
        db.commit()

@router.get("", response_model=PredictionListResponse)
def get_threats(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    attack_class: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    evaluate_unprocessed_predictions(db)

    query = db.query(Prediction).join(TrafficFlow)
    if attack_class and attack_class.upper() != "ALL":
        query = query.filter(Prediction.predicted_class.ilike(f"%{attack_class}%"))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Class distribution summary
    class_counts = db.query(Prediction.predicted_class, func.count(Prediction.id))\
        .group_by(Prediction.predicted_class).all()
    class_dist = {cls_name: count for cls_name, count in class_counts}

    offset = (page - 1) * page_size
    items = query.order_by(desc(Prediction.confidence)).offset(offset).limit(page_size).all()

    return PredictionListResponse(
        items=[PredictionResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        top_threat_classes=class_dist
    )

@router.get("/{id}", response_model=PredictionResponse)
def get_threat(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    pred = db.query(Prediction).filter(Prediction.id == id).first()
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat prediction with ID {id} not found"
        )
    return PredictionResponse.model_validate(pred)
