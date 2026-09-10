from typing import Dict, Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.session import get_db
from app.models.user import User
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.anomaly import Anomaly
from app.models.traffic import TrafficFlow
from app.models.incident import Incident, IncidentStatus
from app.models.prediction import Prediction
from app.models.threat_intelligence import ThreatIntelligence
from app.core.permissions import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get high-level dashboard statistics from the real database."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_traffic = db.query(func.count(TrafficFlow.id)).scalar() or 0
    total_anomalies = db.query(func.count(Anomaly.id)).filter(Anomaly.is_anomaly == True).scalar() or 0
    active_alerts = db.query(func.count(Alert.id)).filter(
        Alert.status.in_([AlertStatus.NEW, AlertStatus.ACKNOWLEDGED, AlertStatus.INVESTIGATING])
    ).scalar() or 0
    critical_alerts = db.query(func.count(Alert.id)).filter(
        Alert.severity == AlertSeverity.CRITICAL,
        Alert.status != AlertStatus.RESOLVED
    ).scalar() or 0
    open_incidents = db.query(func.count(Incident.id)).filter(
        Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS])
    ).scalar() or 0
    threats = db.query(func.count(Prediction.id)).filter(
        Prediction.confidence >= 0.7
    ).scalar() or 0

    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "networkEvents": total_traffic,
        "detectedAnomalies": total_anomalies,
        "threats": threats,
        "activeAlerts": active_alerts,
        "criticalAlerts": critical_alerts,
        "openIncidents": open_incidents,
        "systemHealth": 98 if critical_alerts == 0 else max(60, 98 - critical_alerts * 5),
    }


@router.get("/summary", response_model=Dict[str, Any])
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full analytics summary with real DB aggregations."""
    # Alert severity counts
    severity_counts = db.query(Alert.severity, func.count(Alert.id)) \
        .group_by(Alert.severity).all()
    severity_dist = {str(s.value): c for s, c in severity_counts}

    # Attack class distribution from predictions
    attack_dist = db.query(Prediction.predicted_class, func.count(Prediction.id)) \
        .group_by(Prediction.predicted_class) \
        .order_by(desc(func.count(Prediction.id))) \
        .limit(8).all()
    total_attacks = sum(c for _, c in attack_dist) or 1
    attack_distribution = [
        {"category": cls, "count": cnt, "percentage": round(cnt * 100.0 / total_attacks, 1)}
        for cls, cnt in attack_dist
    ]

    # Protocol distribution from traffic
    protocol_dist = db.query(TrafficFlow.protocol, func.count(TrafficFlow.id), func.sum(TrafficFlow.bytes)) \
        .group_by(TrafficFlow.protocol) \
        .order_by(desc(func.count(TrafficFlow.id))) \
        .limit(10).all()
    total_flows = sum(c for _, c, _ in protocol_dist) or 1
    protocol_distribution = [
        {"protocol": proto, "percentage": round(cnt * 100.0 / total_flows, 1), "packets": cnt, "bytes": int(b or 0)}
        for proto, cnt, b in protocol_dist
    ]

    # Top anomalous source IPs - join anomaly with traffic flow
    from app.models.anomaly import Anomaly as AnomalyModel
    top_sources = db.query(TrafficFlow.source_ip, func.count(AnomalyModel.id).label("attacks")) \
        .join(AnomalyModel, TrafficFlow.id == AnomalyModel.flow_id) \
        .filter(AnomalyModel.is_anomaly == True) \
        .group_by(TrafficFlow.source_ip) \
        .order_by(desc(func.count(AnomalyModel.id))) \
        .limit(5).all()
    top_attacking_sources = [
        {"ip": ip, "country": "N/A", "attacks": cnt, "risk_score": min(99, 50 + cnt)}
        for ip, cnt in top_sources
    ]

    # Anomaly trend over last 7 days
    now = datetime.utcnow()
    anomaly_trend = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        cnt = db.query(func.count(Anomaly.id)).filter(
            Anomaly.created_at >= day_start,
            Anomaly.created_at <= day_end,
            Anomaly.is_anomaly == True
        ).scalar() or 0
        anomaly_trend.append({"date": day.strftime("%Y-%m-%d"), "anomalies": cnt})

    # Risk distribution from predictions
    critical_risk = db.query(func.count(Prediction.id)).filter(Prediction.confidence >= 0.9).scalar() or 0
    high_risk = db.query(func.count(Prediction.id)).filter(
        Prediction.confidence >= 0.7, Prediction.confidence < 0.9
    ).scalar() or 0
    medium_risk = db.query(func.count(Prediction.id)).filter(
        Prediction.confidence >= 0.5, Prediction.confidence < 0.7
    ).scalar() or 0
    low_risk = db.query(func.count(Prediction.id)).filter(Prediction.confidence < 0.5).scalar() or 0

    risk_distribution = [
        {"range": "LOW (< 50%)", "count": low_risk},
        {"range": "MEDIUM (50-70%)", "count": medium_risk},
        {"range": "HIGH (70-90%)", "count": high_risk},
        {"range": "CRITICAL (>= 90%)", "count": critical_risk},
    ]

    return {
        "severity_distribution": severity_dist,
        "attack_distribution": attack_distribution,
        "protocol_distribution": protocol_distribution,
        "risk_distribution": risk_distribution,
        "anomaly_trend": anomaly_trend,
        "top_attacking_sources": top_attacking_sources,
    }


@router.get("/alerts/stats", response_model=Dict[str, Any])
def get_alert_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get alert statistics."""
    total = db.query(func.count(Alert.id)).scalar() or 0
    by_status = {
        s.value: db.query(func.count(Alert.id)).filter(Alert.status == s).scalar() or 0
        for s in AlertStatus
    }
    by_severity = {
        s.value: db.query(func.count(Alert.id)).filter(Alert.severity == s).scalar() or 0
        for s in AlertSeverity
    }
    return {"total": total, "by_status": by_status, "by_severity": by_severity}


@router.get("/traffic/stats", response_model=Dict[str, Any])
def get_traffic_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get traffic statistics."""
    total_flows = db.query(func.count(TrafficFlow.id)).scalar() or 0
    total_bytes = db.query(func.sum(TrafficFlow.bytes)).scalar() or 0
    total_packets = db.query(func.sum(TrafficFlow.packets)).scalar() or 0
    anomalous_flows = db.query(func.count(Anomaly.id)).filter(Anomaly.is_anomaly == True).scalar() or 0

    return {
        "total_flows": total_flows,
        "total_bytes": int(total_bytes),
        "total_packets": int(total_packets),
        "anomalous_flows": anomalous_flows,
        "normal_flows": total_flows - anomalous_flows,
        "anomaly_rate": round((anomalous_flows / max(1, total_flows)) * 100, 2)
    }
