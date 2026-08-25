from datetime import datetime
from db import get_db_connection

# Unified Threat Severity Mapping dictionary across NetShield AI
SEVERITY_MAP = {
    "Normal": "Low",
    "Reconnaissance": "Medium",
    "Analysis": "Medium",
    "Fuzzers": "Medium",
    "Exploits": "High",
    "Generic": "High",
    "DoS": "Critical",
    "Backdoor": "Critical",
    "Shellcode": "Critical",
    "Worms": "Critical"
}

def get_threat_severity(attack_type, is_anomaly=True):
    """
    Returns threat severity for a given attack type.
    """
    if not is_anomaly or attack_type == "Normal":
        return "Low"
    return SEVERITY_MAP.get(attack_type, "High")

def create_security_alert(res, source_ip, dest_ip, protocol, prediction_id=None):
    """
    Generates a single security alert from a real model prediction and persists it in PostgreSQL.
    Returns the complete alert dictionary.
    """
    attack_type = res.get("attack_type", "Anomalous Traffic")
    severity = res.get("threat_level") or get_threat_severity(attack_type, res.get("is_anomaly", True))
    confidence_score = res.get("confidence_score", 95.0)
    risk_score = res.get("risk_score", 70)
    prediction = res.get("prediction", f"Anomalous Traffic ({attack_type})")
    model_engine = res.get("model_engine", "Random Forest Classifier")
    timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    inserted_id = None
    alert_id_str = f"ALERT-{int(datetime.now().timestamp() * 1000) % 1000000}"

    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO alerts
                (attack_type, severity, source_ip, dest_ip, protocol, status, acknowledged, confidence, risk_score, prediction, model_engine, prediction_id, incident_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                attack_type,
                severity,
                source_ip,
                dest_ip,
                protocol,
                "New",
                False,
                confidence_score,
                risk_score,
                prediction,
                model_engine,
                prediction_id,
                None  # incident_id is NULL initially for Milestone-3 Step 1
            ))
            row = cursor.fetchone()
            if row:
                inserted_id = row[0]
                alert_id_str = f"ALERT-{inserted_id:04d}"
                cursor.execute("UPDATE alerts SET alert_id = %s WHERE id = %s;", (alert_id_str, inserted_id))
            conn.commit()
            cursor.close()
        except Exception as db_err:
            if conn:
                conn.rollback()
            print("[ERROR] Failed to insert alert into database:", db_err)

    return {
        "alert_id": alert_id_str,
        "db_id": inserted_id,
        "attack_type": attack_type,
        "threat_severity": severity,
        "severity": severity,
        "ai_confidence": res.get("confidence", f"{confidence_score:.2f}%"),
        "confidence_score": confidence_score,
        "risk_score": risk_score,
        "source_ip": source_ip,
        "dest_ip": dest_ip,
        "protocol": protocol,
        "timestamp": timestamp_now,
        "status": "New",
        "acknowledged": False,
        "prediction": prediction,
        "model_engine": model_engine,
        "prediction_id": prediction_id,
        "incident_id": None
    }
