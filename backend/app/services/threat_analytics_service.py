import datetime
import logging
import time
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.database import db_connection
from app.services.threat_insights import get_prediction_history
import ipaddress

def get_ip_location(ip_str: str) -> str:
    if not ip_str or ip_str == "Unknown":
        return "Location unavailable"
    try:
        ip = ipaddress.ip_address(ip_str.strip())
        if ip.is_private or ip.is_loopback:
            return "Internal Network"
    except Exception:
        pass
    return "Location unavailable"

def get_hour_from_timestamp(ts_val) -> int:
    if not ts_val:
        return 0
    if isinstance(ts_val, datetime.datetime):
        return ts_val.hour
    try:
        # Try parsing ISO string or standard time formats
        if "T" in ts_val:
            time_part = ts_val.split("T")[1]
            hour_str = time_part.split(":")[0]
            return int(hour_str)
        if " " in ts_val:
            time_part = ts_val.split(" ")[1]
            hour_str = time_part.split(":")[0]
            return int(hour_str)
    except Exception:
        pass
    return 0

def get_week_start_date(ts_val) -> str:
    """Return the date of the Monday of the week for a given timestamp."""
    if not ts_val:
        return "Unknown"
    dt = None
    if isinstance(ts_val, datetime.datetime):
        dt = ts_val
    else:
        try:
            ts_str = str(ts_val).strip()
            if ts_str.endswith("Z"):
                ts_str = ts_str[:-1]
            if "T" in ts_str:
                dt_part = ts_str.split("T")[0]
            elif " " in ts_str:
                dt_part = ts_str.split(" ")[0]
            else:
                dt_part = ts_str
            
            parts = dt_part.split("-")
            if len(parts) == 3:
                dt = datetime.datetime(int(parts[0]), int(parts[1]), int(parts[2]))
        except Exception:
            pass
            
    if dt:
        monday = dt - datetime.timedelta(days=dt.weekday())
        return monday.strftime("%Y-%m-%d")
    return "Unknown"

def get_time_slot(hour: int) -> str:
    if hour < 4:
        return "00:00"
    elif hour < 8:
        return "04:00"
    elif hour < 12:
        return "08:00"
    elif hour < 16:
        return "12:00"
    elif hour < 20:
        return "16:00"
    else:
        return "20:00"

logger = logging.getLogger("netshield.backend.threat_analytics")

_ANALYTICS_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 15


async def compute_threat_intelligence_analytics(
    db: Optional[AsyncIOMotorDatabase] = None,
    severity_filter: Optional[str] = None,
    attack_type_filter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compute Threat Intelligence Analytics metrics from MongoDB collections
    (alerts, incidents, predictions) with in-memory TTL caching for instant response times.
    """
    cache_key = f"{severity_filter}_{attack_type_filter}_{start_date}_{end_date}"
    now_time = time.time()

    if cache_key in _ANALYTICS_CACHE:
        cached_entry = _ANALYTICS_CACHE[cache_key]
        if now_time - cached_entry["timestamp"] < _CACHE_TTL_SECONDS:
            return cached_entry["data"]

    target_db = db if db is not None else db_connection.database

    alerts_list: List[Dict[str, Any]] = []
    incidents_list: List[Dict[str, Any]] = []

    # Build filter query for MongoDB alerts
    mongo_query: Dict[str, Any] = {}
    if severity_filter and severity_filter.lower() != "all":
        mongo_query["severity"] = {"$regex": f"^{severity_filter}$", "$options": "i"}
    if attack_type_filter and attack_type_filter.lower() != "all":
        mongo_query["attack_type"] = {"$regex": attack_type_filter, "$options": "i"}
    
    date_query: Dict[str, Any] = {}
    if start_date:
        date_query["$gte"] = start_date
    if end_date:
        date_query["$lte"] = end_date
    if date_query:
        mongo_query["timestamp"] = date_query

    if target_db is not None:
        try:
            alerts_cursor = target_db["alerts"].find(mongo_query).sort("timestamp", -1).limit(1000)
            async for doc in alerts_cursor:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                alerts_list.append(doc)

            incidents_cursor = target_db["incidents"].find({}).sort("created_at", -1).limit(500)
            async for doc in incidents_cursor:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                incidents_list.append(doc)
        except Exception as e:
            logger.warning(f"Error querying MongoDB for threat analytics: {e}")

    # Build incident lookup map alert_id -> incident status/ID
    incident_lookup = {}
    for inc in incidents_list:
        aid = inc.get("alert_id")
        if aid:
            incident_lookup[aid] = {
                "incident_id": inc.get("incident_id"),
                "status": inc.get("status", "New"),
                "assigned_analyst": inc.get("assigned_analyst", "Unassigned")
            }

    # Process prediction history fallback
    history = get_prediction_history(limit=500)
    
    # Apply filtering to prediction history if needed
    filtered_history = []
    for p in history:
        if severity_filter and severity_filter.lower() != "all":
            if str(p.get("severity")).lower() != severity_filter.lower():
                continue
        if attack_type_filter and attack_type_filter.lower() != "all":
            if attack_type_filter.lower() not in str(p.get("attack_type")).lower():
                continue
        filtered_history.append(p)

    # ── 1. Attack Distribution & Most Common Attacks ───────────────────────
    attack_counts: Dict[str, int] = {}
    risk_scores_by_type: Dict[str, List[int]] = {}
    all_risk_scores: List[int] = []
    ip_activity: Dict[str, Dict[str, Any]] = {}
    protocol_counts: Dict[str, int] = {"TCP": 0, "UDP": 0, "ICMP": 0, "HTTP": 0, "OTHER": 0}

    # Process alerts from DB
    for a in alerts_list:
        atk = str(a.get("attack_type") or "Unknown").strip()
        if atk.lower() in ("benign", "normal", "safe"):
            continue

        attack_counts[atk] = attack_counts.get(atk, 0) + 1
        
        # Risk scores
        rs = a.get("risk_score")
        if rs is not None:
            try:
                rs_val = int(rs)
                all_risk_scores.append(rs_val)
                risk_scores_by_type.setdefault(atk, []).append(rs_val)
            except Exception:
                pass

        # Top attacker IPs
        src_ip = str(a.get("source_ip") or "192.168.1.100").strip()
        if src_ip and src_ip != "Unknown":
            if src_ip not in ip_activity:
                ip_activity[src_ip] = {
                    "ip": src_ip,
                    "count": 0,
                    "max_severity": a.get("severity", "Low"),
                    "attack_types": set(),
                    "bytes": 0
                }
            ip_activity[src_ip]["count"] += 1
            ip_activity[src_ip]["attack_types"].add(atk)
            
            # Update max severity
            sev_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Safe": 0}
            curr_sev = ip_activity[src_ip]["max_severity"]
            if sev_order.get(a.get("severity"), 0) > sev_order.get(curr_sev, 0):
                ip_activity[src_ip]["max_severity"] = a.get("severity")

        # Protocols
        proto = str(a.get("protocol") or "TCP").strip().upper()
        if proto in protocol_counts:
            protocol_counts[proto] += 1
        elif "HTTP" in proto:
            protocol_counts["HTTP"] += 1
        elif "UDP" in proto:
            protocol_counts["UDP"] += 1
        elif "ICMP" in proto:
            protocol_counts["ICMP"] += 1
        else:
            protocol_counts["OTHER"] += 1

    # Merge prediction history
    for p in filtered_history:
        atk = str(p.get("attack_type") or "Unknown").strip()
        if atk.lower() in ("benign", "normal", "safe"):
            continue
        if atk not in attack_counts:
            attack_counts[atk] = 1
        else:
            attack_counts[atk] += 1

        rs = p.get("risk_score")
        if rs is not None:
            try:
                rs_val = int(rs)
                all_risk_scores.append(rs_val)
                risk_scores_by_type.setdefault(atk, []).append(rs_val)
            except Exception:
                pass

        src_ip = p.get("source_ip", p.get("src_ip", "Unknown")).strip()
        if src_ip != "Unknown" and src_ip:
            if src_ip not in ip_activity:
                ip_activity[src_ip] = {
                    "ip": src_ip,
                    "count": 1,
                    "max_severity": p.get("severity", "High"),
                    "attack_types": {atk},
                    "bytes": 0
                }
            else:
                ip_activity[src_ip]["count"] += 1
                ip_activity[src_ip]["attack_types"].add(atk)

    total_threats_count = sum(attack_counts.values())
    total_denom = max(total_threats_count, 1)

    attack_distribution = [
        {
            "attack_type": atk,
            "count": cnt,
            "percentage": round((cnt / total_denom) * 100.0, 1)
        }
        for atk, cnt in sorted(attack_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    most_common_attacks = [
        {
            "attack_type": atk,
            "count": cnt,
            "avg_risk": round(
                sum(risk_scores_by_type.get(atk, [0])) / max(len(risk_scores_by_type.get(atk, [1])), 1), 1
            )
        }
        for atk, cnt in sorted(attack_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    # ── 2. Top Attacker IPs ──────────────────────────────────────────────────
    top_attacker_ips = [
        {
            "ip": data["ip"],
            "count": data["count"],
            "max_severity": data["max_severity"],
            "attack_types": list(data["attack_types"]),
            "bytes": data.get("bytes", 0),
            "location": get_ip_location(data["ip"])
        }
        for data in sorted(ip_activity.values(), key=lambda x: x["count"], reverse=True)[:10]
    ]

    # ── 3. Protocol Distribution ─────────────────────────────────────────────
    protocol_distribution = [
        {"name": name, "count": cnt} for name, cnt in protocol_counts.items()
    ]

    # ── 4. Risk Score Distribution (Binned) ─────────────────────────────────
    bins = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for score in all_risk_scores:
        if score <= 20:
            bins["0-20"] += 1
        elif score <= 40:
            bins["21-40"] += 1
        elif score <= 60:
            bins["41-60"] += 1
        elif score <= 80:
            bins["61-80"] += 1
        else:
            bins["81-100"] += 1

    risk_score_distribution = [
        {"range": r, "count": cnt} for r, cnt in bins.items()
    ]

    # ── 5. Risk Heatmap Matrix ───────────────────────────────────────────────
    categories = ["DDoS", "DoS", "PortScan", "Malware", "Infiltration"]
    time_slots = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
    risk_scores_by_cat_slot: Dict[str, Dict[str, List[int]]] = {
        cat: {slot: [] for slot in time_slots} for cat in categories
    }

    # ── 6. Threat Trend & Network Traffic Flow ──────────────────────────────
    trend_dict: Dict[str, int] = {}
    traffic_flow = []

    now = datetime.datetime.now(datetime.timezone.utc)
    for i in range(7, -1, -1):
        slot_time = (now - datetime.timedelta(hours=i*2)).strftime("%H:00")
        trend_dict[slot_time] = 0

    # Count real events in trend time slots & compute risk heatmap
    for a in alerts_list:
        atk = str(a.get("attack_type") or "Unknown").strip()
        # Find category match
        cat_match = None
        for cat in categories:
            if cat.lower() in atk.lower():
                cat_match = cat
                break
        
        rs = a.get("risk_score")
        if rs is not None:
            try:
                rs_val = int(rs)
                ts_val = a.get("timestamp")
                hour = get_hour_from_timestamp(ts_val)
                slot = get_time_slot(hour)
                if cat_match:
                    risk_scores_by_cat_slot[cat_match][slot].append(rs_val)
            except Exception:
                pass

        ts_str = str(a.get("timestamp", ""))
        for time_key in trend_dict:
            if time_key in ts_str:
                trend_dict[time_key] += 1

    for p in filtered_history:
        atk = str(p.get("attack_type") or "Unknown").strip()
        cat_match = None
        for cat in categories:
            if cat.lower() in atk.lower():
                cat_match = cat
                break
        
        rs = p.get("risk_score")
        if rs is not None:
            try:
                rs_val = int(rs)
                ts_val = p.get("timestamp")
                hour = get_hour_from_timestamp(ts_val)
                slot = get_time_slot(hour)
                if cat_match:
                    risk_scores_by_cat_slot[cat_match][slot].append(rs_val)
            except Exception:
                pass

    risk_heatmap = []
    for cat in categories:
        row_values = []
        for slot in time_slots:
                threat_trend = [
        {"time": time_key, "count": cnt}
        for time_key, cnt in trend_dict.items()
    ]

    # ── 6.5 Weekly Threat Trend Analysis ─────────────────────────────────
    weekly_trend_dict: Dict[str, int] = {}
    for a in alerts_list:
        atk = str(a.get("attack_type") or "Unknown").strip()
        if atk.lower() in ("benign", "normal", "safe"):
            continue
        week_start = get_week_start_date(a.get("timestamp"))
        if week_start != "Unknown":
            weekly_trend_dict[week_start] = weekly_trend_dict.get(week_start, 0) + 1

    for p in filtered_history:
        atk = str(p.get("attack_type") or "Unknown").strip()
        if atk.lower() in ("benign", "normal", "safe"):
            continue
        week_start = get_week_start_date(p.get("timestamp"))
        if week_start != "Unknown":
            weekly_trend_dict[week_start] = weekly_trend_dict.get(week_start, 0) + 1

    # Sort the weeks chronologically
    weekly_threat_trend = []
    for week_start in sorted(weekly_trend_dict.keys()):
        weekly_threat_trend.append({
            "week": week_start,
            "label": f"Wk starting {week_start}",
            "count": weekly_trend_dict[week_start]
        })
        
    # If no data exists, populate with the current week starting date
    if not weekly_threat_trend:
        current_week = get_week_start_date(datetime.datetime.now(datetime.timezone.utc))
        weekly_threat_trend.append({
            "week": current_week,
            "label": f"Wk starting {current_week}",
            "count": 0
        })

    # ── 7. Detection Timeline ───────────────────────────────────────────────
    detection_timeline = []
    for a in alerts_list[:25]:
        aid = a.get("alert_id")
        inc_info = incident_lookup.get(aid)
        inc_status = inc_info["status"] if inc_info else "Not Promoted"
        inc_id = inc_info["incident_id"] if inc_info else None

        detection_timeline.append({
            "alert_id": a.get("alert_id", "ALT-UNKNOWN"),
            "timestamp": a.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat()),
            "attack_type": a.get("attack_type", "Unknown"),
            "severity": a.get("severity", "Medium"),
            "confidence": a.get("confidence", 0.85),
            "risk_score": a.get("risk_score", 50),
            "source_ip": a.get("source_ip", "192.168.1.100"),
            "destination_ip": a.get("destination_ip", "10.0.0.1"),
            "status": a.get("status", "Open"),
            "incident_status": inc_status,
            "incident_id": inc_id,
            "source_location": get_ip_location(a.get("source_ip")),
            "destination_location": get_ip_location(a.get("destination_ip"))
        })

    # ── 8. Summary KPIs ───────────────────────────────────────────────────────
    critical_high_count = sum(
        1 for a in alerts_list if str(a.get("severity")).lower() in ("critical", "high")
    )
    if critical_high_count == 0 and filtered_history:
        critical_high_count = sum(1 for p in filtered_history if str(p.get("severity")).lower() in ("critical", "high"))

    avg_risk = round(sum(all_risk_scores) / len(all_risk_scores), 1) if all_risk_scores else 0.0
    top_attack = most_common_attacks[0]["attack_type"] if most_common_attacks else "None"

    active_incidents = sum(
        1 for inc in incidents_list if inc.get("status") in ("New", "In Progress", "Under Investigation")
    )

    avg_risk = round(sum(all_risk_scores) / max(len(all_risk_scores), 1), 1) if all_risk_scores else 0.0
    top_attack = most_common_attacks[0]["attack_type"] if most_common_attacks else "None"

    active_incidents = sum(
        1 for inc in incidents_list if inc.get("status") in ("New", "In Progress", "Under Investigation")
    )

    kpis = {
        "total_threats": total_threats_count,
        "critical_high_count": critical_high_count,
        "avg_risk_score": avg_risk,
        "top_attack_vector": top_attack,
        "active_incidents": active_incidents,
        "total_alerts_stored": len(alerts_list),
        "total_attacker_ips": len(top_attacker_ips),
    }

    result_dict = {
        "kpis": kpis,
        "attack_distribution": attack_distribution,
        "threat_trend": threat_trend,
        "weekly_threat_trend": weekly_threat_trend,
        "risk_score_distribution": risk_score_distribution,
        "most_common_attacks": most_common_attacks,
        "top_attacker_ips": top_attacker_ips,
        "protocol_distribution": protocol_distribution,
        "risk_heatmap": risk_heatmap,
        "traffic_flow": traffic_flow,
        "detection_timeline": detection_timeline
    }

    _ANALYTICS_CACHE[cache_key] = {
        "timestamp": now_time,
        "data": result_dict
    }

    return result_dict
