from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import SessionLocal


router = APIRouter(
    prefix="/alerts",
    tags=["Security Alerts"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_alert(
    alert: schemas.AlertCreate,
    db: Session = Depends(get_db)
):

    new_alert = models.Alert(
        dataset=alert.dataset,
        source=alert.source,
        source_ip=alert.source_ip,
        destination_ip=alert.destination_ip,
        protocol=alert.protocol,
        attack_type=alert.attack_type,
        severity=alert.severity,
        risk_score=alert.risk_score,
        risk_level=alert.risk_level,
        status="Open",
        detection_details=alert.detection_details
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return {
        "message": "Security alert created successfully",
        "alert": {
            "id": new_alert.id,
            "dataset": new_alert.dataset,
            "source": new_alert.source,
            "source_ip": new_alert.source_ip,
            "destination_ip": new_alert.destination_ip,
            "protocol": new_alert.protocol,
            "attack_type": new_alert.attack_type,
            "severity": new_alert.severity,
            "risk_score": new_alert.risk_score,
            "risk_level": new_alert.risk_level,
            "status": new_alert.status,
            "detection_details": new_alert.detection_details,
            "detected_at": new_alert.detected_at
        }
    }


@router.get("/")
def get_alerts(
    db: Session = Depends(get_db)
):

    alerts = (
        db.query(models.Alert)
        .order_by(models.Alert.detected_at.desc())
        .all()
    )

    return [
        {
            "id": alert.id,
            "dataset": alert.dataset,
            "source": alert.source,
            "source_ip": alert.source_ip,
            "destination_ip": alert.destination_ip,
            "protocol": alert.protocol,
            "attack_type": alert.attack_type,
            "severity": alert.severity,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "status": alert.status,
            "detection_details": alert.detection_details,
            "detected_at": alert.detected_at
        }
        for alert in alerts
    ]