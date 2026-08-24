from fastapi import APIRouter, HTTPException

from app.database import alerts_collection

from collections import Counter
from datetime import datetime, timedelta


router = APIRouter(
    prefix="/analytics",
    tags=["SOC Analytics"]
)


# ============================================================
# SOC ANALYTICS
# ============================================================

@router.get("/")
def get_analytics():

    try:

        # ----------------------------------------------------
        # FETCH ALERTS
        # ----------------------------------------------------

        alerts = list(
            alerts_collection.find()
        )

        # ----------------------------------------------------
        # BASIC COUNTS
        # ----------------------------------------------------

        total_alerts = len(alerts)

        threat_alerts = 0
        normal_alerts = 0

        critical_alerts = 0
        high_alerts = 0
        medium_alerts = 0
        low_alerts = 0

        total_risk = 0

        # ----------------------------------------------------
        # COUNTERS
        # ----------------------------------------------------

        threat_types = Counter()
        severity_distribution = Counter()
        protocol_distribution = Counter()
        service_distribution = Counter()

        # ----------------------------------------------------
        # PROCESS ALERTS
        # ----------------------------------------------------

        for alert in alerts:

            status = str(
                alert.get("status", "")
            ).lower()

            threat_type = str(
                alert.get(
                    "threat_type",
                    alert.get(
                        "prediction",
                        "Unknown"
                    )
                )
            )

            severity = str(
                alert.get(
                    "severity",
                    "Low"
                )
            )

            protocol = str(
                alert.get(
                    "protocol_type",
                    alert.get(
                        "protocol",
                        "Unknown"
                    )
                )
            )

            service = str(
                alert.get(
                    "service",
                    "Unknown"
                )
            )

            risk = alert.get(
                "risk_score",
                0
            )

            try:
                risk = float(risk)
            except:
                risk = 0

            total_risk += risk

            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------

            if "normal" in status:

                normal_alerts += 1

            else:

                threat_alerts += 1

            # ------------------------------------------------
            # SEVERITY
            # ------------------------------------------------

            severity_lower = severity.lower()

            if severity_lower == "critical":

                critical_alerts += 1

            elif severity_lower == "high":

                high_alerts += 1

            elif severity_lower == "medium":

                medium_alerts += 1

            else:

                low_alerts += 1

            # ------------------------------------------------
            # DISTRIBUTIONS
            # ------------------------------------------------

            threat_types[threat_type] += 1

            severity_distribution[
                severity
            ] += 1

            protocol_distribution[
                protocol
            ] += 1

            service_distribution[
                service
            ] += 1

        # ----------------------------------------------------
        # AVERAGE RISK
        # ----------------------------------------------------

        average_risk = (
            round(
                total_risk / total_alerts,
                2
            )
            if total_alerts > 0
            else 0
        )

        # ----------------------------------------------------
        # RETURN ANALYTICS
        # ----------------------------------------------------

        return {

            "success": True,

            "summary": {

                "total_alerts":
                    total_alerts,

                "threat_alerts":
                    threat_alerts,

                "normal_alerts":
                    normal_alerts,

                "critical_alerts":
                    critical_alerts,

                "high_alerts":
                    high_alerts,

                "medium_alerts":
                    medium_alerts,

                "low_alerts":
                    low_alerts,

                "average_risk":
                    average_risk
            },

            "threat_types": [
                {
                    "name": name,
                    "value": count
                }

                for name, count
                in threat_types.items()
            ],

            "severity_distribution": [
                {
                    "name": name,
                    "value": count
                }

                for name, count
                in severity_distribution.items()
            ],

            "protocol_distribution": [
                {
                    "name": name,
                    "value": count
                }

                for name, count
                in protocol_distribution.items()
            ],

            "service_distribution": [
                {
                    "name": name,
                    "value": count
                }

                for name, count
                in service_distribution.items()
            ]
        }

    except Exception as error:

        print(
            f"[ANALYTICS ERROR] {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate analytics"
        )