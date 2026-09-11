from datetime import datetime, timezone

from app.database.mongodb import alerts_collection


# =========================================================
# RISK / SEVERITY CALCULATION
# =========================================================

def calculate_severity(attack_type: str, confidence: float):

    attack = attack_type.lower()

    if attack in ["benign", "normal"]:
        return "Normal"

    if attack in [
        "ddos",
        "dos",
        "bot",
        "infiltration"
    ]:
        return "Critical" if confidence >= 90 else "High"

    if attack in [
        "brute force",
        "bruteforce",
        "sql injection",
        "web attack"
    ]:
        return "High"

    if attack in [
        "port scan",
        "portscan",
        "scanning"
    ]:
        return "Medium"

    return "Medium"


# =========================================================
# CREATE ALERT
# =========================================================

def create_alert(
    dataset: str,
    attack_type: str,
    detected_count: int,
    confidence: float
):

    # Do not create alerts for normal traffic
    if attack_type.lower() in ["benign", "normal"]:
        return None

    severity = calculate_severity(
        attack_type,
        confidence
    )

    alert = {

        "dataset": dataset,

        "attack_type": attack_type,

        "detected_count": int(
            detected_count
        ),

        "confidence": float(
            confidence
        ),

        "severity": severity,

        "status": "New",

        "created_at": datetime.now(
            timezone.utc
        )

    }

    result = alerts_collection.insert_one(
        alert
    )

    alert["_id"] = str(result.inserted_id)

    return alert