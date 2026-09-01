from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=Dict[str, Any])
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "threats_over_time": [
            {"time": "00:00", "critical": 12, "high": 25, "medium": 45, "low": 80},
            {"time": "04:00", "critical": 8, "high": 18, "medium": 38, "low": 95},
            {"time": "08:00", "critical": 24, "high": 42, "medium": 65, "low": 120},
            {"time": "12:00", "critical": 35, "high": 58, "medium": 82, "low": 150},
            {"time": "16:00", "critical": 18, "high": 31, "medium": 55, "low": 110},
            {"time": "20:00", "critical": 29, "high": 47, "medium": 70, "low": 135},
        ],
        "attack_distribution": [
            {"category": "DDoS / Flooding", "count": 412, "percentage": 34.5},
            {"category": "Port Scanning", "count": 298, "percentage": 25.0},
            {"category": "Brute Force SSH", "count": 184, "percentage": 15.4},
            {"category": "SQL Injection", "count": 142, "percentage": 11.9},
            {"category": "DNS Tunneling", "count": 96, "percentage": 8.0},
            {"category": "Command Injection", "count": 62, "percentage": 5.2},
        ],
        "protocol_distribution": [
            {"protocol": "TCP", "percentage": 58.2, "packets": 1420000},
            {"protocol": "UDP", "percentage": 24.5, "packets": 598000},
            {"protocol": "HTTPS", "percentage": 11.8, "packets": 288000},
            {"protocol": "DNS", "percentage": 4.1, "packets": 100000},
            {"protocol": "ICMP", "percentage": 1.4, "packets": 34000},
        ],
        "risk_distribution": [
            {"range": "0-20 (Low)", "count": 4850},
            {"range": "21-40 (Moderate)", "count": 1240},
            {"range": "41-60 (Elevated)", "count": 620},
            {"range": "61-80 (High)", "count": 310},
            {"range": "81-100 (Critical)", "count": 89},
        ],
        "top_attacking_sources": [
            {"ip": "42.112.98.14", "country": "US", "attacks": 1420, "risk_score": 96},
            {"ip": "185.220.101.5", "country": "DE", "attacks": 980, "risk_score": 88},
            {"ip": "194.26.29.112", "country": "RU", "attacks": 765, "risk_score": 84},
            {"ip": "103.251.140.2", "country": "CN", "attacks": 540, "risk_score": 79},
            {"ip": "89.248.165.11", "country": "NL", "attacks": 420, "risk_score": 75},
        ],
        "most_targeted_systems": [
            {"system": "API Gateway (192.168.1.100)", "events": 3420, "risk": "Critical"},
            {"system": "Database Cluster (192.168.1.250)", "events": 1890, "risk": "High"},
            {"system": "Authentication Server (192.168.1.105)", "events": 1240, "risk": "High"},
            {"system": "Internal DNS (192.168.1.2)", "events": 860, "risk": "Moderate"},
            {"system": "Finance Workstations", "events": 310, "risk": "Low"},
        ]
    }
