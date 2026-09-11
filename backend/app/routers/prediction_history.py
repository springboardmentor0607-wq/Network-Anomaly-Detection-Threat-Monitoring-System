from fastapi import APIRouter
from app.database.mongodb import predictions_collection

router = APIRouter(
    prefix="/history",
    tags=["Prediction History"]
)

@router.get("/")
def prediction_history():

    history = []

    data = predictions_collection.find().sort("_id", -1)

    for item in data:

        item["_id"] = str(item["_id"])

        history.append(item)

    return history