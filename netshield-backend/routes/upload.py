from flask import Blueprint, request, jsonify
import os
import pandas as pd
from datetime import datetime, timedelta

from models.predict import predict_attack
from models.alert_service import create_security_alert
from db import get_db_connection

upload_bp = Blueprint("upload", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@upload_bp.route("/upload", methods=["POST"])
def upload_file():
    print("Upload request received")
    if "file" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        df = pd.read_csv(file_path)

        # Limit max batch evaluation to 500 rows for real-time responsiveness
        eval_df = df.head(500) if len(df) > 500 else df

        normal = 0
        attacks = 0
        attack_stats = {}
        severity_dist = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        risk_dist = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
        conf_dist = {"<50%": 0, "50-75%": 0, "75-90%": 0, "90-100%": 0}

        conf_scores = []
        risk_scores = []
        prediction_list = []

        conn = get_db_connection()
        cursor = conn.cursor() if conn else None
        base_time = datetime.now()

        for idx, row in eval_df.iterrows():
            data = row.to_dict()
            res = predict_attack(data)

            c_score = res["confidence_score"]
            r_score = res["risk_score"]
            t_level = res["threat_level"]
            a_cat = res["attack_type"]

            conf_scores.append(c_score)
            risk_scores.append(r_score)

            if not res["is_anomaly"]:
                normal += 1
            else:
                attacks += 1

            severity_dist[t_level] = severity_dist.get(t_level, 0) + 1

            if r_score <= 25: risk_dist["0-25"] += 1
            elif r_score <= 50: risk_dist["26-50"] += 1
            elif r_score <= 75: risk_dist["51-75"] += 1
            else: risk_dist["76-100"] += 1

            if c_score < 50: conf_dist["<50%"] += 1
            elif c_score < 75: conf_dist["50-75%"] += 1
            elif c_score < 90: conf_dist["75-90%"] += 1
            else: conf_dist["90-100%"] += 1

            if a_cat not in attack_stats:
                attack_stats[a_cat] = {"count": 0, "conf_sum": 0.0, "risk_sum": 0, "threat_level": t_level}
            attack_stats[a_cat]["count"] += 1
            attack_stats[a_cat]["conf_sum"] += c_score
            attack_stats[a_cat]["risk_sum"] += r_score

            src_ip = data.get("src_ip") or data.get("source_ip") or f"192.168.1.{100 + (idx % 150)}"
            dst_ip = data.get("dst_ip") or data.get("dest_ip") or f"10.0.{(idx % 5)}.{1 + (idx % 20)}"
            protocol = str(data.get("proto") or data.get("protocol") or ("TCP" if idx % 2 == 0 else "UDP")).upper()
            ts_str = (base_time - timedelta(seconds=idx * 2)).strftime("%Y-%m-%d %H:%M:%S")

            item = {
                "id": idx + 1,
                "timestamp": ts_str,
                "sourceIp": src_ip,
                "destIp": dst_ip,
                "protocol": protocol,
                "prediction": res["prediction"],
                "attackType": a_cat,
                "confidence": res["confidence"],
                "confidence_score": c_score,
                "threat_level": t_level,
                "risk_score": r_score,
                "model_engine": "Random Forest Classifier",
                "status": "Blocked" if res["is_anomaly"] else "Normal Flow"
            }
            prediction_list.append(item)

            if cursor:
                try:
                    cursor.execute("""
                        INSERT INTO anomaly_predictions
                        (source_ip, dest_ip, protocol, prediction, attack_type, confidence, threat_level, risk_score, model_name, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id;
                    """, (
                        src_ip,
                        dst_ip,
                        protocol,
                        res["prediction"],
                        a_cat,
                        c_score,
                        t_level,
                        r_score,
                        "Random Forest Classifier",
                        item["status"]
                    ))
                    pred_row = cursor.fetchone()
                    pred_id = pred_row[0] if pred_row else None
                    conn.commit()

                    if res["is_anomaly"]:
                        create_security_alert(res, src_ip, dst_ip, protocol, pred_id)
                except Exception as insert_err:
                    if conn:
                        conn.rollback()
                    print("Row DB insert error:", insert_err)

        if cursor:
            cursor.close()

        total_evaluated = len(eval_df)
        avg_conf = round(sum(conf_scores) / total_evaluated, 2) if total_evaluated > 0 else 0.0
        avg_risk = round(sum(risk_scores) / total_evaluated, 1) if total_evaluated > 0 else 0.0

        threat_classification = []
        for cat, stat in attack_stats.items():
            cnt = stat["count"]
            pct = round((cnt / total_evaluated) * 100, 1)
            c_avg = round(stat["conf_sum"] / cnt, 2)
            r_avg = round(stat["risk_sum"] / cnt, 1)
            threat_classification.append({
                "attack_type": cat,
                "occurrences": cnt,
                "percentage": f"{pct}%",
                "avg_confidence": f"{c_avg}%",
                "avg_risk_score": r_avg,
                "threat_level": stat["threat_level"]
            })

        return jsonify({
            "message": "Random Forest Dataset Analysis Completed",
            "total_records": len(df),
            "evaluated_records": total_evaluated,
            "normal": normal,
            "attacks": attacks,
            "anomaly_percentage": round((attacks / total_evaluated) * 100, 1) if total_evaluated > 0 else 0.0,
            "normal_percentage": round((normal / total_evaluated) * 100, 1) if total_evaluated > 0 else 0.0,
            "avg_confidence": f"{avg_conf}%",
            "avg_risk_score": avg_risk,
            "high_threats": severity_dist["High"],
            "critical_threats": severity_dist["Critical"],
            "threat_classification": threat_classification,
            "severity_distribution": severity_dist,
            "risk_distribution": risk_dist,
            "confidence_distribution": conf_dist,
            "predictions": prediction_list
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Dataset evaluation error: {str(e)}"}), 400
