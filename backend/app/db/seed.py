"""
Database initialization and seeding module.
Creates all tables and seeds essential data for the NetShield AI demo.
"""
import uuid
import random
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.role import Role, RoleEnum
from app.models.team import Team
from app.models.user import User
from app.models.ml_model import MLModel
from app.models.threat_intelligence import ThreatIntelligence
from app.models.traffic import TrafficFlow
from app.models.anomaly import Anomaly
from app.models.prediction import Prediction
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.incident import Incident, IncidentStatus
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    """Initialize database schema and seed initial data."""
    # Create all tables in database schema
    Base.metadata.create_all(bind=engine)

    # 1. Seed Roles
    roles_data = [
        (RoleEnum.ADMIN, "Full system administration and user management access"),
        (RoleEnum.SOC_MANAGER, "Security Operations Center Manager - full operational and report management"),
        (RoleEnum.SECURITY_ANALYST, "Security Analyst - live monitoring, alert triage, incident response"),
        (RoleEnum.VIEWER, "Read-only executive and audit dashboard access"),
    ]
    role_objs = {}
    for role_name, description in roles_data:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(id=str(uuid.uuid4()), name=role_name, description=description)
            db.add(role)
            db.commit()
            db.refresh(role)
        role_objs[role_name] = role

    # 2. Seed Default Teams
    teams_data = [
        ("Alpha SOC Operations", "Primary Incident Response & Threat Monitoring Unit"),
        ("Threat Intelligence Team", "Proactive threat hunting and intelligence gathering"),
        ("Network Security Engineering", "Infrastructure security and hardening"),
    ]
    team_obj = None
    for tname, tdesc in teams_data:
        team = db.query(Team).filter(Team.name == tname).first()
        if not team:
            team = Team(id=str(uuid.uuid4()), name=tname, description=tdesc)
            db.add(team)
            db.commit()
            db.refresh(team)
        if team_obj is None:
            team_obj = team

    # 3. Seed Demo Users
    hashed_password = get_password_hash("AdminPass123!")

    demo_users = [
        ("admin@netshield.ai", "System Administrator", RoleEnum.ADMIN),
        ("manager@netshield.ai", "SOC Manager", RoleEnum.SOC_MANAGER),
        ("analyst@netshield.ai", "Lead Security Analyst", RoleEnum.SECURITY_ANALYST),
        ("viewer@netshield.ai", "Security Auditor", RoleEnum.VIEWER),
    ]

    for email, full_name, role_enum in demo_users:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                full_name=full_name,
                password_hash=hashed_password,
                role_id=role_objs[role_enum].id,
                team_id=team_obj.id if team_obj else None,
                is_active=True
            )
            db.add(user)
    db.commit()

    # 4. Seed Baseline ML Model Entries
    baseline_model = db.query(MLModel).filter(MLModel.name == "Isolation Forest Anomaly Baseline").first()
    if not baseline_model:
        baseline_model = MLModel(
            id=str(uuid.uuid4()),
            name="Isolation Forest Anomaly Baseline",
            version="1.0.0",
            algorithm="IsolationForest",
            task_type="anomaly_detection",
            dataset_name="CICIDS2017 (Synthetic)",
            is_active=True,
            accuracy=0.9091,
            precision=0.9392,
            recall=0.8742,
            f1_score=0.9055,
            artifact_path="ml_artifacts/cicids2017/isolation_forest.joblib",
            metrics_json={
                "accuracy": 0.9091, "precision": 0.9392, "recall": 0.8742,
                "f1_score": 0.9055, "detection_rate": 0.8742, "false_positive_rate": 0.0608,
                "dataset": "CICIDS2017 (Synthetic)", "is_synthetic": True,
            }
        )
        db.add(baseline_model)

    classifier_model = db.query(MLModel).filter(MLModel.name == "RandomForest Attack Classifier").first()
    if not classifier_model:
        classifier_model = MLModel(
            id=str(uuid.uuid4()),
            name="RandomForest Attack Classifier",
            version="1.0.0",
            algorithm="RandomForestClassifier",
            task_type="classification",
            dataset_name="CICIDS2017 (Synthetic)",
            is_active=True,
            accuracy=0.9122,
            precision=1.0,
            recall=1.0,
            f1_score=1.0,
            artifact_path="ml_artifacts/cicids2017/attack_classifier.joblib",
            metrics_json={
                "accuracy": 0.9122, "precision": 1.0, "recall": 1.0,
                "f1_score": 1.0, "detection_rate": 1.0, "false_positive_rate": 0.0,
                "attack_classification_accuracy": 0.9122,
                "dataset": "CICIDS2017 (Synthetic)", "is_synthetic": True,
                "attack_classes": [
                    "BENIGN", "Command Injection", "DDoS", "DNS Tunneling",
                    "DoS SYN Flood", "FTP Brute Force", "Port Scan",
                    "Reconnaissance", "SQL Injection", "SSH Brute Force"
                ]
            }
        )
        db.add(classifier_model)
    db.commit()

    # 5. Seed Threat Intelligence Indicators
    mock_threats = [
        ("192.168.1.45", 15, "Clean", "US", "United States", "Internal Enterprise Subnet"),
        ("203.0.113.24", 92, "Malicious", "RU", "Russian Federation", "Known Botnet C2"),
        ("198.51.100.88", 78, "Suspicious", "CN", "China", "Port Scan Source"),
        ("185.220.101.5", 85, "Malicious", "DE", "Germany", "Tor Exit Node"),
        ("94.102.49.190", 71, "Suspicious", "NL", "Netherlands", "Known Proxy"),
        ("103.251.140.2", 68, "Suspicious", "CN", "China", "DDoS Infrastructure"),
        ("42.112.98.14", 95, "Malicious", "US", "United States", "APT Group Infrastructure"),
    ]
    for ip, score, rep, c_code, c_name, isp in mock_threats:
        ti = db.query(ThreatIntelligence).filter(ThreatIntelligence.ip_address == ip).first()
        if not ti:
            ti = ThreatIntelligence(
                id=str(uuid.uuid4()),
                ip_address=ip,
                threat_score=score,
                reputation=rep,
                country_code=c_code,
                country_name=c_name,
                isp=isp,
                known_attack_types={"observed": ["DDoS", "PortScan", "BruteForce"]},
                ioc_matches={"matched_rules": ["ET MALWARE C2 Communication"]}
            )
            db.add(ti)
    db.commit()

    # 6. Seed Initial Demo Traffic, Anomalies and Alerts
    existing_traffic = db.query(TrafficFlow).count()
    if existing_traffic == 0:
        _seed_demo_traffic(db)

    # 7. Seed Audit Logs
    existing_audit = db.query(AuditLog).count()
    if existing_audit == 0:
        admin_user = db.query(User).filter(User.email == "admin@netshield.ai").first()
        analyst_user = db.query(User).filter(User.email == "analyst@netshield.ai").first()
        audit_entries = [
            AuditLog(id=str(uuid.uuid4()), user_email="admin@netshield.ai", action="SYSTEM_INIT", resource="SYSTEM", status_result="SUCCESS", details={"message": "NetShield AI initialized"}),
            AuditLog(id=str(uuid.uuid4()), user_email="admin@netshield.ai", action="LOGIN_SUCCESS", resource="AUTH", status_result="SUCCESS", ip_address="127.0.0.1"),
            AuditLog(id=str(uuid.uuid4()), user_email="analyst@netshield.ai", action="LOGIN_SUCCESS", resource="AUTH", status_result="SUCCESS", ip_address="127.0.0.1"),
            AuditLog(id=str(uuid.uuid4()), user_email="unknown@attacker.com", action="LOGIN_FAILED", resource="AUTH", status_result="FAILURE", ip_address="203.0.113.24", details={"reason": "Invalid credentials"}),
        ]
        for entry in audit_entries:
            db.add(entry)
        db.commit()

    logger.info("Database initialized & seeded successfully.")


def _seed_demo_traffic(db: Session):
    """Seed demo traffic flows with anomalies, predictions, and alerts for demonstration."""
    source_ips = ["192.168.1.10", "192.168.1.25", "10.0.0.5", "203.0.113.24", "198.51.100.88", "185.220.101.5"]
    dest_ips = ["192.168.1.100", "192.168.1.200", "8.8.8.8", "192.168.1.1"]
    protocols = ["TCP", "UDP", "ICMP", "DNS", "HTTP", "HTTPS", "SSH"]

    scenarios = [
        # (src_ip, dst_ip, proto, dst_port, packets, bytes, duration, attack_class, is_anomaly, severity)
        ("203.0.113.24", "192.168.1.100", "TCP", 80, 8500, 1700000, 2.1, "DoS SYN Flood", True, AlertSeverity.CRITICAL),
        ("198.51.100.88", "192.168.1.100", "TCP", 22, 1200, 240000, 120.0, "SSH Brute Force", True, AlertSeverity.HIGH),
        ("185.220.101.5", "192.168.1.100", "DNS", 53, 400, 800000, 300.0, "DNS Tunneling", True, AlertSeverity.HIGH),
        ("192.168.1.10", "8.8.8.8", "UDP", 53, 5, 1500, 0.5, "BENIGN", False, None),
        ("192.168.1.25", "192.168.1.200", "TCP", 443, 20, 35000, 5.0, "BENIGN", False, None),
        ("203.0.113.24", "192.168.1.1", "TCP", 3306, 50, 5000, 1.0, "SQL Injection", True, AlertSeverity.CRITICAL),
        ("10.0.0.5", "192.168.1.100", "TCP", 80, 3, 240, 0.1, "BENIGN", False, None),
        ("198.51.100.88", "192.168.1.200", "ICMP", 0, 4000, 200000, 1.0, "DDoS", True, AlertSeverity.CRITICAL),
        ("192.168.1.10", "192.168.1.100", "TCP", 443, 12, 18000, 3.0, "BENIGN", False, None),
        ("203.0.113.24", "192.168.1.100", "TCP", 8080, 200, 20000, 10.0, "Reconnaissance", True, AlertSeverity.MEDIUM),
    ]

    # Get admin user for incident
    admin_user = db.query(User).filter(User.email == "admin@netshield.ai").first()
    analyst_user = db.query(User).filter(User.email == "analyst@netshield.ai").first()

    # Create a sample incident
    incident = None
    if admin_user:
        incident = Incident(
            id=str(uuid.uuid4()),
            incident_id=f"INC-{str(uuid.uuid4())[:8].upper()}",
            title="Multiple Attack Sources Detected",
            description="Multiple external IP addresses have been detected launching coordinated attacks including DoS, Brute Force, and DNS Tunneling against internal infrastructure.",
            severity="CRITICAL",
            status=IncidentStatus.IN_PROGRESS,
            owner_id=admin_user.id,
            resolution_summary=None
        )
        db.add(incident)
        db.flush()

    for i, (src_ip, dst_ip, proto, dst_port, packets, bytes_val, duration, attack_class, is_anomaly, severity) in enumerate(scenarios):
        ts = datetime.utcnow() - timedelta(hours=random.randint(0, 24), minutes=random.randint(0, 59))
        flow_id = str(uuid.uuid4())

        flow = TrafficFlow(
            id=flow_id,
            timestamp=ts,
            source_ip=src_ip,
            destination_ip=dst_ip,
            source_port=random.randint(1024, 65535),
            destination_port=dst_port,
            protocol=proto,
            packets=packets,
            bytes=bytes_val,
            duration=duration,
            dataset_source="DEMO",
        )
        db.add(flow)
        db.flush()

        # Anomaly record
        score = 0.85 if is_anomaly else 0.12
        anomaly = Anomaly(
            id=str(uuid.uuid4()),
            flow_id=flow_id,
            anomaly_score=score,
            is_anomaly=is_anomaly,
            model_name="Isolation Forest",
            model_version="1.0.0",
            contributing_features={"packets": packets, "bytes": bytes_val},
        )
        db.add(anomaly)

        # Prediction for anomalous flows
        if is_anomaly and attack_class != "BENIGN":
            confidence = 0.87 + random.uniform(-0.05, 0.1)
            pred = Prediction(
                id=str(uuid.uuid4()),
                flow_id=flow_id,
                predicted_class=attack_class,
                confidence=min(0.99, confidence),
                model_name="RandomForest Attack Classifier",
                model_version="1.0.0",
            )
            db.add(pred)

            # Alert
            risk_score = {"CRITICAL": 88, "HIGH": 65, "MEDIUM": 42}.get(severity.value if severity else "LOW", 25)
            alert = Alert(
                id=str(uuid.uuid4()),
                alert_id=f"ALT-{str(uuid.uuid4())[:8].upper()}",
                title=f"{attack_class} detected from {src_ip}",
                alert_type=attack_class,
                severity=severity,
                status=AlertStatus.NEW if i < 3 else (AlertStatus.ACKNOWLEDGED if i < 6 else AlertStatus.INVESTIGATING),
                risk_score=risk_score,
                flow_id=flow_id,
                incident_id=incident.id if incident and severity == AlertSeverity.CRITICAL else None,
                notes=f"Anomaly score: {score:.3f} | Protocol: {proto} | Packets: {packets}"
            )
            db.add(alert)

    db.commit()
    logger.info("Demo traffic, anomalies, predictions, and alerts seeded.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_db(db)
        print("Database seeding completed.")
    finally:
        db.close()
