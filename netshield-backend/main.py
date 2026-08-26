from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from pydantic import BaseModel
from datetime import datetime

from database import engine, Base, SessionLocal
import models
from schemas import UserCreate
from analytics import (
    get_unsw_summary,
    get_network_traffic,
    get_anomaly_summary,
    get_security_alerts,
    get_cic_summary,
    get_unsw_record,
    get_cic_record
)
from ml.predict import predict_intrusion
from risk_report import generate_risk_report

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

password_hash = PasswordHash.recommended()
SECRET_KEY = "netshield-ai-secret-key-change-this-later"
ALGORITHM = "HS256"

security = HTTPBearer()

class UserLogin(BaseModel):
    email: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "NetShield AI Backend is running!"}


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) |
        (models.User.email == user.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )

    hashed_password = password_hash.hash(user.password)

    new_user = models.User(
    username=user.username,
    email=user.email,
    password=hashed_password,
    role=user.role
)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "username": new_user.username
    }

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not password_hash.verify(
        user.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = jwt.encode(
        {
            "user_id": existing_user.id,
            "email": existing_user.email,
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "username": existing_user.username,
        "role": existing_user.role
    }

@app.get("/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Session expired"
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }

@app.get("/admin/users")
def get_all_users(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    # Verify JWT token
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Session expired"
        )

    # Find logged-in user
    current_user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    # Only Security Administrators can access Team Management
    if current_user.role != "security_administrator":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    # Get all registered users
    users = db.query(models.User).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
        for user in users
    ]
@app.post("/admin/add-user")
def add_user(
    user: UserCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Session expired"
        )

    current_user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if current_user.role != "security_administrator":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    existing = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=password_hash.hash(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User added successfully"}

@app.delete("/admin/delete-user/{user_id}")
def delete_user(
    user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        current_user_id = payload.get("user_id")

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Session expired"
        )

    current_user = db.query(models.User).filter(
        models.User.id == current_user_id
    ).first()

    if current_user.role != "security_administrator":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    if user.id == current_user.id:
         raise HTTPException(
            status_code=400,
            detail="You cannot remove your own account."
        )
    db.delete(user)
    db.commit()

    return {
        "message": "User removed successfully"
    }

@app.get("/analytics/summary")
def analytics_summary(
    dataset: str = "UNSW-NB15"
):

    if dataset == "UNSW-NB15":
        return get_unsw_summary()

    elif dataset == "CIC-IDS2017":
        return get_cic_summary()

    else:
        raise HTTPException(
            status_code=400,
            detail="Unknown dataset"
        )

# ==========================================
# NETWORK MONITORING
# ==========================================

@app.get("/monitoring/traffic")
def monitoring_traffic(
    dataset: str = "UNSW-NB15"
):

    return get_network_traffic(
        dataset=dataset,
        limit=100
    )

# ==========================================
# ANOMALY DETECTION
# ==========================================

@app.get("/anomalies/summary")
def anomaly_summary(
    dataset: str = "UNSW-NB15"
):

    return get_anomaly_summary(
        dataset=dataset
    )

@app.post("/anomalies/detect")
def detect_anomaly(data: dict):

    try:

        result = predict_intrusion(data)

        risk_score = round(
            result["attack_probability"] * 100
        )

        if result["prediction"] == "Normal":
            risk_level = "LOW"

        elif risk_score < 60:
            risk_level = "MEDIUM"

        elif risk_score < 80:
            risk_level = "HIGH"

        else:
            risk_level = "CRITICAL"

        result["risk_score"] = risk_score
        result["risk_level"] = risk_level

        report = generate_risk_report(result)

        return {
            
            "success": True,
            "prediction": result["prediction"],
            "label": result["label"],
            "attack_probability": result["attack_probability"],
            "attack_category": result["attack_category"],
            "category_confidence": result["category_confidence"],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_report": report
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@app.post("/anomalies/detect-record/{record_id}")
def detect_dataset_record(
    record_id: int,
    dataset: str = "UNSW-NB15",
    db: Session = Depends(get_db)
):

    try:

        # ==============================
        # SELECT DATASET
        # ==============================

        if dataset == "UNSW-NB15":
            data = get_unsw_record(record_id)

        elif dataset == "CIC-IDS2017":
            data = get_cic_record(record_id)

        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported dataset."
            )

        # ==============================
        # RUN AI MODEL
        # ==============================

        result = predict_intrusion(
            data,
            dataset=dataset
        )

        # ==============================
        # RISK SCORE
        # ==============================

        risk_score = round(
            result["attack_probability"] * 100
        )

        if result["prediction"] == "Normal":
            risk_level = "LOW"

        elif risk_score < 60:
            risk_level = "MEDIUM"

        elif risk_score < 80:
            risk_level = "HIGH"

        else:
            risk_level = "CRITICAL"

        result["risk_score"] = risk_score
        result["risk_level"] = risk_level

        # ==============================
        # RISK REPORT
        # ==============================

        report = generate_risk_report(result)

         # ==============================
        # CREATE SECURITY ALERT
        # ==============================

        if result["prediction"] != "Normal":

            # Get network information from the record
            srcip = data.get("srcip", "N/A")
            dstip = data.get("dstip", "N/A")
            proto = data.get("proto", "Unknown")

            # Create alert description
            description = (
                f"{result['attack_category']} attack detected. "
                f"Risk score: {risk_score}/100. "
                f"Risk level: {risk_level}."
            )

            new_alert = models.Alert(
                record_id=record_id,
                dataset=dataset,
                attack_category=result["attack_category"],
                attack_probability=result["attack_probability"],
                risk_score=risk_score,
                risk_level=risk_level,
                status="NEW",
                srcip=srcip,
                dstip=dstip,
                proto=proto,
                description=description
            )

            db.add(new_alert)
            db.commit()
            db.refresh(new_alert)

            # ==============================
            # CREATE SECURITY NOTIFICATION
            # ==============================

            if risk_level in ["HIGH", "CRITICAL"]:

                notification = models.Notification(
                    alert_id=new_alert.id,
                    title=f"{risk_level} Security Alert",
                    message=(
                        f"{result['attack_category']} attack detected. "
                        f"Risk score: {risk_score}/100."
                    ),
                    severity=risk_level,
                    is_read=0
                )

                db.add(notification)
                db.commit()

        return {
            "success": True,
            "record_id": record_id,
            "dataset": dataset,
            "prediction": result["prediction"],
            "label": result["label"],
            "attack_probability": result["attack_probability"],
            "attack_category": result["attack_category"],
            "category_confidence": result["category_confidence"],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_report": report
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
# ==============================
# SECURITY ALERTS
# ==============================

@app.get("/alerts")
def get_alerts(
    dataset: str = "UNSW-NB15",
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(models.Alert)
        .filter(models.Alert.dataset == dataset)
        .order_by(models.Alert.created_at.desc())
        .all()
    )

    return [
        {
            "id": alert.id,
            "record_id": alert.record_id,
            "dataset": alert.dataset,
            "attack_category": alert.attack_category,
            "attack_probability": alert.attack_probability,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "status": alert.status,
            "srcip": alert.srcip,
            "dstip": alert.dstip,
            "proto": alert.proto,
            "description": alert.description,
            "created_at": alert.created_at
        }
        for alert in alerts
    ]

# ==============================
# UPDATE ALERT STATUS
# ==============================

class AlertStatusUpdate(BaseModel):
    status: str


@app.patch("/alerts/{alert_id}/status")
def update_alert_status(
    alert_id: int,
    data: AlertStatusUpdate,
    db: Session = Depends(get_db)
):
    allowed_statuses = [
        "NEW",
        "INVESTIGATING",
        "RESOLVED",
        "DISMISSED"
    ]

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid alert status"
        )

    alert = (
        db.query(models.Alert)
        .filter(models.Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.status = data.status

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Alert status updated successfully",
        "alert_id": alert.id,
        "status": alert.status
    }

@app.get("/reports/security-summary")
def security_summary_report(
    dataset: str = "UNSW-NB15",
    db: Session = Depends(get_db)
):
    try:
        # ==========================================
        # 1. GET DATASET ANALYTICS
        # ==========================================

        if dataset == "UNSW-NB15":
            analytics = get_unsw_summary()

        elif dataset == "CIC-IDS2017":
            analytics = get_cic_summary()

        else:
            raise HTTPException(
                status_code=400,
                detail="Unknown dataset"
            )

        # ==========================================
        # 2. GET SECURITY ALERTS
        # ==========================================

        alerts = (
            db.query(models.Alert)
            .filter(models.Alert.dataset == dataset)
            .order_by(models.Alert.created_at.desc())
            .all()
        )

        # ==========================================
        # 3. ALERT SUMMARY
        # ==========================================

        alert_summary = {
            "total": len(alerts),
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }

        # ==========================================
        # 4. INCIDENT STATUS SUMMARY
        # ==========================================

        status_summary = {
            "new": 0,
            "investigating": 0,
            "resolved": 0
        }

        # ==========================================
        # 5. ATTACK CATEGORY SUMMARY
        # ==========================================

        attack_categories = {}

        # ==========================================
        # 6. PROCESS ALERTS
        # ==========================================

        for alert in alerts:

            # Risk level
            risk_level = alert.risk_level.lower()

            if risk_level in alert_summary:
                alert_summary[risk_level] += 1

            # Status
            status = alert.status.upper()

            if status == "NEW":
                status_summary["new"] += 1

            elif status == "INVESTIGATING":
                status_summary["investigating"] += 1

            elif status == "RESOLVED":
                status_summary["resolved"] += 1

            # Attack category
            category = alert.attack_category

            if category:
                attack_categories[category] = (
                    attack_categories.get(category, 0) + 1
                )

        # ==========================================
        # 7. SORT ATTACK CATEGORIES
        # ==========================================

        attack_categories = dict(
            sorted(
                attack_categories.items(),
                key=lambda item: item[1],
                reverse=True
            )
        )

        # ==========================================
        # 8. RETURN SECURITY REPORT
        # ==========================================

        return {
            "success": True,
            "dataset": dataset,

            "traffic_summary": analytics,

            "alert_summary": alert_summary,

            "attack_categories": attack_categories,

            "risk_distribution": {
                "critical": alert_summary["critical"],
                "high": alert_summary["high"],
                "medium": alert_summary["medium"],
                "low": alert_summary["low"]
            },

            "incident_status": status_summary,

            "report_metadata": {
                "total_alerts": len(alerts),
                "generated_at": datetime.utcnow()
            }
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

# ==============================
# SECURITY NOTIFICATIONS
# ==============================

@app.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(models.Notification)
        .order_by(models.Notification.created_at.desc())
        .all()
    )

    return [
        {
            "id": notification.id,
            "alert_id": notification.alert_id,
            "title": notification.title,
            "message": notification.message,
            "severity": notification.severity,
            "is_read": notification.is_read,
            "created_at": notification.created_at
        }
        for notification in notifications
    ]

@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = 1

    db.commit()
    db.refresh(notification)

    return {
        "success": True,
        "message": "Notification marked as read",
        "notification_id": notification.id,
        "is_read": notification.is_read
    }

@app.patch("/notifications/{notification_id}/unread")
def mark_notification_unread(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = 0

    db.commit()
    db.refresh(notification)

    return {
        "success": True,
        "message": "Notification marked as unread",
        "notification_id": notification.id,
        "is_read": notification.is_read
    }

# ==============================
# THREAT INTELLIGENCE
# ==============================

@app.get("/threat-intelligence")
def threat_intelligence(
    dataset: str = "UNSW-NB15",
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(models.Alert)
        .filter(models.Alert.dataset == dataset)
        .order_by(models.Alert.created_at.desc())
        .all()
    )

    # No alerts available
    if not alerts:
        return {
            "dataset": dataset,
            "total_threats": 0,
            "high_risk_threats": 0,
            "critical_threats": 0,
            "attack_types": [],
            "recent_threats": []
        }

    # Count attack categories
    attack_counts = {}

    for alert in alerts:
        category = alert.attack_category

        if category not in attack_counts:
            attack_counts[category] = 0

        attack_counts[category] += 1

    # Sort attack types by frequency
    attack_types = [
        {
            "attack_category": category,
            "count": count
        }
        for category, count in sorted(
            attack_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )
    ]

    # Count severity
    high_risk_threats = sum(
        1 for alert in alerts
        if alert.risk_level == "HIGH"
    )

    critical_threats = sum(
        1 for alert in alerts
        if alert.risk_level == "CRITICAL"
    )

    # Recent threats
    recent_threats = [
        {
            "alert_id": alert.id,
            "attack_category": alert.attack_category,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "status": alert.status,
            "attack_probability": alert.attack_probability,
            "created_at": alert.created_at
        }
        for alert in alerts[:10]
    ]

    return {
        "dataset": dataset,
        "total_threats": len(alerts),
        "high_risk_threats": high_risk_threats,
        "critical_threats": critical_threats,
        "attack_types": attack_types,
        "recent_threats": recent_threats
    }

# ==============================
# THREAT INTELLIGENCE REPORT
# ==============================

@app.get("/threat-intelligence/{alert_id}")
def get_threat_report(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = (
        db.query(models.Alert)
        .filter(models.Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Threat alert not found"
        )

    if alert.risk_level == "CRITICAL":
        recommendation = (
            "Immediately investigate the affected traffic "
            "and initiate incident response procedures."
        )

    elif alert.risk_level == "HIGH":
        recommendation = (
            "Investigate the affected traffic and continue "
            "monitoring for similar activity."
        )

    elif alert.risk_level == "MEDIUM":
        recommendation = (
            "Review the detected traffic and continue "
            "network monitoring."
        )

    else:
        recommendation = (
            "Continue monitoring network traffic."
        )

    return {
        "report_id": f"TIR-{alert.id:04d}",
        "alert_id": alert.id,
        "dataset": alert.dataset,
        "threat_type": alert.attack_category,
        "severity": alert.risk_level,
        "attack_probability": alert.attack_probability,
        "risk_score": alert.risk_score,
        "status": alert.status,
        "source_ip": alert.srcip,
        "destination_ip": alert.dstip,
        "protocol": alert.proto,
        "description": alert.description,
        "recommendation": recommendation,
        "created_at": alert.created_at
    }

# ==============================
# ATTACK ANALYTICS
# ==============================

@app.get("/analytics/attacks")
def attack_analytics(
    dataset: str = "UNSW-NB15",
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(models.Alert)
        .filter(models.Alert.dataset == dataset)
        .order_by(models.Alert.created_at.asc())
        .all()
    )

    # Count attacks by category
    attack_categories = {}

    for alert in alerts:
        category = alert.attack_category

        if category not in attack_categories:
            attack_categories[category] = 0

        attack_categories[category] += 1

    # Count risk levels
    risk_distribution = {
        "LOW": 0,
        "MEDIUM": 0,
        "HIGH": 0,
        "CRITICAL": 0
    }

    for alert in alerts:
        if alert.risk_level in risk_distribution:
            risk_distribution[alert.risk_level] += 1

    # Convert attack categories into chart-friendly data
    attack_category_data = [
        {
            "attack_category": category,
            "count": count
        }
        for category, count in attack_categories.items()
    ]

    return {
        "dataset": dataset,
        "total_attacks": len(alerts),
        "attack_categories": attack_category_data,
        "risk_distribution": risk_distribution
    }