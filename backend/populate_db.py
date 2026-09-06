import sqlite3
import os
import sys
from datetime import datetime, timedelta
import joblib
import pandas as pd

base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(base_dir)

from ml.preprocessing import preprocess_dataframe, find_label_column, clean_column_names
from ml.prediction import predict_network_traffic

db_path = os.path.join(base_dir, 'netshield_ai.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Clear existing rows to ensure clean exact state
for tbl in ['predictions', 'threats', 'security_alerts', 'incidents', 'datasets', 'users', 'threat_intelligence', 'audit_logs']:
    cur.execute(f"DELETE FROM {tbl}")

# 1. Users
cur.execute("""INSERT INTO users (id, name, email, password_hash, role, status) VALUES 
(1, 'SOC Administrator', 'admin@netshield.ai', 'scrypt:32768:8:1$QdWHcvJFjnod7ZEM$26a186315f9236b6d1387dfd68924f7eff9463be7a390dc1fc86e6b683ef52721f6c292f580390fc2f4ae200262e965d0606b2b8838af120b575da93f02996b7', 'ADMIN', 'ACTIVE'),
(2, 'Security Analyst', 'analyst@netshield.ai', 'scrypt:32768:8:1$bS8wK0tdCfAJAH7E$859141465e3bfeba438c73deb1d18e8b61bcc9092ed40b8952c8af9d1a42a21e073ecb2d00ebaadb74426c2737caed233d23ac67e9efd51474848fdbceaa817d', 'SECURITY_ANALYST', 'ACTIVE');""")

# 2. Threat Intelligence
threat_intels = [
    ('BENIGN', 'LOW', 5, 'Normal network traffic exhibiting standard protocol behaviors with no malicious payload signatures.', 'Continue routine passive telemetry monitoring. No defensive action needed.'),
    ('FTP-Patator', 'MEDIUM', 65, 'Automated brute-force password guessing attack targeting FTP services to gain unauthorized access.', 'Enforce rate-limiting on port 21, temporarily block attacking IPs via firewall, and enforce strong password policies.'),
    ('SSH-Patator', 'HIGH', 80, 'Brute-force SSH attack attempting dictionary credentials against administrative remote terminals.', 'Disable password authentication on SSH (enforce Ed25519 keys), bind SSH to non-standard port or VPN, and ban source IP via Fail2Ban.'),
    ('DDoS', 'CRITICAL', 95, 'Distributed Denial of Service attack flooding bandwidth and connection pools to bring down mission-critical services.', 'Trigger BGP Anycast scrubbing, activate Cloudflare/AWS Shield DDoS mitigation rate-limits, blackhole spoofed subnet traffic, and engage incident response team.')
]
for ti in threat_intels:
    cur.execute("INSERT INTO threat_intelligence (attack_type, severity, risk_score, description, recommended_response) VALUES (?, ?, ?, ?, ?)", ti)

# 3. Model & Data
model = joblib.load(os.path.join(base_dir, 'models', 'network_model.pkl'))
le = joblib.load(os.path.join(base_dir, 'models', 'label_encoder.pkl'))
feats = joblib.load(os.path.join(base_dir, 'models', 'feature_names.pkl'))

csv_path = os.path.join(os.path.dirname(base_dir), 'dataset', 'sample_network_traffic.csv')
df = pd.read_csv(csv_path)
df_clean = clean_column_names(df)
label_col = find_label_column(df_clean)
y_raw = df_clean[label_col].astype(str).str.strip().tolist()

X_df, _, _ = preprocess_dataframe(df_clean, model_feature_names=feats)
preds = predict_network_traffic(model, le, X_df)

cur.execute("""INSERT INTO datasets (id, filename, dataset_type, rows_count, columns_count, uploaded_by, has_ground_truth, status, upload_time)
VALUES (1, 'sample_network_traffic.csv', 'CICIDS2017 Benchmark Flow', ?, 78, 1, 1, 'PROCESSED', datetime('now', '-2 hours'))""", (len(df),))

now = datetime.now()
threat_id_seq = 1
alert_id_seq = 1

source_ips = ['192.168.1.105', '192.168.1.120', '10.0.0.55', '172.16.0.45', '192.168.1.80']
dest_ips = ['10.0.0.1', '10.0.0.2', '10.0.0.5', '172.16.0.1']

for i, p in enumerate(preds):
    offset_minutes = int((len(preds) - i) * 2.8)
    ts = (now - timedelta(minutes=offset_minutes)).strftime('%Y-%m-%d %H:%M:%S')
    
    cur.execute("""INSERT INTO predictions (id, dataset_id, actual_label, predicted_label, confidence, risk_score, severity, timestamp)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?)""", (i+1, y_raw[i], p['predicted_label'], p['confidence'], p['risk_score'], p['severity'], ts))
    
    if p['predicted_label'].upper() not in ('BENIGN', 'NORMAL'):
        s_ip = source_ips[i % len(source_ips)]
        d_ip = dest_ips[i % len(dest_ips)]
        proto = 'TCP' if p['predicted_label'] != 'DDoS' or (i % 2 == 0) else 'UDP'
        status = 'NEW' if i % 3 == 0 else ('INVESTIGATING' if i % 3 == 1 else 'CONTAINED')
        
        cur.execute("""INSERT INTO threats (id, prediction_id, attack_type, source_ip, destination_ip, protocol, confidence, risk_score, severity, status, detected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", (threat_id_seq, i+1, p['predicted_label'], s_ip, d_ip, proto, p['confidence'], p['risk_score'], p['severity'], status, ts))
        
        if p['severity'] in ('CRITICAL', 'HIGH'):
            title = f"{p['severity']} {p['predicted_label']} Incursion"
            desc = f"Detected {p['predicted_label']} anomaly targeting {d_ip} from {s_ip} with {p['confidence']*100:.1f}% confidence."
            alert_status = 'OPEN' if alert_id_seq % 2 == 1 else 'INVESTIGATING'
            
            cur.execute("""INSERT INTO security_alerts (id, threat_id, title, description, severity, alert_type, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'AI Threat Detection', ?, ?)""",
            (alert_id_seq, threat_id_seq, title, desc, p['severity'], alert_status, ts))
            
            if alert_id_seq <= 5:
                inc_title = f"SOC Incident #{alert_id_seq}: {p['predicted_label']} Outbreak"
                inc_desc = f"Automated SOC triage for {p['predicted_label']} traffic identified on ingress gateway."
                inc_status = 'OPEN' if alert_id_seq < 3 else 'INVESTIGATING'
                
                cur.execute("""INSERT INTO incidents (id, alert_id, title, description, priority, assigned_to, status, created_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)""",
                (alert_id_seq, alert_id_seq, inc_title, inc_desc, p['severity'], inc_status, ts))
            
            alert_id_seq += 1
            
        threat_id_seq += 1

cur.execute("""INSERT INTO audit_logs (user_id, action, module, ip_address) VALUES 
(1, 'DATASET_INSPECTION_CICIDS2017', 'ML_ENGINE', '127.0.0.1'),
(1, 'SOC_ANALYTICS_INITIALIZATION', 'SECURITY_ANALYTICS', '127.0.0.1');""")

conn.commit()

cur.execute("SELECT COUNT(*) FROM predictions")
print("Total predictions inserted:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM threats")
print("Total threats inserted:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM security_alerts")
print("Total alerts inserted:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM incidents")
print("Total incidents inserted:", cur.fetchone()[0])
conn.close()
print("Populated netshield_ai.db successfully!")
