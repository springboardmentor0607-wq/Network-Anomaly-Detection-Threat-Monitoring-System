from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/models", tags=["AI Models"])

class ModelActivationSchema(BaseModel):
    is_active: bool

MOCK_MODELS = [
    {
        "id": "mdl-xgb-01",
        "name": "NetShield XGBoost Classifier",
        "version": "v2.4.1",
        "type": "XGBoost",
        "dataset": "CICIDS2017 & UNSW-NB15",
        "trained_at": "2026-08-01T14:30:00Z",
        "accuracy": 0.9842,
        "precision": 0.9785,
        "recall": 0.9810,
        "f1_score": 0.9797,
        "false_positive_rate": 0.012,
        "is_active": True,
        "status": "DEPLOYED",
        "confusion_matrix": {
            "labels": ["Normal", "DoS", "Brute Force", "Scan", "Web Attack"],
            "matrix": [
                [9850, 42, 12, 8, 3],
                [18, 2450, 5, 2, 1],
                [8, 4, 1180, 2, 0],
                [15, 6, 4, 1890, 2],
                [5, 1, 0, 3, 410]
            ]
        }
    },
    {
        "id": "mdl-rf-02",
        "name": "Random Forest Intrusion Detector",
        "version": "v1.9.0",
        "type": "Random Forest",
        "dataset": "UNSW-NB15",
        "trained_at": "2026-07-20T09:15:00Z",
        "accuracy": 0.9675,
        "precision": 0.9610,
        "recall": 0.9650,
        "f1_score": 0.9630,
        "false_positive_rate": 0.024,
        "is_active": False,
        "status": "STANDBY",
        "confusion_matrix": {
            "labels": ["Normal", "DoS", "Brute Force", "Scan"],
            "matrix": [
                [9600, 110, 50, 40],
                [45, 2380, 15, 10],
                [20, 10, 1120, 8],
                [30, 15, 12, 1840]
            ]
        }
    },
    {
        "id": "mdl-iso-03",
        "name": "Isolation Forest Anomaly Engine",
        "version": "v3.0.0-unsupervised",
        "type": "Isolation Forest",
        "dataset": "Live Telemetry Baseline",
        "trained_at": "2026-08-05T18:00:00Z",
        "accuracy": 0.9410,
        "precision": 0.9280,
        "recall": 0.9520,
        "f1_score": 0.9398,
        "false_positive_rate": 0.041,
        "is_active": True,
        "status": "ACTIVE_UNSUPERVISED",
        "confusion_matrix": {
            "labels": ["Normal", "Anomaly"],
            "matrix": [
                [14200, 310],
                [180, 1240]
            ]
        }
    }
]

@router.get("", response_model=List[dict])
def list_models(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return MOCK_MODELS

@router.get("/{model_id}", response_model=dict)
def get_model(model_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for mdl in MOCK_MODELS:
        if mdl["id"] == model_id:
            return mdl
    raise HTTPException(status_code=404, detail="Model not found")

@router.post("/{model_id}/activate", response_model=dict)
def activate_model(model_id: str, payload: ModelActivationSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target = None
    for mdl in MOCK_MODELS:
        if mdl["id"] == model_id:
            target = mdl
            mdl["is_active"] = payload.is_active
            mdl["status"] = "DEPLOYED" if payload.is_active else "STANDBY"
        elif payload.is_active and mdl["type"] == "XGBoost":
            mdl["is_active"] = False
            mdl["status"] = "STANDBY"
    if not target:
        raise HTTPException(status_code=404, detail="Model not found")
    return target
