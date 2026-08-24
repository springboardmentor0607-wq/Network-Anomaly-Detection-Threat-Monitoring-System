from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt, JWTError
import traffic

# --- 1. POSTGRESQL & DATABASE IMPORTS ---
from database import get_db, engine, Base
from models import User, AuditLog

# --- 2. MONGODB IMPORTS ---
from mongodb import log_anomaly_to_db, get_recent_anomalies

from schemas import RegisterRequest, LoginRequest, UserResponse, TokenResponse
from auth_utils import hash_password, verify_password, create_access_token
import joblib
import pandas as pd
import numpy as np
import json
import os
from datetime import datetime

app = FastAPI(title="NetShield AI Backend", version="2.0.0")

# Automatically create PostgreSQL tables (users, audit_logs) if they don't exist in Neon
Base.metadata.create_all(bind=engine)

# --- LOAD BOTH ML ENGINES INTO MEMORY ---
print("Loading NetShield AI models into memory...")

# Load Model 1: Random Forest (CICIDS2017)
try:
    rf_model = joblib.load("rf_model_optimized.joblib")
    encoder_cicids = joblib.load("label_encoder.joblib")
    print("Engine 1 Ready: Random Forest (CICIDS2017) loaded.")
except Exception as e:
    print(f"Warning: Failed to load Random Forest model: {e}")
    rf_model = None
    encoder_cicids = None

# Load Model 2: XGBoost (UNSW-NB15)
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

# Attach the WebSocket traffic stream to FastAPI
app.include_router(traffic.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "NetShield AI Backend",
        "models_active": {
            "random_forest_cicids": rf_model is not None,
            "xgboost_unsw": xgb_model is not None
        }
    }


# =========================================================
# --- 3. AUTHENTICATION & RBAC SECURITY SETUP ---
# =========================================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
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

# RBAC Bouncer: Restricts endpoints to administrators only
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.lower() not in ["admin", "administrator"]:
        raise HTTPException(
            status_code=403, 
            detail="Access Denied: SOC Administrator clearance required."
        )
    return current_user

# Audit Logger Helper
def log_audit_action(db: Session, user_id: int, action: str, target: str, details: str = None):
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            target=target,
            details=details
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Audit Log Error: {e}")


@app.post("/api/auth/register", response_model=UserResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.email == payload.email) | (User.username == payload.username)
    ).first()

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

    # --- RECORD AUDIT LOG IN NEON ---
    log_audit_action(
        db=db,
        user_id=user.id,
        action="USER_LOGIN",
        target="Authentication Portal",
        details=f"User {user.username} logged in successfully with role '{user.role}'."
    )
    # --------------------------------

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=access_token, user=user)


# =========================================================
# --- 4. SECURE ADMIN AUDIT LOGS ENDPOINT ---
# =========================================================
@app.get("/api/admin/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
    
    formatted_logs = [{
        "id": log.id,
        "user_id": log.user_id,
        "action": log.action,
        "target": log.target,
        "details": log.details,
        "timestamp": log.timestamp.strftime("%Y-%m-%d %I:%M:%S %p") if log.timestamp else "N/A"
    } for log in logs]
    
    return {"status": "success", "logs": formatted_logs}


# --- 5. PERFORMANCE METRICS ENDPOINT ---
@app.get("/api/model-metrics/{dataset}")
def get_model_metrics(dataset: str):
    dataset_key = dataset.lower()
    
    if dataset_key in ["unsw", "unsw-nb15"]:
        file_path = "unsw_metrics.json"
    elif dataset_key in ["cicids", "cicids2017"]:
        file_path = "cicids_metrics.json"
    else:
        raise HTTPException(status_code=404, detail="Dataset metrics not found")
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Metrics file '{file_path}' not found.")
        
    with open(file_path, "r") as f:
        metrics = json.load(f)
        
    return metrics


# --- 6. REAL-TIME AI PREDICTION ENDPOINT ---
@app.post("/api/predict")
async def predict_threat(data: dict):
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
        
        if isinstance(prediction_code, (int, np.integer)):
            threat_label = encoder.inverse_transform([prediction_code])[0]
        else:
            threat_label = str(prediction_code)
            
        probabilities = model.predict_proba(features)[0]
        max_prob = float(np.max(probabilities))
        confidence_percentage = round(max_prob * 100, 2)
        
        is_anomaly = str(threat_label).upper() not in ["BENIGN", "NORMAL"]
        
        response_payload = {
            "status": "success",
            "dataset_used": dataset_mode,
            "prediction": str(threat_label),
            "is_anomaly": bool(is_anomaly),
            "confidence": f"{confidence_percentage}%",
            "confidence_raw": max_prob
        }
        
        # --- MongoDB Persistence Trigger (Dynamic Severity) ---
        if is_anomaly:
            calc_severity = "Critical" if confidence_percentage >= 98.0 else ("High" if confidence_percentage >= 95.0 else "Medium")
            
            threat_doc = {
                "time": datetime.now().strftime("%I:%M:%S %p"),
                "source": data.get("source_ip", "Packet Engine"),
                "type": str(threat_label),
                "severity": calc_severity,
                "confidence": f"{confidence_percentage}%",
                "description": f"AI Engine baseline deviation detected in {dataset_mode.upper()} mode"
            }
            log_anomaly_to_db(threat_doc)

        return response_payload
    except Exception as e:
        return {"status": "error", "message": str(e)}


# --- 7. INTERACTIVE AI TESTER ENDPOINT ---
@app.post("/api/predict-manual")
def predict_manual_packet(data: dict):
    try:
        force_attack = data.get("force_attack", False)
        dataset_mode = data.get("dataset", "cicids2017").lower()
        
        if force_attack:
            mock_threats = ["DDoS_SYN", "PortScan", "BruteForce_SSH", "Data_Exfiltration", "Exploits", "Fuzzers"]
            threat_label = np.random.choice(mock_threats)
            
            # Generates a random confidence score between 88.0% and 99.9%
            dynamic_conf = round(float(np.random.uniform(88.0, 99.9)), 2)
            
            response_payload = {
                "status": "success",
                "ai_classification": str(threat_label),
                "is_anomaly": True,
                "confidence": f"{dynamic_conf}%",  # Fixed typo here
                "dataset_used": dataset_mode
            }
            
            # 3-tier severity split so Medium, High, and Critical all appear randomly
            if dynamic_conf >= 97.0:
                calc_severity = "Critical"
            elif dynamic_conf >= 92.0:
                calc_severity = "High"
            else:
                calc_severity = "Medium"

            threat_doc = {
                "time": datetime.now().strftime("%I:%M:%S %p"),
                "source": "Manual Sandbox Trigger",
                "type": str(threat_label),
                "severity": calc_severity,
                "confidence": f"{dynamic_conf}%",
                "description": "Simulated signature explicitly injected by analyst"
            }
            log_anomaly_to_db(threat_doc)

            return response_payload

        # Normal routing
        if dataset_mode in ["unsw", "unsw-nb15"]:
            if xgb_model is None or encoder_unsw is None:
                raise HTTPException(status_code=500, detail="UNSW XGBoost model offline")
            model = xgb_model
            encoder = encoder_unsw
            expected_dim = len(features_unsw) if features_unsw else 42
        else:
            if rf_model is None or encoder_cicids is None:
                raise HTTPException(status_code=500, detail="CICIDS Random Forest model offline")
            model = rf_model
            encoder = encoder_cicids
            expected_dim = 78

        features = data.get("features", [])
        
        if len(features) < expected_dim:
            features = list(features) + [0.0] * (expected_dim - len(features))
        else:
            features = features[:expected_dim]

        input_data = np.array([features])
        prediction_code = model.predict(input_data)[0]
        
        if isinstance(prediction_code, (int, np.integer)):
            threat_label = encoder.inverse_transform([prediction_code])[0]
        else:
            threat_label = str(prediction_code)
            
        probabilities = model.predict_proba(input_data)[0]
        max_prob = float(np.max(probabilities))
        confidence_percentage = round(max_prob * 100, 2)
        
        is_anomaly = str(threat_label).upper() not in ["BENIGN", "NORMAL"]

        response_payload = {
            "status": "success",
            "ai_classification": str(threat_label),
            "is_anomaly": bool(is_anomaly),
            "confidence": f"{confidence_percentage}%",
            "dataset_used": dataset_mode
        }
        
        if is_anomaly:
            calc_severity = "Critical" if confidence_percentage >= 98.0 else ("High" if confidence_percentage >= 95.0 else "Medium")

            threat_doc = {
                "time": datetime.now().strftime("%I:%M:%S %p"),
                "source": "Manual Sandbox Check",
                "type": str(threat_label),
                "severity": calc_severity,
                "confidence": f"{confidence_percentage}%",
                "description": "True anomaly detected in manually injected packet"
            }
            log_anomaly_to_db(threat_doc)

        return response_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# --- 8. MONGODB PERSISTENT LOGS ENDPOINT (REACT) ---
@app.get("/api/alerts/history")
def get_alert_history():
    try:
        anomalies = get_recent_anomalies(limit=50)
        return {"status": "success", "anomalies": anomalies}
    except Exception as e:
        return {"status": "error", "message": str(e), "anomalies": []}

# =========================================================
# --- 9. BACKEND-DRIVEN RISK ENGINE ENDPOINT ---
# =========================================================
@app.get("/api/network/stats")
def get_network_stats():
    """
    Computes real-time network risk score and threat metrics dynamically 
    based on persistent MongoDB incident logs.
    """
    try:
        anomalies = get_recent_anomalies(limit=100)
        total_deviations = len(anomalies)
        
        # Count critical and high severity threats
        critical_count = sum(
            1 for a in anomalies 
            if str(a.get("severity", "")).lower() in ["critical", "high"]
        )
        
        # Dynamic risk formula factoring in threat frequency and severity
        base_risk = 12
        dynamic_risk = min(100, max(base_risk, base_risk + (critical_count * 7) + (total_deviations * 2)))
        
        return {
            "status": "success",
            "totalScanned": max(50, total_deviations * 24 + 112),
            "totalDeviations": total_deviations,
            "criticalAnomalies": critical_count,
            "riskScore": int(dynamic_risk)
        }
    except Exception as e:
        return {
            "status": "error",
            "totalScanned": 150,
            "totalDeviations": 0,
            "criticalAnomalies": 0,
            "riskScore": 12,
            "message": str(e)
        }        