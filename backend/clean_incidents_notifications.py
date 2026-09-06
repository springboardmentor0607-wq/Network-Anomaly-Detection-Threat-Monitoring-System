import sys
from database import execute_query, fetch_all

def clean_and_reseed():
    print("Clearing old verbose incidents and spam notifications...")
    execute_query("DELETE FROM incidents")
    execute_query("DELETE FROM notifications")

    # 1. Exactly ONE notification for the uploaded dataset
    dataset = fetch_all("SELECT id, filename, rows_count, upload_time FROM datasets ORDER BY id DESC LIMIT 1")
    if dataset:
        ds = dataset[0]
        fname = ds['filename']
        rows = ds['rows_count']
        alert = fetch_all("SELECT id FROM security_alerts ORDER BY id ASC LIMIT 1")
        alert_id = alert[0]['id'] if alert else None
        
        execute_query(
            """INSERT INTO notifications (user_id, alert_id, title, message, severity, is_read, created_at)
               VALUES (%s, %s, %s, %s, 'CRITICAL', FALSE, %s)""",
            (1, alert_id, f"Threats Detected in {fname}", f"{fname} processed ({rows} flows). Random Forest flagged security threats for SOC response.", ds['upload_time'])
        )
        print("Created 1 single consolidated dataset notification.")
    else:
        execute_query(
            """INSERT INTO notifications (user_id, alert_id, title, message, severity, is_read)
               VALUES (1, NULL, 'NetShield AI Security Monitor Active', 'Random Forest threat monitoring engine initialized.', 'LOW', FALSE)"""
        )

    # 2. Clean Incidents with simple titles like 'DDoS Incident'
    incidents_data = [
        {
            'title': 'DDoS Incident',
            'desc': 'Distributed Denial of Service attack detected by Random Forest model.',
            'priority': 'CRITICAL',
            'status': 'OPEN',
            'resolution': None
        },
        {
            'title': 'SSH-Patator Incident',
            'desc': 'SSH brute-force attack pattern detected by Random Forest model.',
            'priority': 'HIGH',
            'status': 'INVESTIGATING',
            'resolution': None
        },
        {
            'title': 'FTP-Patator Incident',
            'desc': 'FTP credential brute-force attempts detected by Random Forest model.',
            'priority': 'HIGH',
            'status': 'CONTAINED',
            'resolution': 'Perimeter firewall rate-limiting applied to inbound port 21.'
        },
        {
            'title': 'DDoS Incident',
            'desc': 'High-volume SYN flood traffic mitigated by traffic shaping.',
            'priority': 'CRITICAL',
            'status': 'RESOLVED',
            'resolution': 'Upstream ISP traffic scrubbing engaged and ingress ACL updated.'
        },
        {
            'title': 'SSH-Patator Incident',
            'desc': 'Automated authentication failure bursts contained.',
            'priority': 'HIGH',
            'status': 'CLOSED',
            'resolution': 'Source IP subnet blocked at edge router and analyst verified containment.'
        }
    ]

    for inc in incidents_data:
        execute_query(
            """INSERT INTO incidents (alert_id, title, description, priority, assigned_to, status, resolution, created_at, updated_at)
               VALUES (NULL, %s, %s, %s, 1, %s, %s, NOW(), NOW())""",
            (inc['title'], inc['desc'], inc['priority'], inc['status'], inc['resolution'])
        )
    print(f"Created {len(incidents_data)} clean incidents.")

if __name__ == '__main__':
    clean_and_reseed()
