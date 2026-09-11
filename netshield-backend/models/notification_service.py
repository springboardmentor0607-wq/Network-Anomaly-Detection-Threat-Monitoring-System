from datetime import datetime
from db import get_db_connection

# In-memory storage fallback if PostgreSQL is offline
in_memory_notifications = []

def create_notification_from_alert_incident(alert_info, incident_info=None):
    """
    Generates a security notification from an alert and incident record,
    persisting it in PostgreSQL notifications table.
    """
    alert_id = alert_info.get("alert_id") or alert_info.get("alertId")
    incident_id = incident_info.get("incident_id") if incident_info else None
    attack_type = alert_info.get("attack_type", "Anomalous Traffic")
    severity = alert_info.get("threat_severity") or alert_info.get("severity", "High")
    risk_score = alert_info.get("risk_score", 70)
    confidence_score = alert_info.get("confidence_score", 95.0)
    source_ip = alert_info.get("source_ip", "192.168.1.100")
    dest_ip = alert_info.get("dest_ip", "10.0.0.1")
    timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Formulate message
    if severity.lower() == "critical":
        message = (
            f"CRITICAL SECURITY ALERT: {attack_type} attack detected from {source_ip} targeting {dest_ip}. "
            f"Risk Score: {risk_score}/100. Incident {incident_id or 'Created'}. Investigate immediately."
        )
    elif severity.lower() == "high":
        message = (
            f"HIGH THREAT ALERT: {attack_type} threat detected from {source_ip} to {dest_ip}. "
            f"Risk Score: {risk_score}/100. Incident {incident_id or 'Created'}. Action required."
        )
    else:
        message = (
            f"SECURITY NOTICE: {attack_type} traffic detected from {source_ip} to {dest_ip}. "
            f"Risk Score: {risk_score}/100. Incident {incident_id or 'Created'}."
        )

    conn = get_db_connection()
    inserted_id = None
    notif_id_str = f"NOTIF-{int(datetime.now().timestamp() * 1000) % 1000000}"

    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO notifications
                (notification_id, alert_id, incident_id, attack_type, severity, risk_score, confidence, source_ip, dest_ip, message, status, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                "NOTIF-TEMP",
                alert_id,
                incident_id,
                attack_type,
                severity,
                risk_score,
                confidence_score,
                source_ip,
                dest_ip,
                message,
                "Unread",
                timestamp_now
            ))
            row = cursor.fetchone()
            if row:
                inserted_id = row[0]
                notif_id_str = f"NOTIF-{inserted_id:04d}"
                cursor.execute("UPDATE notifications SET notification_id = %s WHERE id = %s;", (notif_id_str, inserted_id))
            conn.commit()
            cursor.close()
        except Exception as db_err:
            if conn:
                conn.rollback()
            print("[ERROR] Failed to insert notification into database:", db_err)

    notification_dict = {
        "id": inserted_id or len(in_memory_notifications) + 1,
        "notification_id": notif_id_str,
        "alert_id": alert_id,
        "incident_id": incident_id,
        "attack_type": attack_type,
        "severity": severity,
        "risk_score": risk_score,
        "confidence": f"{confidence_score:.2f}%",
        "confidence_score": confidence_score,
        "source_ip": source_ip,
        "dest_ip": dest_ip,
        "message": message,
        "status": "Unread",
        "timestamp": timestamp_now
    }

    if not conn or not inserted_id:
        in_memory_notifications.insert(0, notification_dict)

    return notification_dict

def get_notifications(limit=50, status_filter=None):
    """
    Fetches list of notifications from PostgreSQL or in-memory fallback.
    """
    conn = get_db_connection()
    if not conn:
        res = list(in_memory_notifications)
        if status_filter and status_filter.lower() != "all":
            res = [n for n in res if n["status"].lower() == status_filter.lower()]
        return res[:limit]

    try:
        cursor = conn.cursor()
        query = """
            SELECT id, notification_id, alert_id, incident_id, attack_type, severity, risk_score, confidence, source_ip, dest_ip, message, status, timestamp
            FROM notifications
        """
        params = []
        if status_filter and status_filter.lower() != "all":
            query += " WHERE LOWER(status) = LOWER(%s)"
            params.append(status_filter)

        query += " ORDER BY id DESC LIMIT %s;"
        params.append(limit)

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        cursor.close()

        notifications = []
        for r in rows:
            notifications.append({
                "id": r[0],
                "notification_id": r[1] or f"NOTIF-{r[0]:04d}",
                "alert_id": r[2],
                "incident_id": r[3],
                "attack_type": r[4] or "Anomalous Traffic",
                "severity": r[5] or "High",
                "risk_score": r[6] if r[6] is not None else 70,
                "confidence": f"{r[7]}%" if r[7] is not None else "95.00%",
                "confidence_score": float(r[7]) if r[7] is not None else 95.0,
                "source_ip": r[8] or "192.168.1.100",
                "dest_ip": r[9] or "10.0.0.1",
                "message": r[10] or "Security threat notification",
                "status": r[11] or "Unread",
                "timestamp": str(r[12])[:19] if r[12] else ""
            })

        return notifications
    except Exception as e:
        print("[ERROR] Error fetching notifications from DB:", e)
        res = list(in_memory_notifications)
        if status_filter and status_filter.lower() != "all":
            res = [n for n in res if n["status"].lower() == status_filter.lower()]
        return res[:limit]

def get_unread_notification_count():
    """
    Returns the integer count of unread notifications.
    """
    conn = get_db_connection()
    if not conn:
        return len([n for n in in_memory_notifications if n["status"].lower() == "unread"])

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE LOWER(status) = 'unread';")
        count = cursor.fetchone()[0] or 0
        cursor.close()
        return count
    except Exception as e:
        print("[ERROR] Error getting unread notification count:", e)
        return len([n for n in in_memory_notifications if n["status"].lower() == "unread"])

def mark_notification_as_read(notification_id):
    """
    Marks a single notification as 'Read'.
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            if str(notification_id).isdigit():
                cursor.execute("UPDATE notifications SET status = 'Read' WHERE id = %s OR notification_id = %s;", (int(notification_id), str(notification_id)))
            else:
                cursor.execute("UPDATE notifications SET status = 'Read' WHERE notification_id = %s;", (str(notification_id),))
            conn.commit()
            cursor.close()
        except Exception as db_err:
            if conn:
                conn.rollback()
            print("[ERROR] Error updating notification status:", db_err)

    for n in in_memory_notifications:
        if str(n["id"]) == str(notification_id) or n["notification_id"] == str(notification_id):
            n["status"] = "Read"

    return True

def mark_all_notifications_as_read():
    """
    Marks all unread notifications as 'Read'.
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE notifications SET status = 'Read' WHERE LOWER(status) = 'unread';")
            conn.commit()
            cursor.close()
        except Exception as db_err:
            if conn:
                conn.rollback()
            print("[ERROR] Error marking all notifications read:", db_err)

    for n in in_memory_notifications:
        n["status"] = "Read"

    return True
