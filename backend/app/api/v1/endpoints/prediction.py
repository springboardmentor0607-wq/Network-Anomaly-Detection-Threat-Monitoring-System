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
from app.core.permissions import get_current_user, require_roles
from app.models.role import RoleEnum

router = APIRouter(prefix="/prediction", tags=["Intrusion Prediction"])

def evaluate_intrusion_predictions(db: Session):
    """Evaluate unprocessed traffic flows for intrusion prediction"""
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
            model_name="Intrusion Detection & Classification Model",
            model_version="1.0.0"
        )
        pred_objs.append(pred)

    if pred_objs:
        db.bulk_save_objects(pred_objs)
        db.commit()

    return len(pred_objs)

@router.get("", response_model=PredictionListResponse)
def get_intrusion_predictions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    attack_class: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get intrusion predictions with optional filtering
    
    Supported roles: ADMIN, SOC_MANAGER, SECURITY_ANALYST
    """
    # Evaluate new predictions
    evaluate_intrusion_predictions(db)

    query = db.query(Prediction).join(TrafficFlow)
    
    if attack_class and attack_class.upper() != "ALL":
        query = query.filter(Prediction.predicted_class.ilike(f"%{attack_class}%"))
    
    if min_confidence is not None:
        query = query.filter(Prediction.confidence >= min_confidence)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Get class distribution for risk assessment
    class_counts = db.query(Prediction.predicted_class, func.count(Prediction.id))\
        .group_by(Prediction.predicted_class).all()
    class_dist = {cls_name: count for cls_name, count in class_counts}

    # Get high-risk predictions
    high_risk = db.query(func.count(Prediction.id)).filter(Prediction.confidence >= 0.8).scalar() or 0

    offset = (page - 1) * page_size
    items = query.order_by(desc(Prediction.confidence)).offset(offset).limit(page_size).all()

    response = PredictionListResponse(
        items=[PredictionResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        top_threat_classes=class_dist
    )
    return response

@router.get("/risk-assessment", response_model=dict)
def get_risk_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get overall network risk assessment based on intrusion predictions
    
    Returns risk metrics and threat levels
    """
    # Calculate risk metrics
    high_confidence_preds = db.query(func.count(Prediction.id))\
        .filter(Prediction.confidence >= 0.8).scalar() or 0
    
    medium_confidence_preds = db.query(func.count(Prediction.id))\
        .filter((Prediction.confidence >= 0.6) & (Prediction.confidence < 0.8)).scalar() or 0
    
    total_preds = db.query(func.count(Prediction.id)).scalar() or 0
    
    # Calculate risk score (0.0 - 1.0)
    if total_preds > 0:
        risk_score = min(1.0, (high_confidence_preds * 0.5 + medium_confidence_preds * 0.2) / total_preds)
    else:
        risk_score = 0.0

    # Determine threat level
    if risk_score >= 0.8:
        threat_level = "CRITICAL"
    elif risk_score >= 0.6:
        threat_level = "HIGH"
    elif risk_score >= 0.4:
        threat_level = "MEDIUM"
    else:
        threat_level = "LOW"

    return {
        "risk_score": round(risk_score, 4),
        "threat_level": threat_level,
        "high_confidence_threats": high_confidence_preds,
        "medium_confidence_threats": medium_confidence_preds,
        "total_predictions": total_preds
    }

@router.get("/{id}", response_model=PredictionResponse)
def get_intrusion_prediction(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get detailed intrusion prediction by ID
    """
    pred = db.query(Prediction).filter(Prediction.id == id).first()
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intrusion prediction with ID {id} not found"
        )
    return PredictionResponse.model_validate(pred)

@router.get("/statistics/summary")
def get_prediction_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get intrusion prediction statistics summary
    """
    total = db.query(func.count(Prediction.id)).scalar() or 0
    
    # Get top attack classes
    top_classes = db.query(Prediction.predicted_class, func.count(Prediction.id))\
        .group_by(Prediction.predicted_class)\
        .order_by(desc(func.count(Prediction.id)))\
        .limit(5).all()
    
    # Average confidence
    avg_confidence = db.query(func.avg(Prediction.confidence)).scalar() or 0.0
    
    # Predictions by confidence level
    critical = db.query(func.count(Prediction.id)).filter(Prediction.confidence >= 0.9).scalar() or 0
    high = db.query(func.count(Prediction.id)).filter((Prediction.confidence >= 0.7) & (Prediction.confidence < 0.9)).scalar() or 0
    medium = db.query(func.count(Prediction.id)).filter((Prediction.confidence >= 0.5) & (Prediction.confidence < 0.7)).scalar() or 0
    
    return {
        "total_predictions": total,
        "average_confidence": round(float(avg_confidence), 4),
        "critical_threats": critical,
        "high_threats": high,
        "medium_threats": medium,
        "top_attack_classes": [{"class": cls, "count": cnt} for cls, cnt in top_classes]
    }
