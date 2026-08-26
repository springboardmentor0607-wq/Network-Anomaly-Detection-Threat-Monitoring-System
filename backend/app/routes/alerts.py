from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from bson import ObjectId

from app.database import alerts_collection
from app.ai.report_generator import generate_pdf_report


router = APIRouter()


# ============================================================
# GET ALL ALERTS
# ============================================================

@router.get("/")
def get_alerts(
    limit: int = Query(100, ge=1, le=500)
):
    try:
        alerts = list(
            alerts_collection.find()
            .sort("timestamp", -1)
            .limit(limit)
        )

        for alert in alerts:
            alert["_id"] = str(alert["_id"])
            alert["id"] = alert["_id"]

            alert.setdefault("workflow_status", "New")
            alert.setdefault("status", "Unknown")
            alert.setdefault("threat_type", "Unknown Threat")
            alert.setdefault("severity", "Low")
            alert.setdefault("risk_score", 0)
            alert.setdefault("confidence", "0%")

        return alerts

    except Exception as error:
        print(f"[ALERTS ERROR] {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch alerts"
        )


# ============================================================
# GET SINGLE ALERT
# ============================================================

@router.get("/{alert_id}")
def get_alert(alert_id: str):

    try:
        object_id = ObjectId(alert_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    try:
        alert = alerts_collection.find_one(
            {"_id": object_id}
        )
    except Exception as error:
        print(f"[ALERT ERROR] {error}")

        raise HTTPException(
            status_code=500,
            detail="Database error"
        )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert["_id"] = str(alert["_id"])
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
    workflow_status: str = Query(...)
):

    workflow_status = workflow_status.strip()

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

    # --------------------------------------------------------
    # VALIDATE OBJECT ID
    # --------------------------------------------------------

    try:
        object_id = ObjectId(alert_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    # --------------------------------------------------------
    # UPDATE DATABASE
    # --------------------------------------------------------

    try:

        result = alerts_collection.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "workflow_status": workflow_status
                }
            }
        )

    except Exception as error:

        print(
            f"[WORKFLOW UPDATE ERROR] {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update alert workflow"
        )

    # --------------------------------------------------------
    # ALERT NOT FOUND
    # --------------------------------------------------------

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    print(
        f"[WORKFLOW] Alert {alert_id} "
        f"changed to {workflow_status}"
    )

    return {
        "success": True,
        "message": "Workflow status updated successfully",
        "alert_id": alert_id,
        "workflow_status": workflow_status
    }
# ============================================================
# ACKNOWLEDGE ALERT
# ============================================================

@router.put("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):

    try:
        object_id = ObjectId(alert_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    try:

        result = alerts_collection.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "workflow_status": "Acknowledged"
                }
            }
        )

    except Exception as error:

        print(
            f"[ACKNOWLEDGE ERROR] {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to acknowledge alert"
        )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    print(
        f"[ACKNOWLEDGED] Alert {alert_id}"
    )

    return {
        "success": True,
        "message": "Alert acknowledged successfully",
        "alert_id": alert_id,
        "workflow_status": "Acknowledged"
    }


# ============================================================
# GENERATE SECURITY REPORT
# ============================================================

@router.get("/report/{alert_id}")
def generate_security_report(alert_id: str):

    try:
        object_id = ObjectId(alert_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    alert = alerts_collection.find_one(
        {"_id": object_id}
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    file_path = generate_pdf_report(alert)

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"security_report_{alert_id}.pdf"
    )

# ============================================================
# INVESTIGATION NOTES
# ============================================================

@router.put("/{alert_id}/notes")
def update_investigation_notes(
    alert_id: str,
    notes: str
):
    # --------------------------------------------------------
    # VALIDATE OBJECT ID
    # --------------------------------------------------------

    try:
        object_id = ObjectId(alert_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    # --------------------------------------------------------
    # UPDATE NOTES
    # --------------------------------------------------------

    try:

        result = alerts_collection.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "investigation_notes": notes
                }
            }
        )

    except Exception as error:

        print(
            f"[NOTES UPDATE ERROR] {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to save investigation notes"
        )

    # --------------------------------------------------------
    # ALERT NOT FOUND
    # --------------------------------------------------------

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    print(
        f"[NOTES] Investigation notes updated for {alert_id}"
    )

    return {
        "success": True,
        "message": "Investigation notes saved successfully",
        "alert_id": alert_id,
        "notes": notes
    }

