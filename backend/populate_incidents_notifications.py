import sys
import os
import random
from database import fetch_all, execute_query

def backfill():
    print("Checking existing records...")
    inc_res = fetch_all("SELECT COUNT(*) as count FROM incidents")
    inc_count = inc_res[0]['count'] if inc_res else 0
    notif_res = fetch_all("SELECT COUNT(*) as count FROM notifications")
    notif_count = notif_res[0]['count'] if notif_res else 0
    print(f"Current incidents: {inc_count}, notifications: {notif_count}")

    alerts = fetch_all("""
        SELECT a.id, a.threat_id, a.title, a.description, a.severity, a.status, a.created_at,
               t.source_ip, t.destination_ip, t.attack_type, t.protocol
        FROM security_alerts a
        LEFT JOIN threats t ON a.threat_id = t.id
        ORDER BY a.created_at DESC
    """)
    print(f"Found {len(alerts)} security alerts to process.")

    statuses = ['OPEN', 'OPEN', 'INVESTIGATING', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED']

    inserted_notifs = 0
    inserted_incs = 0

    for idx, alert in enumerate(alerts):
        # 1. Notifications
        is_read = (idx >= 8)
        execute_query(
            """INSERT INTO notifications (user_id, alert_id, title, message, severity, is_read, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (1, alert['id'], alert['title'], alert['description'], alert['severity'], is_read, alert['created_at'])
        )
        inserted_notifs += 1

        # 2. Incidents
        status_choice = statuses[idx % len(statuses)]
        src = alert.get('source_ip') or '192.168.1.100'
        dst = alert.get('destination_ip') or '10.0.0.1'
        proto = alert.get('protocol') or 'TCP'
        atk = alert.get('attack_type') or 'Suspicious Flow'

        inc_title = f"{atk} Incident - Inbound from {src}"
        inc_desc = f"Automated SOC escalation: {atk} attack identified targeting {dst} ({proto}). Immediate containment required."
        
        resolution_text = "Traffic blocked at perimeter firewall and threat signature updated in IDS." if status_choice in ['RESOLVED', 'CLOSED'] else None

        execute_query(
            """INSERT INTO incidents (alert_id, title, description, priority, assigned_to, status, resolution, created_at, updated_at)
               VALUES (%s, %s, %s, %s, 1, %s, %s, %s, %s)""",
            (alert['id'], inc_title, inc_desc, alert['severity'], status_choice, resolution_text, alert['created_at'], alert['created_at'])
        )
        inserted_incs += 1

    print(f"Successfully backfilled {inserted_notifs} notifications and {inserted_incs} incidents.")

if __name__ == '__main__':
    backfill()
