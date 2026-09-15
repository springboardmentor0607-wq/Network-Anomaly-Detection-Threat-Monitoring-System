import logging
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.role import Role, RoleEnum
from app.models.team import Team
from app.models.user import User
from app.models.ml_model import MLModel
from app.models.threat_intelligence import ThreatIntelligence

logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
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
            role = Role(name=role_name, description=description)
            db.add(role)
            db.commit()
            db.refresh(role)
        role_objs[role_name] = role

    # 2. Seed Default Team
    team = db.query(Team).filter(Team.name == "Alpha SOC Operations").first()
    if not team:
        team = Team(name="Alpha SOC Operations", description="Primary Incident Response & Threat Monitoring Unit")
        db.add(team)
        db.commit()
        db.refresh(team)

    # 3. Seed Default Users for Demo & Development
    hashed_password = get_password_hash("AdminPass123!")

    demo_users = [
        ("admin@netshield.ai", "System Admin", RoleEnum.ADMIN),
        ("manager@netshield.ai", "SOC Manager User", RoleEnum.SOC_MANAGER),
        ("analyst@netshield.ai", "Lead Security Analyst", RoleEnum.SECURITY_ANALYST),
        ("viewer@netshield.ai", "Security Auditor", RoleEnum.VIEWER),
    ]

    for email, full_name, role_enum in demo_users:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                password_hash=hashed_password,
                role_id=role_objs[role_enum].id,
                team_id=team.id,
                is_active=True
            )
            db.add(user)
    db.commit()

    # 4. Seed Baseline ML Model Entry
    baseline_model = db.query(MLModel).filter(MLModel.name == "Isolation Forest Anomaly Baseline").first()
    if not baseline_model:
        baseline_model = MLModel(
            name="Isolation Forest Anomaly Baseline",
            version="1.0.0",
            algorithm="IsolationForest",
            task_type="anomaly_detection",
            dataset_name="CICIDS2017 Sample",
            is_active=True,
            accuracy=0.942,
            precision=0.925,
            recall=0.938,
            f1_score=0.931,
            artifact_path="ml_artifacts/cicids2017/isolation_forest_v1.joblib"
        )
        db.add(baseline_model)

    classifier_model = db.query(MLModel).filter(MLModel.name == "XGBoost Attack Classifier").first()
    if not classifier_model:
        classifier_model = MLModel(
            name="XGBoost Attack Classifier",
            version="1.0.0",
            algorithm="XGBoost",
            task_type="classification",
            dataset_name="CICIDS2017 Multi-Class",
            is_active=True,
            accuracy=0.961,
            precision=0.954,
            recall=0.958,
            f1_score=0.956,
            artifact_path="ml_artifacts/cicids2017/xgboost_classifier_v1.joblib"
        )
        db.add(classifier_model)
    db.commit()

    # 5. Seed Mock Threat Intelligence Indicators
    mock_ips = [
        ("192.168.1.45", 15, "Clean", "US", "United States", "Internal Enterprise Subnet"),
        ("203.0.113.24", 92, "Malicious", "RU", "Russian Federation", "Known Botnet Command & Control"),
        ("198.51.100.88", 78, "Suspicious", "CN", "China", "Scrape & Port Scan Source"),
    ]
    for ip, score, rep, c_code, c_name, isp in mock_ips:
        ti = db.query(ThreatIntelligence).filter(ThreatIntelligence.ip_address == ip).first()
        if not ti:
            ti = ThreatIntelligence(
                ip_address=ip,
                threat_score=score,
                reputation=rep,
                country_code=c_code,
                country_name=c_name,
                isp=isp,
                known_attack_types={"observed": ["DDoS", "PortScan"]},
                ioc_matches={"matched_rules": ["ET MALWARE C2 Communication"]}
            )
            db.add(ti)
    db.commit()
    logger.info("Database initialized & seeded successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    init_db(db)
    print("Database seeding completed.")
