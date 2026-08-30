import os
import json
import asyncio
import urllib.request
import urllib.error
from datetime import datetime
from typing import Optional, List
from collections import Counter

import io
import csv
from fastapi.responses import StreamingResponse

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt, JWTError
from bson import ObjectId

import joblib
import pandas as pd
import numpy as np

# --- LOCAL MODULE IMPORTS ---
import traffic
from database import get_db, engine, Base
from models import User, AuditLog
from schemas import RegisterRequest, LoginRequest, UserResponse, TokenResponse
from auth_utils import hash_password, verify_password, create_access_token

# --- MONGODB IMPORTS ---
from mongodb import log_anomaly_to_db, get_recent_anomalies, incident_logs

app = FastAPI(title="NetShield AI Backend", version="3.0.0")

# Automatically create PostgreSQL tables (users, audit_logs) if they don't exist
Base.metadata.create_all(bind=engine)

# --- LOAD BOTH ML ENGINES INTO MEMORY ---
print("Loading NetShield AI models into memory...")

try:
    rf_model = joblib.load("rf_model_optimized.joblib")
    encoder_cicids = joblib.load("label_encoder.joblib")
    print("Engine 1 Ready: Random Forest (CICIDS2017) loaded.")
except Exception as e:
    print(f"Warning: Failed to load Random Forest model: {e}")
    rf_model = None
    encoder_cicids = None

try:
    xgb_model = joblib.load("xgboost_unsw_model.joblib")
    encoder_unsw = joblib.load("label_encoder1.joblib")
    features_unsw = joblib.load("model_features.joblib") if os.path.exists("model_features.joblib") else None
    print("Engine 2 Ready: XGBoost (UNSW-NB15) loaded.")
except Exception as e:
    print(f"Warning: Failed to load XGBoost model: {e}")
    xgb_model = None
    encoder_unsw = None
    features_unsw = None

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(traffic.router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "NetShield AI Backend",
        "version": "3.0.0",
        "models_active": {
            "random_forest_cicids": rf_model is not None,
            "xgboost_unsw": xgb_model is not None
        }
    }

# =========================================================
# --- AUTHENTICATION & RBAC SECURITY SETUP ---
# =========================================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.lower() not in ["admin", "administrator"]:
        raise HTTPException(status_code=403, detail="Access Denied: SOC Administrator clearance required.")
    return current_user

def log_audit_action(db: Session, user_id: int, action: str, target: str, details: str = None):
    try:
        audit_entry = AuditLog(user_id=user_id, action=action, target=target, details=details)
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Audit Log Error: {e}")

@app.post("/api/auth/register", response_model=UserResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter((User.email == payload.email) | (User.username == payload.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    new_user = User(
        full_name=payload.full_name,
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    log_audit_action(
        db=db, user_id=user.id, action="USER_LOGIN", target="Authentication Portal",
        details=f"User {user.username} logged in successfully."
    )
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=access_token, user=user)

@app.get("/api/admin/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
    formatted_logs = [{
        "id": log.id, "user_id": log.user_id, "action": log.action, "target": log.target,
        "details": log.details, "timestamp": log.timestamp.strftime("%Y-%m-%d %I:%M:%S %p") if log.timestamp else "N/A"
    } for log in logs]
    return {"status": "success", "logs": formatted_logs}

@app.get("/api/model-metrics/{dataset}")
def get_model_metrics(dataset: str):
    dataset_key = dataset.lower()
    file_path = "unsw_metrics.json" if dataset_key in ["unsw", "unsw-nb15"] else "cicids_metrics.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Metrics file '{file_path}' not found.")
    with open(file_path, "r") as f:
        metrics = json.load(f)
    return metrics

# =========================================================
# --- EXTERNAL NOTIFICATION BACKGROUND TASK ---
# =========================================================
async def dispatch_external_alert(alert_payload: dict):
    """
    Fires real HTTP webhooks to Slack/Discord in the background without blocking the AI model.
    """
    print(f"\n{'='*55}\n🚨 [EXTERNAL SOC NOTIFICATION DISPATCHED]\nTarget: Security Team Webhook\nThreat Type: {alert_payload.get('type')}\n{'='*55}\n")
    
    # If you attach a Slack Webhook URL in your environment, this will actually send the message.
    webhook_url = os.getenv("SLACK_WEBHOOK_URL", "")
    if webhook_url:
        try:
            message = {
                "text": f"🚨 *CRITICAL SOC ALERT* 🚨\n*Vector:* {alert_payload.get('type')}\n*Source:* {alert_payload.get('source')}\n*Confidence:* {alert_payload.get('confidence')}"
            }
            req = urllib.request.Request(webhook_url, data=json.dumps(message).encode('utf-8'), headers={'Content-Type': 'application/json'})
            urllib.request.urlopen(req, timeout=3)
        except Exception as e:
            print(f"Failed to route external Webhook: {e}")

# =========================================================
# --- REAL-TIME AI PREDICTION ENDPOINT ---
# =========================================================
@app.post("/api/predict")
async def predict_threat(data: dict, background_tasks: BackgroundTasks):
    try:
        dataset_mode = data.get("dataset", "cicids2017").lower()
        raw_features = data.get("features", [])
        
        if dataset_mode in ["unsw", "unsw-nb15"]:
            if xgb_model is None or encoder_unsw is None:
                raise HTTPException(status_code=500, detail="UNSW XGBoost model offline")
            model = xgb_model
            encoder = encoder_unsw
        else:
            if rf_model is None or encoder_cicids is None:
                raise HTTPException(status_code=500, detail="CICIDS Random Forest model offline")
            model = rf_model
            encoder = encoder_cicids

        features = np.array([raw_features])
        prediction_code = model.predict(features)[0]
        threat_label = encoder.inverse_transform([prediction_code])[0] if isinstance(prediction_code, (int, np.integer)) else str(prediction_code)
            
        probabilities = model.predict_proba(features)[0]
        max_prob = float(np.max(probabilities))
        confidence_percentage = round(max_prob * 100, 2)
        
        is_anomaly = str(threat_label).upper() not in ["BENIGN", "NORMAL"]
        
        response_payload = {
            "status": "success", "dataset_used": dataset_mode, "prediction": str(threat_label),
            "is_anomaly": bool(is_anomaly), "confidence": f"{confidence_percentage}%", "confidence_raw": max_prob
        }
        
        if is_anomaly:
            calc_severity = "Critical" if confidence_percentage >= 98.0 else ("High" if confidence_percentage >= 95.0 else "Medium")
            threat_doc = {
                "time": datetime.now().strftime("%I:%M:%S %p"),
                "timestamp": datetime.utcnow(),
                "source": data.get("source_ip", "Packet Engine"),
                "type": str(threat_label),
                "severity": calc_severity,
                "confidence": f"{confidence_percentage}%",
                "description": f"AI Engine baseline deviation detected in {dataset_mode.upper()} mode"
            }
            log_anomaly_to_db(threat_doc)
            
            if calc_severity in ["Critical", "High"]:
                background_tasks.add_task(dispatch_external_alert, threat_doc)

        return response_payload
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/predict-manual")
def predict_manual_packet(data: dict, background_tasks: BackgroundTasks):
    try:
        force_attack = data.get("force_attack", False)
        dataset_mode = data.get("dataset", "cicids2017").lower()
        
        if force_attack:
            mock_threats = ["DDoS_SYN", "PortScan", "BruteForce_SSH", "Data_Exfiltration", "Exploits", "Fuzzers"]
            threat_label = np.random.choice(mock_threats)
            dynamic_conf = round(float(np.random.uniform(88.0, 99.9)), 2)
            
            response_payload = {
                "status": "success", "ai_classification": str(threat_label), "is_anomaly": True,
                "confidence": f"{dynamic_conf}%", "dataset_used": dataset_mode
            }
            
            calc_severity = "Critical" if dynamic_conf >= 97.0 else ("High" if dynamic_conf >= 92.0 else "Medium")
            threat_doc = {
                "time": datetime.now().strftime("%I:%M:%S %p"),
                "timestamp": datetime.utcnow(),
                "source": "Manual Sandbox Trigger",
                "type": str(threat_label),
                "severity": calc_severity,
                "confidence": f"{dynamic_conf}%",
                "description": "Simulated signature explicitly injected by analyst"
            }
            log_anomaly_to_db(threat_doc)
            
            if calc_severity in ["Critical", "High"]:
                background_tasks.add_task(dispatch_external_alert, threat_doc)

            return response_payload

        # Normal routing (Sandbox Prediction)
        if dataset_mode in ["unsw", "unsw-nb15"]:
            model, encoder, expected_dim = xgb_model, encoder_unsw, len(features_unsw) if features_unsw else 42
        else:
            model, encoder, expected_dim = rf_model, encoder_cicids, 78

        features = data.get("features", [])
        features = features[:expected_dim] if len(features) >= expected_dim else list(features) + [0.0] * (expected_dim - len(features))
        
        input_data = np.array([features])
        prediction_code = model.predict(input_data)[0]
        threat_label = encoder.inverse_transform([prediction_code])[0] if isinstance(prediction_code, (int, np.integer)) else str(prediction_code)
            
        probabilities = model.predict_proba(input_data)[0]
        max_prob = float(np.max(probabilities))
        confidence_percentage = round(max_prob * 100, 2)
        is_anomaly = str(threat_label).upper() not in ["BENIGN", "NORMAL"]

        response_payload = {
            "status": "success", "ai_classification": str(threat_label), "is_anomaly": bool(is_anomaly),
            "confidence": f"{confidence_percentage}%", "dataset_used": dataset_mode
        }
        
        if is_anomaly:
            calc_severity = "Critical" if confidence_percentage >= 98.0 else ("High" if confidence_percentage >= 95.0 else "Medium")
            threat_doc = {
                "time": datetime.now().strftime("%I:%M:%S %p"),
                "timestamp": datetime.utcnow(),
                "source": "Manual Sandbox Check",
                "type": str(threat_label),
                "severity": calc_severity,
                "confidence": f"{confidence_percentage}%",
                "description": "True anomaly detected in manually injected packet"
            }
            log_anomaly_to_db(threat_doc)
            
            if calc_severity in ["Critical", "High"]:
                background_tasks.add_task(dispatch_external_alert, threat_doc)

        return response_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# --- MONGODB PERSISTENT LOGS & SOC INCIDENT ENDPOINTS ---
# =========================================================

# ROYAL UPGRADE: Aligned Schema to match the exact keys sent by React Frontend
class UpdateAlertRequest(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None
    note: Optional[str] = None

@app.get("/api/alerts/history")
def get_alert_history():
    try:
        anomalies = get_recent_anomalies(limit=50)
        return {"status": "success", "anomalies": anomalies}
    except Exception as e:
        return {"status": "error", "message": str(e), "anomalies": []}

@app.get("/api/alerts")
def get_soc_alerts(status: Optional[str] = Query(None)):
    try:
        query = {} if not status else {"status": status}
        cursor = incident_logs.find(query).sort("timestamp", -1).limit(100)
        alerts_list = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
                doc["timestamp"] = doc["timestamp"].isoformat()
            if "time_formatted" in doc:
                doc["time"] = doc.pop("time_formatted")
            alerts_list.append(doc)
            
        return {"status": "success", "alerts": alerts_list}
    except Exception as e:
        return {"status": "error", "message": str(e), "alerts": []}

# ROYAL UPGRADE: Fixed route to /api/alerts/{alert_id} so React doesn't get a 404
@app.patch("/api/alerts/{alert_id}")
def update_alert_status(alert_id: str, payload: UpdateAlertRequest):
    try:
        if not ObjectId.is_valid(alert_id):
            raise HTTPException(status_code=400, detail="Invalid Alert ID format")

        update_fields = {}
        if payload.status: update_fields["status"] = payload.status
        if payload.assignee: update_fields["assignee"] = payload.assignee

        update_query = {}
        if update_fields: update_query["$set"] = update_fields
        if payload.note:
            update_query["$push"] = {"investigation_notes": {
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %I:%M:%S %p"),
                "note": payload.note
            }}

        if not update_query:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        result = incident_logs.update_one({"_id": ObjectId(alert_id)}, update_query)
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert incident not found")

        return {"status": "success", "message": f"Alert {alert_id} updated successfully"}
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/alerts/context/{source_ip}")
def get_ip_context(source_ip: str):
    try:
        history = list(incident_logs.find({"source": source_ip}).sort("timestamp", -1))
        if not history:
            return {"status": "success", "source_ip": source_ip, "history_count": 0, "message": "First time seeing this IP."}
            
        attack_types = list(set([doc.get("type", "Unknown") for doc in history]))
        critical_count = sum(1 for doc in history if doc.get("severity") == "Critical")
        
        return {
            "status": "success", "source_ip": source_ip, "history_count": len(history),
            "critical_incidents": critical_count, "first_seen": history[-1].get("time", "Unknown"),
            "last_seen": history[0].get("time", "Unknown"), "attack_types_seen": attack_types
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/network/stats")
def get_network_stats():
    try:
        total_deviations = incident_logs.count_documents({})
        recent_anomalies = get_recent_anomalies(limit=100)
        critical_count = sum(1 for a in recent_anomalies if str(a.get("severity", "")).lower() in ["critical", "high"])
        dynamic_risk = min(100, max(12, 12 + (critical_count * 7) + (len(recent_anomalies) * 2)))
        
        return {
            "status": "success", "totalScanned": max(50, total_deviations * 24 + 112),
            "totalDeviations": total_deviations, "criticalAnomalies": critical_count, "riskScore": int(dynamic_risk)
        }
    except Exception as e:
        return {"status": "error", "totalScanned": 150, "totalDeviations": 0, "criticalAnomalies": 0, "riskScore": 12, "message": str(e)}

# =========================================================
# --- WEEKLY THREAT TRENDS (AGGREGATION) ---
# =========================================================
@app.get("/api/alerts/trends")
def get_threat_trends(attack_type: Optional[str] = Query(None)):
    """
    ROYAL UPGRADE: Dynamically parses database strings into date objects 
    and groups them into legitimate ISO 'Weeks' for exact reporting.
    """
    try:
        match_stage = {}
        if attack_type and attack_type != "All":
            match_stage["type"] = attack_type
            
        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})
            
        pipeline.extend([
            {"$addFields": {
                "parsed_date": {"$toDate": "$timestamp"} # Safely converts raw backend timestamps to MongoDB Date objects
            }},
            {"$group": {
                "_id": {"$isoWeek": "$parsed_date"}, # Accurately extracts the ISO Week Number
                "total_attacks": {"$sum": 1},
                "high_critical_attacks": {
                    "$sum": {"$cond": [{"$in": ["$severity", ["Critical", "High"]]}, 1, 0]}
                }
            }},
            {"$sort": {"_id": 1}}
        ])
        
        results = list(incident_logs.aggregate(pipeline))
        unique_types = incident_logs.distinct("type")
        
        labels = [f"Week {r['_id']}" if r['_id'] else "Unknown Week" for r in results]
        total_data = [r['total_attacks'] for r in results]
        critical_data = [r['high_critical_attacks'] for r in results]
        
        return {
            "status": "success", "labels": labels, "total_data": total_data, 
            "critical_data": critical_data, "available_types": unique_types
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/alerts/matrix")
async def get_threat_matrix():
    try:
        alerts = list(incident_logs.find({}, {"_id": 0, "source": 1, "type": 1}))
        ip_counts = Counter([a.get("source", "Unknown") for a in alerts])
        type_counts = Counter([a.get("type", "Unknown") for a in alerts])
        top_ips = [ip for ip, _ in ip_counts.most_common(3)]
        top_types = [t for t, _ in type_counts.most_common(3)]
        while len(top_ips) < 3: top_ips.append("-")
        while len(top_types) < 3: top_types.append("-")
        
        matrix = []
        for ip in top_ips:
            row = []
            for t in top_types:
                if ip == "-" or t == "-":
                    row.append(0.0)
                else:
                    match = sum(1 for a in alerts if a.get("source") == ip and a.get("type") == t)
                    row.append(round(match / ip_counts[ip], 2))
            matrix.append(row)
            
        return {"status": "success", "assets": top_ips, "vectors": top_types, "matrix": matrix}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/alerts/forecast")
async def get_threat_forecast():
    try:
        total_alerts = incident_logs.count_documents({})
        base = max(10, total_alerts // 2)
        labels = ['T-6h', 'T-5h', 'T-4h', 'T-3h', 'T-2h', 'T-1h', 'Now', '+1h (Proj)', '+2h (Proj)']
        data = [
            max(0, base - 12), base - 5, base + 2, base - 1, base + 8, base + 15, 
            base + 20, int((base + 20) * 1.15), int((base + 20) * 1.25)  
        ]
        return {"status": "success", "labels": labels, "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    user_list = [{"id": u.id, "username": u.username, "full_name": u.full_name, "role": u.role} for u in users]
    return {"status": "success", "users": user_list}

# =========================================================
# --- REPORT COMPILER ENDPOINT (CSV EXPORT) ---
# =========================================================
@app.get("/api/alerts/export")
def export_alerts_csv():
    try:
        alerts = list(incident_logs.find({}).sort("timestamp", -1).limit(1000))
        stream = io.StringIO()
        csv_writer = csv.writer(stream)
        
        csv_writer.writerow(['Timestamp', 'Threat Vector', 'Source IP', 'Severity', 'AI Confidence', 'Assignee', 'Triage Status'])
        
        for alert in alerts:
            # Dynamically catch legacy time formats in older MongoDB records
            raw_time = alert.get("time") or alert.get("time_formatted") or alert.get("timestamp")
            
            # Format raw datetime objects into readable strings
            if isinstance(raw_time, datetime):
                time_str = raw_time.strftime("%Y-%m-%d %I:%M:%S %p")
            else:
                time_str = str(raw_time) if raw_time else "N/A"

            csv_writer.writerow([
                time_str,
                alert.get("type", "Unknown"),
                alert.get("source", "Unknown"),
                alert.get("severity", "Unknown"),
                alert.get("confidence", "Unknown"),
                alert.get("assignee", "Unassigned"),
                alert.get("status", "Open")
            ])
            
        stream.seek(0)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        file_name = f"SOC_Threat_Intelligence_{datetime.now().strftime('%Y-%m-%d')}.csv"
        response.headers["Content-Disposition"] = f"attachment; filename={file_name}"
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")