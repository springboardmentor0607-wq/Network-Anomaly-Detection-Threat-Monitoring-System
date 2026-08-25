from flask import Blueprint, request, jsonify
from models.predict import predict_attack
from models.alert_service import create_security_alert
from db import get_db_connection

predict_bp = Blueprint("predict", __name__)

@predict_bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}

    try:
        res = predict_attack(data)

        # Extract network parameters or assign defaults
        source_ip = data.get("source_ip") or data.get("src_ip") or "192.168.1.100"
        dest_ip = data.get("dest_ip") or data.get("dst_ip") or "10.0.0.1"
        protocol = str(data.get("proto") or data.get("protocol") or "TCP").upper()

        prediction_id = None

        # Database insertion for anomaly_predictions
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO anomaly_predictions
                    (source_ip, dest_ip, protocol, prediction, attack_type, confidence, threat_level, risk_score, model_name, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                """, (
                    source_ip,
                    dest_ip,
                    protocol,
                    res["prediction"],
                    res["attack_type"],
                    res["confidence_score"],
                    res["threat_level"],
                    res["risk_score"],
                    "Random Forest Classifier",
                    "Blocked" if res["is_anomaly"] else "Normal Flow"
                ))
                row = cursor.fetchone()
                if row:
                    prediction_id = row[0]
                conn.commit()
                cursor.close()
            except Exception as db_err:
                if conn:
                    conn.rollback()
                print("Anomaly prediction DB insert error:", db_err)

        alert_info = None
        if res["is_anomaly"]:
            alert_info = create_security_alert(res, source_ip, dest_ip, protocol, prediction_id)

        actual_class = data.get("actual_class") or data.get("expected_attack") or data.get("attack_cat") or None

        response_payload = {
            "prediction": res["prediction"],
            "is_anomaly": res["is_anomaly"],
            "attack_type": res["attack_type"],
            "confidence": res["confidence"],
            "confidence_score": res["confidence_score"],
            "threat_level": res["threat_level"],
            "risk_score": res["risk_score"],
            "model_engine": "Random Forest Classifier",
            "source_ip": source_ip,
            "dest_ip": dest_ip,
            "protocol": protocol,
            "actual_class": actual_class,
            "alert_generated": res["is_anomaly"]
        }

        if res["is_anomaly"] and alert_info:
            response_payload["alert_id"] = alert_info["alert_id"]
            response_payload["alert_status"] = alert_info["status"]
            response_payload["alert_details"] = alert_info

        return jsonify(response_payload), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "message": str(e)
        }), 400