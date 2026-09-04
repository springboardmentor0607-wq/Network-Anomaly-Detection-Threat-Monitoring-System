
from fastapi import APIRouter
from datetime import datetime

from app.database import alerts_collection


# ============================================================
# ROUTER
# ============================================================

router = APIRouter()


# ============================================================
# GET AI PREDICTIONS
# ============================================================

@router.get("/")
def get_predictions():

    try:

        # --------------------------------------------------------
        # Fetch latest alerts from MongoDB
        # --------------------------------------------------------

        alerts = list(
            alerts_collection
            .find({})
            .sort("timestamp", -1)
            .limit(50)
        )

        predictions = []

        for alert in alerts:

            # ----------------------------------------------------
            # MongoDB ID
            # ----------------------------------------------------

            alert_id = str(
                alert.get("_id", "")
            )

            # ----------------------------------------------------
            # Threat information
            # ----------------------------------------------------

            threat_type = (
                alert.get("threat_type")
                or alert.get("prediction")
                or "Unknown"
            )

            severity = (
                alert.get("severity")
                or "Low"
            )

            status = (
                alert.get("status")
                or "Unknown"
            )

            # ----------------------------------------------------
            # Confidence
            # ----------------------------------------------------

            confidence = (
                alert.get("confidence")
                or alert.get("confidence_value")
                or 0
            )

            # Convert "95%" → 95
            if isinstance(confidence, str):

                confidence = (
                    confidence
                    .replace("%", "")
                    .strip()
                )

                try:
                    confidence = float(confidence)
                except ValueError:
                    confidence = 0

            # ----------------------------------------------------
            # Risk score
            # ----------------------------------------------------

            risk_score = alert.get(
                "risk_score",
                0
            )

            try:
                risk_score = float(risk_score)
            except (ValueError, TypeError):
                risk_score = 0

            # ----------------------------------------------------
            # Timestamp
            # ----------------------------------------------------

            timestamp = alert.get(
                "timestamp"
            )

            if isinstance(timestamp, datetime):

                timestamp = timestamp.isoformat()

            elif timestamp:

                timestamp = str(timestamp)

            else:

                timestamp = None

            # ----------------------------------------------------
            # Build prediction object
            # ----------------------------------------------------

            predictions.append({

                "id": alert_id,

                "threat_type": threat_type,

                "severity": severity,

                "confidence": confidence,

                "risk_score": risk_score,

                "status": status,

                "timestamp": timestamp,

                "service": alert.get(
                    "service",
                    "Unknown"
                ),

             "protocol": alert.get(
    "protocol_type",
    alert.get(
        "protocol",
        "Unknown"
    )
),

                "source_ip": alert.get(
                    "source_ip",
                    "Unknown"
                ),

                "destination_ip": alert.get(
                    "destination_ip",
                    "Unknown"
                )

            })

        # ========================================================
        # SUMMARY
        # ========================================================

        total_predictions = len(predictions)

        threat_predictions = sum(
            1
            for prediction in predictions
            if "normal" not in str(
                prediction["threat_type"]
            ).lower()
        )

        critical_predictions = sum(
            1
            for prediction in predictions
            if str(
                prediction["severity"]
            ).lower() == "critical"
        )

        # Average confidence

        if total_predictions > 0:

            average_confidence = round(
                sum(
                    prediction["confidence"]
                    for prediction in predictions
                )
                / total_predictions,
                2
            )

        else:

            average_confidence = 0

        # Average risk

        if total_predictions > 0:

            average_risk = round(
                sum(
                    prediction["risk_score"]
                    for prediction in predictions
                )
                / total_predictions,
                2
            )

        else:

            average_risk = 0

        # ========================================================
        # RESPONSE
        # ========================================================

        return {

            "success": True,

            "summary": {

                "total_predictions":
                    total_predictions,

                "threat_predictions":
                    threat_predictions,

                "critical_predictions":
                    critical_predictions,

                "average_confidence":
                    average_confidence,

                "average_risk":
                    average_risk

            },

            "predictions":
                predictions

        }

    except Exception as e:

        print(
            "[PREDICTIONS ERROR]",
            str(e)
        )

        return {

            "success": False,

            "summary": {

                "total_predictions": 0,

                "threat_predictions": 0,

                "critical_predictions": 0,

                "average_confidence": 0,

                "average_risk": 0

            },

            "predictions": [],

            "error": str(e)

        }

