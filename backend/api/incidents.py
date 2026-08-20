from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas
from database import SessionLocal


router = APIRouter(
    prefix="/incidents",
    tags=["Incident Management"]
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
# CREATE INCIDENT
# ============================================================

@router.post("/")
def create_incident(
    incident: schemas.IncidentCreate,
    db: Session = Depends(get_db)
):

    new_incident = models.Incident(

        incident_id=
            f"INC-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",

        alert_id=incident.alert_id,

        dataset=incident.dataset,

        attack_type=incident.attack_type,

        severity=incident.severity,

        source=incident.source,

        risk_score=incident.risk_score,

        status="Open",

        assigned_to=incident.assigned_to

    )

    db.add(new_incident)

    db.commit()

    db.refresh(new_incident)

    return {
        "message": "Incident created successfully",

        "incident": {
            "id": new_incident.id,
            "incident_id": new_incident.incident_id,
            "alert_id": new_incident.alert_id,
            "dataset": new_incident.dataset,
            "attack_type": new_incident.attack_type,
            "severity": new_incident.severity,
            "source": new_incident.source,
            "risk_score": new_incident.risk_score,
            "status": new_incident.status,
            "assigned_to": new_incident.assigned_to,
            "created_at": new_incident.created_at
        }
    }


# ============================================================
# GET ALL INCIDENTS
# ============================================================

@router.get("/")
def get_incidents(
    db: Session = Depends(get_db)
):

    incidents = (
        db.query(models.Incident)
        .order_by(models.Incident.created_at.desc())
        .all()
    )

    result = []

    for incident in incidents:

        result.append({

            "id": incident.id,

            "incident_id":
                incident.incident_id,

            "alert_id":
                incident.alert_id,

            "dataset":
                incident.dataset,

            "attack_type":
                incident.attack_type,

            "severity":
                incident.severity,

            "source":
                incident.source,

            "risk_score":
                incident.risk_score,

            "status":
                incident.status,

            "assigned_to":
                incident.assigned_to,

            "created_at":
                incident.created_at,

            "resolved_at":
                incident.resolved_at

        })

    return result


# ============================================================
# GET SINGLE INCIDENT
# ============================================================

@router.get("/{incident_id}")
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db)
):

    incident = (
        db.query(models.Incident)
        .filter(
            models.Incident.incident_id == incident_id
        )
        .first()
    )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return {

        "id": incident.id,

        "incident_id":
            incident.incident_id,

        "alert_id":
            incident.alert_id,

        "dataset":
            incident.dataset,

        "attack_type":
            incident.attack_type,

        "severity":
            incident.severity,

        "source":
            incident.source,

        "risk_score":
            incident.risk_score,

        "status":
            incident.status,

        "assigned_to":
            incident.assigned_to,

        "created_at":
            incident.created_at,

        "resolved_at":
            incident.resolved_at
    }


# ============================================================
# UPDATE INCIDENT STATUS
# ============================================================

@router.put("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    update: schemas.IncidentStatusUpdate,
    db: Session = Depends(get_db)
):

    incident = (
        db.query(models.Incident)
        .filter(
            models.Incident.incident_id == incident_id
        )
        .first()
    )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    allowed_statuses = [
        "Open",
        "In Progress",
        "Resolved"
    ]

    if update.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. "
                "Use Open, In Progress, or Resolved."
            )
        )

    incident.status = update.status

    if update.assigned_to is not None:

        incident.assigned_to = update.assigned_to

    if update.status == "Resolved":

        incident.resolved_at = datetime.utcnow()

    else:

        incident.resolved_at = None

    db.commit()

    db.refresh(incident)

    return {

        "message":
            "Incident status updated successfully",

        "incident_id":
            incident.incident_id,

        "status":
            incident.status,

        "assigned_to":
            incident.assigned_to,

        "resolved_at":
            incident.resolved_at
    }