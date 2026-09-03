from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import json
from app.core.ml_service import ml_service

router = APIRouter()
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "reports")

class PredictionRequest(BaseModel):
    features: Dict[str, float]
    dataset: str = "CICIDS2017"

def get_report_dir(dataset: str) -> str:
    if dataset == "UNSW-NB15":
        return os.path.join(REPORTS_DIR, "unswnb15")
    return os.path.join(REPORTS_DIR, "cicids")

@router.post("/predict")
async def predict_threat(request: PredictionRequest):
    """
    Predicts the threat class and computes a risk score based on network features.
    """
    result = ml_service.predict(request.features, dataset=request.dataset)
    if result.get("status") == "failed":
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result

@router.get("/reports/metrics")
async def get_metrics(dataset: str = Query("CICIDS2017")):
    path = os.path.join(get_report_dir(dataset), "metrics.json")
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Metrics report not found.")

@router.get("/reports/cross-validation")
async def get_cross_validation(dataset: str = Query("CICIDS2017")):
    path = os.path.join(get_report_dir(dataset), "cross_validation.json")
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Cross-validation report not found.")

@router.get("/reports/threat-analysis")
async def get_threat_analysis(dataset: str = Query("CICIDS2017")):
    path = os.path.join(get_report_dir(dataset), "threat_analysis.json")
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        # Return empty data instead of 404 to avoid frontend crash if not scored yet
        return {
            "total_predictions": 0, 
            "most_frequent_attack": "N/A",
            "risk_score_distribution": {"Low":0, "Medium":0, "High":0, "Critical":0},
            "attack_distribution": {},
            "anomalies_detected": 0,
            "system_status": "No Data"
        }

@router.get("/reports/epoch-metrics")
async def get_epoch_metrics(dataset: str = Query("CICIDS2017")):
    path = os.path.join(get_report_dir(dataset), "epoch_metrics.csv")
    if os.path.exists(path):
        return FileResponse(path, media_type="text/csv", filename="epoch_metrics.csv")
    raise HTTPException(status_code=404, detail="Epoch metrics not found.")
