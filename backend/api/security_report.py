from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from database import SessionLocal


router = APIRouter(
    prefix="/security-reports",
    tags=["Security Reports"]
)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# SECURITY INCIDENT REPORT
# ============================================================

@router.get("/")
def get_security_report(
    db: Session = Depends(get_db)
):

    alerts = (
        db.query(models.Alert)
        .order_by(
            models.Alert.detected_at.desc()
        )
        .all()
    )

    incidents = (
        db.query(models.Incident)
        .order_by(
            models.Incident.created_at.desc()
        )
        .all()
    )


    # Map alert ID -> incident
    incident_map = {}

    for incident in incidents:

        incident_map[
            incident.alert_id
        ] = incident


    report = []

    for alert in alerts:

        incident = incident_map.get(
            alert.id
        )


        report.append({

            "alert_id":
                alert.id,

            "dataset":
                alert.dataset,

            "attack_type":
                alert.attack_type,

            "severity":
                alert.severity,

            "source":
                alert.source,

            "source_ip":
                alert.source_ip,

            "destination_ip":
                alert.destination_ip,

            "protocol":
                alert.protocol,

            "detection_details":
                alert.detection_details,

            "risk_score":
                alert.risk_score,

            "risk_level":
                alert.risk_level,

            "alert_status":
                alert.status,

            "detected_at":
                alert.detected_at,

            "incident_id":
                incident.incident_id
                if incident
                else None,

            "incident_status":
                incident.status
                if incident
                else "No Incident",

            "assigned_to":
                incident.assigned_to
                if incident
                else None,

            "incident_created_at":
                incident.created_at
                if incident
                else None,

            "incident_resolved_at":
                incident.resolved_at
                if incident
                else None
        })


    # ========================================================
    # SUMMARY
    # ========================================================

    total_alerts = len(alerts)

    critical_alerts = sum(
        1
        for alert in alerts
        if str(alert.severity).lower()
        == "critical"
    )

    high_alerts = sum(
        1
        for alert in alerts
        if str(alert.severity).lower()
        == "high"
    )

    open_incidents = sum(
        1
        for incident in incidents
        if incident.status == "Open"
    )

    in_progress_incidents = sum(
        1
        for incident in incidents
        if incident.status == "In Progress"
    )

    resolved_incidents = sum(
        1
        for incident in incidents
        if incident.status == "Resolved"
    )


    return {

        "summary": {

            "total_alerts":
                total_alerts,

            "critical_alerts":
                critical_alerts,

            "high_alerts":
                high_alerts,

            "total_incidents":
                len(incidents),

            "open_incidents":
                open_incidents,

            "in_progress_incidents":
                in_progress_incidents,

            "resolved_incidents":
                resolved_incidents
        },

        "reports":
            report
    }