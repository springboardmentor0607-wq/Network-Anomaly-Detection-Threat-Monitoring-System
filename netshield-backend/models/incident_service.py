from datetime import datetime
from db import get_db_connection

# In-memory storage fallback if PostgreSQL is unavailable
in_memory_incidents = []
in_memory_history = []

def create_incident_from_alert(alert_info):
    """
    Creates an incident automatically from a security alert record.
    Returns the created incident dictionary.
    """
    alert_id = alert_info.get("alert_id")
    prediction_id = alert_info.get("prediction_id")
    attack_type = alert_info.get("attack_type", "Anomalous Traffic")
    threat_severity = alert_info.get("threat_severity") or alert_info.get("severity", "High")
    risk_score = alert_info.get("risk_score", 70)
    confidence_score = alert_info.get("confidence_score", 95.0)
    source_ip = alert_info.get("source_ip", "192.168.1.100")
    dest_ip = alert_info.get("dest_ip", "10.0.0.1")
    protocol = alert_info.get("protocol", "TCP")
    timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    inserted_id = None
    incident_id_str = f"INC-{int(datetime.now().timestamp() * 1000) % 1000000}"

    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO incidents
                (incident_id, alert_id, prediction_id, attack_type, threat_severity, risk_score, confidence, source_ip, dest_ip, protocol, detection_timestamp, status, responsible_user)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                "INC-TEMP",
                alert_id,
                prediction_id,
                attack_type,
                threat_severity,
                risk_score,
                confidence_score,
                source_ip,
                dest_ip,
                protocol,
                timestamp_now,
                "New",
                "Security Analyst"
            ))
            row = cursor.fetchone()
            if row:
                inserted_id = row[0]
                incident_id_str = f"INC-{inserted_id:04d}"
                cursor.execute("UPDATE incidents SET incident_id = %s WHERE id = %s;", (incident_id_str, inserted_id))
                
                # Update alert table with incident_id reference
                cursor.execute("UPDATE alerts SET incident_id = %s WHERE alert_id = %s OR id = %s;", (inserted_id, alert_id, alert_info.get("db_id")))

                # Log initial history entry
                cursor.execute("""
                    INSERT INTO incident_history (incident_id, action_type, status, notes, performed_by, timestamp)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """, (
                    incident_id_str,
                    "Incident Created",
                    "New",
                    f"Incident automatically created from Security Alert {alert_id} ({attack_type} - {threat_severity} Severity).",
                    "NetShield AI Engine",
                    timestamp_now
                ))

            conn.commit()
            cursor.close()
        except Exception as db_err:
            if conn:
                conn.rollback()
            print("[ERROR] Failed to insert incident into database:", db_err)

    incident_dict = {
        "id": inserted_id or len(in_memory_incidents) + 1,
        "incident_id": incident_id_str,
        "alert_id": alert_id,
        "prediction_id": prediction_id,
        "attack_type": attack_type,
        "threat_severity": threat_severity,
        "severity": threat_severity,
        "risk_score": risk_score,
        "confidence": f"{confidence_score:.2f}%",
        "confidence_score": confidence_score,
        "source_ip": source_ip,
        "dest_ip": dest_ip,
        "protocol": protocol,
        "detection_timestamp": timestamp_now,
        "timestamp": timestamp_now,
        "status": "New",
        "investigation_details": "",
        "action_taken": "",
        "resolution_details": "",
        "resolution_timestamp": None,
        "responsible_user": "Security Analyst"
    }

    if not conn or not inserted_id:
        in_memory_incidents.append(incident_dict)
        in_memory_history.append({
            "incident_id": incident_id_str,
            "action_type": "Incident Created",
            "status": "New",
            "notes": f"Incident automatically created from Security Alert {alert_id}.",
            "performed_by": "NetShield AI Engine",
            "timestamp": timestamp_now
        })

    return incident_dict

def get_incidents(status_filter=None, severity_filter=None, attack_type_filter=None, search_term=None):
    """
    Fetches list of all incidents with optional filtering.
    """
    conn = get_db_connection()
    if not conn:
        return filter_in_memory_incidents(status_filter, severity_filter, attack_type_filter, search_term)

    try:
        cursor = conn.cursor()
        query = """
            SELECT id, incident_id, alert_id, prediction_id, attack_type, threat_severity, risk_score, confidence, source_ip, dest_ip, protocol, detection_timestamp, status, investigation_details, action_taken, resolution_details, resolution_timestamp, responsible_user
            FROM incidents
        """
        where_clauses = []
        params = []

        if status_filter and status_filter.lower() != "all":
            where_clauses.append("LOWER(status) = LOWER(%s)")
            params.append(status_filter)
        if severity_filter and severity_filter.lower() != "all":
            where_clauses.append("LOWER(threat_severity) = LOWER(%s)")
            params.append(severity_filter)
        if attack_type_filter and attack_type_filter.lower() != "all":
            where_clauses.append("LOWER(attack_type) = LOWER(%s)")
            params.append(attack_type_filter)
        if search_term:
            s_term = f"%{search_term.lower()}%"
            where_clauses.append("(LOWER(incident_id) LIKE %s OR LOWER(alert_id) LIKE %s OR LOWER(attack_type) LIKE %s OR LOWER(source_ip) LIKE %s OR LOWER(dest_ip) LIKE %s OR LOWER(status) LIKE %s)")
            params.extend([s_term, s_term, s_term, s_term, s_term, s_term])

        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)

        query += " ORDER BY id DESC LIMIT 100;"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        cursor.close()

        incidents = []
        for r in rows:
            incidents.append({
                "id": r[0],
                "incident_id": r[1],
                "alert_id": r[2],
                "prediction_id": r[3],
                "attack_type": r[4] or "Anomalous Traffic",
                "threat_severity": r[5] or "High",
                "severity": r[5] or "High",
                "risk_score": r[6] if r[6] is not None else 70,
                "confidence": f"{r[7]}%" if r[7] is not None else "95.00%",
                "confidence_score": float(r[7]) if r[7] is not None else 95.0,
                "source_ip": r[8] or "192.168.1.100",
                "dest_ip": r[9] or "10.0.0.1",
                "protocol": r[10] or "TCP",
                "detection_timestamp": str(r[11])[:19] if r[11] else "",
                "timestamp": str(r[11])[:19] if r[11] else "",
                "status": r[12] or "New",
                "investigation_details": r[13] or "",
                "action_taken": r[14] or "",
                "resolution_details": r[15] or "",
                "resolution_timestamp": str(r[16])[:19] if r[16] else None,
                "responsible_user": r[17] or "Security Analyst"
            })

        return incidents
    except Exception as e:
        print("[ERROR] Error fetching incidents from DB:", e)
        return filter_in_memory_incidents(status_filter, severity_filter, attack_type_filter, search_term)

def get_incident_by_id(incident_id):
    """
    Fetches full incident details and history log by incident_id or database id.
    """
    conn = get_db_connection()
    if not conn:
        match = [inc for inc in in_memory_incidents if str(inc["id"]) == str(incident_id) or inc["incident_id"] == str(incident_id)]
        if match:
            inc = match[0]
            inc_history = [h for h in in_memory_history if h["incident_id"] == inc["incident_id"]]
            return {**inc, "history": inc_history}
        return None

    try:
        cursor = conn.cursor()
        if str(incident_id).isdigit():
            cursor.execute("""
                SELECT id, incident_id, alert_id, prediction_id, attack_type, threat_severity, risk_score, confidence, source_ip, dest_ip, protocol, detection_timestamp, status, investigation_details, action_taken, resolution_details, resolution_timestamp, responsible_user
                FROM incidents WHERE id = %s OR incident_id = %s LIMIT 1;
            """, (int(incident_id), str(incident_id)))
        else:
            cursor.execute("""
                SELECT id, incident_id, alert_id, prediction_id, attack_type, threat_severity, risk_score, confidence, source_ip, dest_ip, protocol, detection_timestamp, status, investigation_details, action_taken, resolution_details, resolution_timestamp, responsible_user
                FROM incidents WHERE incident_id = %s LIMIT 1;
            """, (str(incident_id),))

        r = cursor.fetchone()
        if not r:
            cursor.close()
            return None

        inc_id_str = r[1]
        incident_data = {
            "id": r[0],
            "incident_id": inc_id_str,
            "alert_id": r[2],
            "prediction_id": r[3],
            "attack_type": r[4] or "Anomalous Traffic",
            "threat_severity": r[5] or "High",
            "severity": r[5] or "High",
            "risk_score": r[6] if r[6] is not None else 70,
            "confidence": f"{r[7]}%" if r[7] is not None else "95.00%",
            "confidence_score": float(r[7]) if r[7] is not None else 95.0,
            "source_ip": r[8] or "192.168.1.100",
            "dest_ip": r[9] or "10.0.0.1",
            "protocol": r[10] or "TCP",
            "detection_timestamp": str(r[11])[:19] if r[11] else "",
            "timestamp": str(r[11])[:19] if r[11] else "",
            "status": r[12] or "New",
            "investigation_details": r[13] or "",
            "action_taken": r[14] or "",
            "resolution_details": r[15] or "",
            "resolution_timestamp": str(r[16])[:19] if r[16] else None,
            "responsible_user": r[17] or "Security Analyst"
        }

        # Fetch history log for this incident
        cursor.execute("""
            SELECT id, action_type, status, notes, performed_by, timestamp
            FROM incident_history
            WHERE incident_id = %s
            ORDER BY id ASC;
        """, (inc_id_str,))
        h_rows = cursor.fetchall()
        cursor.close()

        history = []
        for h in h_rows:
            history.append({
                "id": h[0],
                "incident_id": inc_id_str,
                "action_type": h[1],
                "status": h[2],
                "notes": h[3],
                "performed_by": h[4],
                "timestamp": str(h[5])[:19] if h[5] else ""
            })

        incident_data["history"] = history
        return incident_data
    except Exception as e:
        print("[ERROR] Error fetching incident details:", e)
        return None

def update_incident(incident_id, data):
    """
    Updates incident status (New -> Investigating -> Action Required -> Resolved),
    investigation notes, action taken, resolution details, and responsible analyst.
    Records history audit entry in DB.
    """
    status = data.get("status")
    investigation_details = data.get("investigation_details") or data.get("investigation_notes")
    action_taken = data.get("action_taken")
    resolution_details = data.get("resolution_details") or data.get("resolution_notes")
    responsible_user = data.get("responsible_user") or data.get("user") or "Security Analyst"
    notes = data.get("notes") or ""

    timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()

    if conn:
        try:
            cursor = conn.cursor()
            
            # Fetch existing incident string ID
            if str(incident_id).isdigit():
                cursor.execute("SELECT incident_id, status FROM incidents WHERE id = %s OR incident_id = %s LIMIT 1;", (int(incident_id), str(incident_id)))
            else:
                cursor.execute("SELECT incident_id, status FROM incidents WHERE incident_id = %s LIMIT 1;", (str(incident_id),))
            existing = cursor.fetchone()
            if not existing:
                cursor.close()
                return None, "Incident not found"

            inc_id_str, current_status = existing[0], existing[1]

            updates = ["updated_at = CURRENT_TIMESTAMP"]
            params = []

            if status:
                updates.append("status = %s")
                params.append(status)

            if investigation_details is not None:
                updates.append("investigation_details = %s")
                params.append(investigation_details)

            if action_taken is not None:
                updates.append("action_taken = %s")
                params.append(action_taken)

            if resolution_details is not None:
                updates.append("resolution_details = %s")
                params.append(resolution_details)

            if responsible_user:
                updates.append("responsible_user = %s")
                params.append(responsible_user)

            if status and status.lower() == "resolved":
                updates.append("resolution_timestamp = CURRENT_TIMESTAMP")

            params.append(inc_id_str)
            update_query = f"UPDATE incidents SET {', '.join(updates)} WHERE incident_id = %s;"
            cursor.execute(update_query, tuple(params))

            # Record history audit entry
            action_label = f"Status changed to {status}" if status and status != current_status else "Incident Updated"
            history_notes = notes or investigation_details or action_taken or resolution_details or f"Incident updated by {responsible_user}."
            
            cursor.execute("""
                INSERT INTO incident_history (incident_id, action_type, status, notes, performed_by, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s);
            """, (
                inc_id_str,
                action_label,
                status or current_status,
                history_notes,
                responsible_user,
                timestamp_now
            ))

            conn.commit()
            cursor.close()

            # Return updated record
            return get_incident_by_id(inc_id_str), None
        except Exception as db_err:
            if conn:
                conn.rollback()
            print("[ERROR] Error updating incident:", db_err)
            return None, str(db_err)

    # In-memory fallback
    match = [inc for inc in in_memory_incidents if str(inc["id"]) == str(incident_id) or inc["incident_id"] == str(incident_id)]
    if match:
        inc = match[0]
        if status: inc["status"] = status
        if investigation_details is not None: inc["investigation_details"] = investigation_details
        if action_taken is not None: inc["action_taken"] = action_taken
        if resolution_details is not None: inc["resolution_details"] = resolution_details
        if responsible_user: inc["responsible_user"] = responsible_user
        if status and status.lower() == "resolved": inc["resolution_timestamp"] = timestamp_now

        in_memory_history.append({
            "incident_id": inc["incident_id"],
            "action_type": f"Status updated to {status}" if status else "Incident Updated",
            "status": inc["status"],
            "notes": notes or investigation_details or action_taken or resolution_details or "Incident updated",
            "performed_by": responsible_user,
            "timestamp": timestamp_now
        })
        return get_incident_by_id(inc["incident_id"]), None

    return None, "Incident not found"

def filter_in_memory_incidents(status_filter, severity_filter, attack_type_filter, search_term):
    results = list(in_memory_incidents)
    if status_filter and status_filter.lower() != "all":
        results = [i for i in results if i["status"].lower() == status_filter.lower()]
    if severity_filter and severity_filter.lower() != "all":
        results = [i for i in results if i["threat_severity"].lower() == severity_filter.lower()]
    if attack_type_filter and attack_type_filter.lower() != "all":
        results = [i for i in results if i["attack_type"].lower() == attack_type_filter.lower()]
    if search_term:
        st = search_term.lower()
        results = [i for i in results if st in i["incident_id"].lower() or st in i["attack_type"].lower() or st in i["source_ip"].lower() or st in i["status"].lower()]
    return results
