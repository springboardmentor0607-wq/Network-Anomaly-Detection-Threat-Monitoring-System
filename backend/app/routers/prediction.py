from fastapi import APIRouter, HTTPException

from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse
)

from app.services.prediction_service import (
    predict_cic,
    predict_unsw
)

router = APIRouter(
    prefix="/api/predict",
    tags=["Prediction"]
)


# ==========================================
# CICIDS2017 Prediction
# ==========================================

@router.post(
    "/cic",
    response_model=PredictionResponse
)
def predict_cic_attack(request: PredictionRequest):

    try:

        result = predict_cic(request.features)

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# UNSW-NB15 Prediction
# ==========================================

@router.post(
    "/unsw",
    response_model=PredictionResponse
)
def predict_unsw_attack(request: PredictionRequest):

    try:

        result = predict_unsw(request.features)

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# API Health Check
# ==========================================

@router.get("/status")
def status():

    return {
        "status": "Prediction API Running",
        "models": [
            "CICIDS2017",
            "UNSW-NB15"
        ]
    }