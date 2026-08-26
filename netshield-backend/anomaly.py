from fastapi import APIRouter, HTTPException
from ml.predict import predict_intrusion

router = APIRouter(
    prefix="/api/anomaly",
    tags=["Anomaly Detection"]
)


@router.post("/detect")
def detect_anomaly(data: dict):
    try:
        result = predict_intrusion(data)

        return {
            "success": True,
            "prediction": result["prediction"],
            "label": result["label"],
            "attack_probability": result["attack_probability"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )