from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId

from app.database import alerts_collection


router = APIRouter()


# ============================================================
# GET ALL ALERTS
# ============================================================

@router.get("/")
def get_alerts(
    limit: int = Query(100, ge=1, le=500)
):
    """
    Get latest alerts from MongoDB.
    """

    try:

        alerts = list(
            alerts_collection.find()
            .sort("timestamp", -1)
            .limit(limit)
        )

        for alert in alerts:

            alert["_id"] = str(
                alert["_id"]
            )

            # Frontend-friendly ID
            alert["id"] = alert["_id"]

            # Default values for older alerts
            alert.setdefault(
                "workflow_status",
                "New"
            )

            alert.setdefault(
                "status",
                "Unknown"
            )

            alert.setdefault(
                "threat_type",
                "Unknown Threat"
            )

            alert.setdefault(
                "severity",
                "Low"
            )

            alert.setdefault(
                "risk_score",
                0
            )

            alert.setdefault(
                "confidence",
                "0%"
            )

        return alerts

    except Exception as error:

        print(
            f"[ALERTS ERROR] {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch alerts"
        )


# ============================================================
# GET SINGLE ALERT
# ============================================================

@router.get("/{alert_id}")
def get_alert(
    alert_id: str
):

    try:

        object_id = ObjectId(
            alert_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    try:

        alert = alerts_collection.find_one(
            {
                "_id": object_id
            }
        )

    except Exception as error:

        print(
            f"[ALERT ERROR] {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Database error"
        )

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert["_id"] = str(
        alert["_id"]
    )

    alert["id"] = alert["_id"]

    alert.setdefault(
        "workflow_status",
        "New"
    )

    return alert


# ============================================================
# UPDATE WORKFLOW STATUS
# ============================================================

@router.put("/{alert_id}/workflow")
def update_alert_workflow(
    alert_id: str,
    workflow_status: str
):

    allowed_statuses = [
        "New",
        "Acknowledged",
        "Investigating",
        "Resolved"
    ]

    if workflow_status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid workflow status. "
                "Allowed values: New, Acknowledged, "
                "Investigating, Resolved"
            )
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

    try:

        result = alerts_collection.update_one(
            {
                "_id": object_id
            },
            {
                "$set": {
                    "workflow_status":
                        workflow_status
                }
            }
        )

    except Exception as error:

        print(
            f"[WORKFLOW ERROR] {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update alert"
        )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return {
        "success": True,
        "alert_id": alert_id,
        "workflow_status":
            workflow_status
    }