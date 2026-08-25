from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

import models
from database import SessionLocal


router = APIRouter(
    prefix="/analytics",
    tags=["Security Analytics"]
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
# SECURITY ANALYTICS
# ============================================================

@router.get("/")
def get_security_analytics(
    db: Session = Depends(get_db)
):

    # ========================================================
    # ATTACK TYPE DISTRIBUTION
    # ========================================================

    attack_rows = (
        db.query(
            models.Alert.attack_type,
            func.count(models.Alert.id)
        )
        .group_by(
            models.Alert.attack_type
        )
        .order_by(
            func.count(models.Alert.id).desc()
        )
        .all()
    )

    attack_distribution = [
        {
            "name": attack_type or "Unknown",
            "value": count
        }
        for attack_type, count in attack_rows
    ]


    # ========================================================
    # SEVERITY DISTRIBUTION
    # ========================================================

    severity_rows = (
        db.query(
            models.Alert.severity,
            func.count(models.Alert.id)
        )
        .group_by(
            models.Alert.severity
        )
        .order_by(
            func.count(models.Alert.id).desc()
        )
        .all()
    )

    severity_distribution = [
        {
            "name": severity or "Unknown",
            "value": count
        }
        for severity, count in severity_rows
    ]


    # ========================================================
    # DATASET DISTRIBUTION
    # ========================================================

    dataset_rows = (
        db.query(
            models.Alert.dataset,
            func.count(models.Alert.id)
        )
        .group_by(
            models.Alert.dataset
        )
        .order_by(
            func.count(models.Alert.id).desc()
        )
        .all()
    )

    dataset_distribution = [
        {
            "name": dataset or "Unknown",
            "value": count
        }
        for dataset, count in dataset_rows
    ]


    # ========================================================
    # DAILY ATTACK TREND - LAST 14 DAYS
    # ========================================================

    today = datetime.utcnow().date()

    start_date = today - timedelta(
        days=13
    )

    daily_rows = (
        db.query(
            func.date(models.Alert.detected_at),
            func.count(models.Alert.id)
        )
        .filter(
            models.Alert.detected_at >=
            datetime.combine(
                start_date,
                datetime.min.time()
            )
        )
        .group_by(
            func.date(models.Alert.detected_at)
        )
        .order_by(
            func.date(models.Alert.detected_at)
        )
        .all()
    )

    daily_lookup = {
        str(day): count
        for day, count in daily_rows
    }

    daily_trend = []

    for i in range(14):

        current_date = (
            start_date +
            timedelta(days=i)
        )

        date_string = str(
            current_date
        )

        daily_trend.append({

            "date":
                date_string,

            "attacks":
                daily_lookup.get(
                    date_string,
                    0
                )
        })


    # ========================================================
    # WEEKLY ATTACK TREND - LAST 8 WEEKS
    # ========================================================

    weekly_trend = []

    for week_offset in range(7, -1, -1):

        week_end = (
            today -
            timedelta(
                days=week_offset * 7
            )
        )

        week_start = (
            week_end -
            timedelta(days=6)
        )

        count = (
            db.query(
                func.count(
                    models.Alert.id
                )
            )
            .filter(
                models.Alert.detected_at >=
                datetime.combine(
                    week_start,
                    datetime.min.time()
                ),
                models.Alert.detected_at <
                datetime.combine(
                    week_end +
                    timedelta(days=1),
                    datetime.min.time()
                )
            )
            .scalar()
        )

        weekly_trend.append({

            "week":
                f"{week_start} to {week_end}",

            "attacks":
                count or 0
        })


    # ========================================================
    # TOTAL NETWORK SECURITY STATISTICS
    # ========================================================

    total_alerts = (
        db.query(
            func.count(models.Alert.id)
        )
        .scalar()
        or 0
    )

    critical_alerts = (
        db.query(
            func.count(models.Alert.id)
        )
        .filter(
            func.lower(
                models.Alert.severity
            ) == "critical"
        )
        .scalar()
        or 0
    )

    high_alerts = (
        db.query(
            func.count(models.Alert.id)
        )
        .filter(
            func.lower(
                models.Alert.severity
            ) == "high"
        )
        .scalar()
        or 0
    )

    medium_alerts = (
        db.query(
            func.count(models.Alert.id)
        )
        .filter(
            func.lower(
                models.Alert.severity
            ) == "medium"
        )
        .scalar()
        or 0
    )

    low_alerts = (
        db.query(
            func.count(models.Alert.id)
        )
        .filter(
            func.lower(
                models.Alert.severity
            ) == "low"
        )
        .scalar()
        or 0
    )


    return {

        "summary": {

            "total_alerts":
                total_alerts,

            "critical_alerts":
                critical_alerts,

            "high_alerts":
                high_alerts,

            "medium_alerts":
                medium_alerts,

            "low_alerts":
                low_alerts
        },

        "attack_distribution":
            attack_distribution,

        "severity_distribution":
            severity_distribution,

        "dataset_distribution":
            dataset_distribution,

        "daily_trend":
            daily_trend,

        "weekly_trend":
            weekly_trend
    }