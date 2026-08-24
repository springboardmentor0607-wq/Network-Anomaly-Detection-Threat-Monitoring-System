import asyncio
import datetime
import logging
from typing import Any, Dict, List, Optional, Union

from bson import ObjectId
from fastapi import HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.database import db_connection
from app.models.alert import AlertDocument, AlertSeverity, AlertStatus, generate_alert_id
from app.services.audit_logger import log_audit_event
from app.services.risk_scoring import RiskScoringService
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("netshield.backend.alerts")


def normalize_severity(severity_input: Optional[str], attack_type: str = "", confidence: float = 0.5) -> str:
    """Normalize severity string to standard capitalized format: Critical, High, Medium, Low, Safe."""
    if not severity_input:
        risk_data = RiskScoringService.calculate_risk(attack_type, confidence)
        return risk_data["severity"]

    s_lower = str(severity_input).strip().lower()
    if s_lower == "critical":
        return AlertSeverity.CRITICAL.value
    elif s_lower == "high":
        return AlertSeverity.HIGH.value
    elif s_lower == "medium":
        return AlertSeverity.MEDIUM.value
    elif s_lower == "low":
        return AlertSeverity.LOW.value
    elif s_lower in ("safe", "benign", "normal"):
        return AlertSeverity.SAFE.value
    else:
        return s_lower.capitalize()


def normalize_status(status_input: Optional[str]) -> str:
    """Normalize status string to standard format: Open, Acknowledged, Resolved."""
    if not status_input:
        return AlertStatus.OPEN.value
    st_lower = str(status_input).strip().lower()
    if st_lower == "open":
        return AlertStatus.OPEN.value
    elif st_lower in ("acknowledged", "ack"):
        return AlertStatus.ACKNOWLEDGED.value
    elif st_lower in ("resolved", "resolve", "closed"):
        return AlertStatus.RESOLVED.value
    else:
        return st_lower.capitalize()


def format_alert_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document format to clean API dictionary matching AlertResponse schema."""
    if not doc:
        return {}
    formatted = dict(doc)
    doc_id = str(formatted.pop("_id")) if "_id" in formatted else None
    
    alert_id = str(formatted.get("alert_id") or doc_id or generate_alert_id())
    timestamp = str(formatted.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat())
    source_ip = str(formatted.get("source_ip") or "192.168.1.100")
    destination_ip = str(formatted.get("destination_ip") or "10.0.0.1")
    attack_type = str(formatted.get("attack_type") or formatted.get("traffic_label") or "Attack")
    
    raw_conf = formatted.get("confidence")
    try:
        conf_val = float(raw_conf) if raw_conf is not None else 0.85
        if conf_val > 1.0:
            conf_val = conf_val / 100.0
        confidence = max(0.0, min(1.0, conf_val))
    except Exception:
        confidence = 0.85

    raw_risk = formatted.get("risk_score")
    try:
        risk_score = int(round(float(raw_risk))) if raw_risk is not None else 50
    except Exception:
        risk_score = 50

    severity = normalize_severity(formatted.get("severity") or formatted.get("threat_level"), attack_type, confidence)
    status_val = normalize_status(formatted.get("status"))

    return {
        "id": doc_id,
        "alert_id": alert_id,
        "timestamp": timestamp,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "attack_type": attack_type,
        "confidence": confidence,
        "risk_score": risk_score,
        "severity": severity,
        "status": status_val,
        "assigned_to": formatted.get("assigned_to"),
        "source": formatted.get("source") or "Live Network",
    }


async def create_alert(
    alert_data: Union[Dict[str, Any], Any],
    db: Optional[AsyncIOMotorDatabase] = None,
    request: Optional[Request] = None,
    user: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a new alert in MongoDB and log an audit event.
    """
    if hasattr(alert_data, "model_dump"):
        data = alert_data.model_dump(exclude_none=False)
    else:
        data = dict(alert_data)

    target_db = db if db is not None else db_connection.database

    alert_id = data.get("alert_id") or generate_alert_id()
    timestamp = data.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat()
    source_ip = data.get("source_ip") or "192.168.1.100"
    destination_ip = data.get("destination_ip") or "10.0.0.1"
    attack_type = data.get("attack_type") or "Unknown Attack"
    confidence = float(data.get("confidence", 0.85))

    # Calculate risk score & severity if missing
    raw_risk = data.get("risk_score")
    raw_severity = data.get("severity")

    if raw_risk is None or raw_severity is None:
        risk_calc = RiskScoringService.calculate_risk(attack_type, confidence)
        risk_score = int(round(risk_calc["risk_score"])) if raw_risk is None else int(round(raw_risk))
        severity = normalize_severity(raw_severity, attack_type, confidence)
    else:
        risk_score = int(round(raw_risk))
        severity = normalize_severity(raw_severity, attack_type, confidence)

    status_val = normalize_status(data.get("status"))
    assigned_to = data.get("assigned_to")

    alert_doc = {
        "alert_id": alert_id,
        "timestamp": timestamp,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "attack_type": attack_type,
        "confidence": confidence,
        "risk_score": risk_score,
        "severity": severity,
        "status": status_val,
        "assigned_to": assigned_to,
        "source": data.get("source") or "Live Network",
    }

    if target_db is not None:
        try:
            result = await target_db["alerts"].insert_one(alert_doc)
            alert_doc["id"] = str(result.inserted_id)
        except Exception as e:
            logger.error(f"Failed to insert alert into MongoDB: {e}")

    # Audit logging
    await log_audit_event(
        request,
        user,
        action=f"Alert Created: {attack_type} (ID: {alert_id})",
        module="Alerts",
        status="Success"
    )

    # Real-time WebSocket broadcasting
    try:
        broadcast_doc = dict(alert_doc)
        broadcast_doc.pop("_id", None)
        await ws_manager.broadcast({
            "type": "NEW_ALERT",
            "data": broadcast_doc
        })
    except Exception as exc:
        logger.warning(f"Failed to broadcast WebSocket alert: {exc}")

    return alert_doc


def create_alert_from_prediction(
    prediction_result: Dict[str, Any],
    packet_data: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Automatically generate an alert when the AI prediction pipeline detects an attack.
    Safely triggers async database insertion and audit logging.
    """
    if not prediction_result:
        return None

    attack_type = prediction_result.get("attack_type") or prediction_result.get("prediction", "Unknown")
    
    # Do not generate alerts for benign/normal traffic
    if str(attack_type).strip().lower() in ("benign", "normal", "safe"):
        return None

    confidence = float(prediction_result.get("confidence", prediction_result.get("confidence_score", 0.85)))
    risk_score = prediction_result.get("risk_score", 50)
    severity = prediction_result.get("severity", "Medium")

    p_data = packet_data or {}
    source_ip = (
        p_data.get("source_ip") or
        p_data.get("srcip") or
        p_data.get("src_ip") or
        "192.168.1.100"
    )
    destination_ip = (
        p_data.get("destination_ip") or
        p_data.get("dstip") or
        p_data.get("dst_ip") or
        "10.0.0.1"
    )

    alert_payload = {
        "alert_id": generate_alert_id(),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "attack_type": attack_type,
        "confidence": confidence,
        "risk_score": risk_score,
        "severity": severity,
        "status": "Open",
        "assigned_to": None,
    }

    # Trigger async MongoDB insertion & audit log & WebSocket broadcast
    try:
        ws_manager.broadcast_sync({
            "type": "NEW_ALERT",
            "data": alert_payload
        })
        if db_connection.database is not None:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(create_alert(alert_payload))
    except Exception as exc:
        logger.warning(f"Note: Could not schedule async alert creation: {exc}")

    return alert_payload


async def get_alerts(
    db: AsyncIOMotorDatabase,
    status_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    attack_type_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
) -> List[Dict[str, Any]]:
    """Retrieve filtered alerts list sorted by timestamp descending."""
    if db is None:
        return []

    query: Dict[str, Any] = {}

    if status_filter:
        query["status"] = normalize_status(status_filter)
    if severity_filter:
        query["severity"] = normalize_severity(severity_filter)
    if attack_type_filter:
        query["attack_type"] = {"$regex": attack_type_filter, "$options": "i"}

    alerts = []
    try:
        cursor = db["alerts"].find(query).sort("timestamp", -1).skip(skip).limit(limit)
        async for doc in cursor:
            alerts.append(format_alert_doc(doc))
    except Exception as exc:
        logger.warning(f"Error querying MongoDB alerts collection: {exc}")

    return alerts



async def get_alert_by_id(db: AsyncIOMotorDatabase, alert_identifier: str) -> Optional[Dict[str, Any]]:
    """Find alert by alert_id or MongoDB _id."""
    # First search by alert_id
    doc = await db["alerts"].find_one({"alert_id": alert_identifier})
    if doc:
        return format_alert_doc(doc)

    # Fallback to search by MongoDB ObjectId
    try:
        obj_id = ObjectId(alert_identifier)
        doc = await db["alerts"].find_one({"_id": obj_id})
        if doc:
            return format_alert_doc(doc)
    except Exception:
        pass

    return None


async def acknowledge_alert(
    db: AsyncIOMotorDatabase,
    alert_identifier: str,
    assigned_to: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Dict[str, Any]:
    """Acknowledge an alert and update status to 'Acknowledged'."""
    existing = await get_alert_by_id(db, alert_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_identifier}' not found"
        )

    assignee = assigned_to
    if not assignee and user:
        assignee = user.get("email") or user.get("full_name")

    update_fields: Dict[str, Any] = {"status": AlertStatus.ACKNOWLEDGED.value}
    if assignee:
        update_fields["assigned_to"] = assignee

    search_query = {"alert_id": existing["alert_id"]}
    updated_doc = await db["alerts"].find_one_and_update(
        search_query,
        {"$set": update_fields},
        return_document=True
    )

    formatted = format_alert_doc(updated_doc)

    await log_audit_event(
        request,
        user,
        action=f"Alert Acknowledged (ID: {existing['alert_id']})",
        module="Alerts",
        status="Success"
    )

    return formatted


async def resolve_alert(
    db: AsyncIOMotorDatabase,
    alert_identifier: str,
    assigned_to: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Dict[str, Any]:
    """Resolve an alert and update status to 'Resolved'."""
    existing = await get_alert_by_id(db, alert_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_identifier}' not found"
        )

    assignee = assigned_to or existing.get("assigned_to")
    if not assignee and user:
        assignee = user.get("email") or user.get("full_name")

    update_fields: Dict[str, Any] = {"status": AlertStatus.RESOLVED.value}
    if assignee:
        update_fields["assigned_to"] = assignee

    search_query = {"alert_id": existing["alert_id"]}
    updated_doc = await db["alerts"].find_one_and_update(
        search_query,
        {"$set": update_fields},
        return_document=True
    )

    formatted = format_alert_doc(updated_doc)

    await log_audit_event(
        request,
        user,
        action=f"Alert Resolved (ID: {existing['alert_id']})",
        module="Alerts",
        status="Success"
    )

    return formatted


async def delete_alert(
    db: AsyncIOMotorDatabase,
    alert_identifier: str,
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Dict[str, Any]:
    """Delete an alert by alert_id or MongoDB _id."""
    existing = await get_alert_by_id(db, alert_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_identifier}' not found"
        )

    search_query = {"alert_id": existing["alert_id"]}
    await db["alerts"].delete_one(search_query)

    await log_audit_event(
        request,
        user,
        action=f"Alert Deleted (ID: {existing['alert_id']})",
        module="Alerts",
        status="Success"
    )

    return {"message": "Alert deleted successfully", "alert_id": existing["alert_id"]}
