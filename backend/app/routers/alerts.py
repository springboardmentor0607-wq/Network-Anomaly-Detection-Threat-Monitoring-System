from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.database.mongodb import alerts_collection


router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"]
)


# =========================================================
# GET ALL ALERTS
# =========================================================

@router.get("/")
def get_alerts():

    alerts = list(
        alerts_collection.find(
            {},
            {"_id": 0}
        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "total": len(alerts),
        "alerts": alerts
    }


# =========================================================
# GET OPEN / NEW ALERTS
# =========================================================

@router.get("/active")
def get_active_alerts():

    alerts = list(
        alerts_collection.find(
            {
                "status": {
                    "$in": [
                        "New",
                        "Investigating"
                    ]
                }
            },
            {"_id": 0}
        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "total": len(alerts),
        "alerts": alerts
    }


# =========================================================
# ALERT STATISTICS
# =========================================================

@router.get("/statistics")
def alert_statistics():

    total = alerts_collection.count_documents({})

    new = alerts_collection.count_documents({
        "status": "New"
    })

    investigating = alerts_collection.count_documents({
        "status": "Investigating"
    })

    resolved = alerts_collection.count_documents({
        "status": "Resolved"
    })

    critical = alerts_collection.count_documents({
        "severity": "Critical"
    })

    high = alerts_collection.count_documents({
        "severity": "High"
    })

    medium = alerts_collection.count_documents({
        "severity": "Medium"
    })

    return {

        "total_alerts": total,

        "new_alerts": new,

        "investigating_alerts": investigating,

        "resolved_alerts": resolved,

        "critical_alerts": critical,

        "high_alerts": high,

        "medium_alerts": medium

    }


# =========================================================
# UPDATE ALERT STATUS
# =========================================================

@router.put("/{alert_id}/status")
def update_alert_status(
    alert_id: str,
    status: str
):

    allowed_status = [
        "New",
        "Investigating",
        "Resolved"
    ]

    if status not in allowed_status:

        raise HTTPException(
            status_code=400,
            detail="Invalid alert status"
        )

    try:

        object_id = ObjectId(
            alert_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    result = alerts_collection.update_one(

        {
            "_id": object_id
        },

        {
            "$set": {
                "status": status,
                "updated_at": __import__(
                    "datetime"
                ).datetime.now(
                    __import__(
                        "datetime"
                    ).timezone.utc
                )
            }
        }

    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return {
        "message": "Alert status updated",
        "status": status
    }