from datetime import datetime, timedelta
from app.database.connection import SessionLocal, Base, engine
from app.database.models import User, MLModelRecord, ThreatRecord, AnomalyRecord
from app.utils.security import hash_password
from app.ml.train import train_model_pipeline

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if not db.query(User).filter(User.email == "analyst@netshield.ai").first():
        admin = User(
            full_name="Security Analyst Administrator",
            email="analyst@netshield.ai",
            phone_number="+1-800-NET-SHIELD",
            department="Cyber Threat Intelligence",
            employee_id="EMP-00142",
            role="Security Administrator",
            password_hash=hash_password("admin123")
        )
        db.add(admin)

    # Train default model and populate metrics
    train_model_pipeline("Random Forest Classifier", "NSL-KDD")

    if db.query(ThreatRecord).count() == 0:
        sample_threats = [
            ("192.168.1.45", "203.45.67.89", "TCP", "DDoS Attack", "High", 92.0, 98.5, "Blocked"),
            ("10.0.0.23", "172.217.14.206", "TCP", "Port Scan", "Medium", 67.0, 94.2, "Blocked"),
            ("192.168.1.78", "185.220.101.1", "UDP", "Brute Force", "High", 89.0, 96.1, "Blocked"),
            ("10.0.0.15", "104.16.248.249", "TCP", "SQL Injection", "High", 91.0, 99.1, "Blocked"),
            ("192.168.1.102", "8.8.8.8", "UDP", "Malware Traffic", "Medium", 58.0, 88.0, "Quarantined"),
            ("10.0.0.8", "151.101.1.69", "TCP", "Suspicious Traffic", "Low", 34.0, 75.0, "Allowed"),
            ("192.168.1.55", "45.33.32.156", "TCP", "XSS Attack", "Medium", 61.0, 91.4, "Blocked"),
            ("10.0.0.50", "23.227.38.65", "TCP", "C2 Communication", "Critical", 98.0, 99.4, "Blocked")
        ]
        for src, dst, proto, t_type, sev, r_score, conf, st in sample_threats:
            db.add(ThreatRecord(
                timestamp=datetime.utcnow() - timedelta(minutes=int(r_score)),
                source_ip=src, destination_ip=dst, protocol=proto,
                threat_type=t_type, severity=sev, risk_score=r_score,
                confidence=conf, anomaly_score=round(r_score / 100.0, 2),
                status=st, is_demo=True
            ))

    if db.query(AnomalyRecord).count() == 0:
        sample_anomalies = [
            ("192.168.1.45", "203.45.67.89", "TCP", 0.92, "High", "Unusual data transfer volume"),
            ("10.0.0.23", "172.217.14.206", "TCP", 0.78, "Medium", "Unusual connection pattern"),
            ("192.168.1.78", "185.220.101.1", "UDP", 0.71, "Medium", "Unusual port access"),
            ("10.0.0.15", "104.16.248.249", "TCP", 0.88, "High", "Multiple failed attempts"),
            ("192.168.1.102", "8.8.8.8", "UDP", 0.66, "Medium", "DNS tunneling behavior")
        ]
        for src, dst, proto, sc, sev, desc in sample_anomalies:
            db.add(AnomalyRecord(
                timestamp=datetime.utcnow() - timedelta(minutes=int(sc * 50)),
                source_ip=src, destination_ip=dst, protocol=proto,
                anomaly_score=sc, severity=sev, description=desc, is_demo=True
            ))

    db.commit()
    db.close()
    print("[+] NetShield AI Database seeded successfully with baseline model and demo records.")

if __name__ == "__main__":
    seed_database()