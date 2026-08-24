import datetime
import logging
from typing import Any, Dict, List, Optional, Union

from bson import ObjectId
from fastapi import HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.database import db_connection
from app.models.incident import IncidentDocument, IncidentNote, IncidentPriority, IncidentStatus, generate_incident_id
from app.services.alert_service import get_alert_by_id
from app.services.audit_logger import log_audit_event

logger = logging.getLogger("netshield.backend.incidents")


def normalize_priority(priority_input: Optional[str]) -> str:
    """Normalize priority string to standard capitalized format: Critical, High, Medium, Low."""
    if not priority_input:
        return IncidentPriority.HIGH.value
    p_lower = str(priority_input).strip().lower()
    if p_lower == "critical":
        return IncidentPriority.CRITICAL.value
    elif p_lower == "high":
        return IncidentPriority.HIGH.value
    elif p_lower == "medium":
        return IncidentPriority.MEDIUM.value
    elif p_lower == "low":
        return IncidentPriority.LOW.value
    else:
        return p_lower.capitalize()


def normalize_status(status_input: Optional[str]) -> str:
    """Normalize status string to standard format: New, In Progress, Under Investigation, Resolved, Closed."""
    if not status_input:
        return IncidentStatus.NEW.value
    s_lower = str(status_input).strip().lower()
    if s_lower == "new":
        return IncidentStatus.NEW.value
    elif s_lower in ("in progress", "in_progress", "inprogress"):
        return IncidentStatus.IN_PROGRESS.value
    elif s_lower in ("under investigation", "under_investigation", "investigating"):
        return IncidentStatus.UNDER_INVESTIGATION.value
    elif s_lower in ("resolved", "resolve"):
        return IncidentStatus.RESOLVED.value
    elif s_lower in ("closed", "close"):
        return IncidentStatus.CLOSED.value
    else:
        return s_lower.capitalize()


def format_incident_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document format to clean API dictionary."""
    if not doc:
        return doc
    formatted = dict(doc)
    if "_id" in formatted:
        formatted["id"] = str(formatted.pop("_id"))
    return formatted


async def create_incident(
    incident_data: Union[Dict[str, Any], Any],
    db: Optional[AsyncIOMotorDatabase] = None,
    request: Optional[Request] = None,
    user: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a new incident document in MongoDB and log an audit event.
    """
    if hasattr(incident_data, "model_dump"):
        data = incident_data.model_dump(exclude_none=False)
    else:
        data = dict(incident_data)

    target_db = db if db is not None else db_connection.database

    incident_id = data.get("incident_id") or generate_incident_id()
    alert_id = data.get("alert_id")
    title = data.get("title") or (f"Incident for Alert {alert_id}" if alert_id else "Security Threat Incident")
    assigned_analyst = data.get("assigned_analyst") or (user.get("email") if user else "Unassigned")
    priority = normalize_priority(data.get("priority"))
    status_val = normalize_status(data.get("status"))
    created_at = data.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat()
    resolved_at = data.get("resolved_at")

    notes_raw = data.get("notes") or []
    notes = []
    for n in notes_raw:
        if isinstance(n, dict):
            notes.append(n)
        elif hasattr(n, "model_dump"):
            notes.append(n.model_dump(mode="json"))

    initial_note = data.get("initial_note")
    if initial_note and not notes:
        author = user.get("email") if user else "Security Analyst"
        notes.append({
            "author": author,
            "text": initial_note,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

    incident_doc = {
        "incident_id": incident_id,
        "alert_id": alert_id,
        "title": title,
        "assigned_analyst": assigned_analyst,
        "priority": priority,
        "status": status_val,
        "notes": notes,
        "created_at": created_at,
        "resolved_at": resolved_at,
    }

    if target_db is not None:
        try:
            result = await target_db["incidents"].insert_one(incident_doc)
            incident_doc["id"] = str(result.inserted_id)
        except Exception as e:
            logger.error(f"Failed to insert incident into MongoDB: {e}")

    await log_audit_event(
        request,
        user,
        action=f"Incident Created: {title} (ID: {incident_id})",
        module="Incidents",
        status="Success"
    )

    return incident_doc


async def create_incident_from_alert(
    alert_id: str,
    db: AsyncIOMotorDatabase,
    assigned_analyst: Optional[str] = None,
    priority: Optional[str] = None,
    initial_note: Optional[str] = None,
    request: Optional[Request] = None,
    user: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Promote an existing alert into a full Incident record.
    """
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found"
        )

    attack_type = alert.get("attack_type", "Threat")
    src_ip = alert.get("source_ip", "Unknown")
    dst_ip = alert.get("destination_ip", "Unknown")
    title = f"{attack_type} Threat Incident ({src_ip} -> {dst_ip})"

    alert_severity = alert.get("severity", "High")
    calc_priority = priority or normalize_priority(alert_severity)

    analyst = assigned_analyst or alert.get("assigned_to") or (user.get("email") if user else "Unassigned")
    note_text = initial_note or f"Promoted from alert '{alert_id}' ({attack_type}, Confidence: {alert.get('confidence')})"

    incident_payload = {
        "alert_id": alert_id,
        "title": title,
        "assigned_analyst": analyst,
        "priority": calc_priority,
        "status": IncidentStatus.IN_PROGRESS.value,
        "initial_note": note_text
    }

    created_inc = await create_incident(
        incident_data=incident_payload,
        db=db,
        request=request,
        user=user
    )

    # Update alert status to Acknowledged
    try:
        await db["alerts"].update_one(
            {"alert_id": alert["alert_id"]},
            {"$set": {"status": "Acknowledged", "assigned_to": analyst}}
        )
    except Exception as e:
        logger.warning(f"Could not update status for alert '{alert_id}': {e}")

    return created_inc


async def get_incidents(
    db: AsyncIOMotorDatabase,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    assigned_analyst_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
) -> List[Dict[str, Any]]:
    """Retrieve filtered incidents list sorted by created_at descending."""
    query: Dict[str, Any] = {}

    if status_filter:
        query["status"] = normalize_status(status_filter)
    if priority_filter:
        query["priority"] = normalize_priority(priority_filter)
    if assigned_analyst_filter:
        query["assigned_analyst"] = {"$regex": assigned_analyst_filter, "$options": "i"}

    cursor = db["incidents"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    incidents = []
    async for doc in cursor:
        incidents.append(format_incident_doc(doc))
    return incidents


async def get_incident_by_id(db: AsyncIOMotorDatabase, incident_identifier: str) -> Optional[Dict[str, Any]]:
    """Find incident by incident_id or MongoDB _id."""
    doc = await db["incidents"].find_one({"incident_id": incident_identifier})
    if doc:
        return format_incident_doc(doc)

    try:
        obj_id = ObjectId(incident_identifier)
        doc = await db["incidents"].find_one({"_id": obj_id})
        if doc:
            return format_incident_doc(doc)
    except Exception:
        pass

    return None


async def update_incident(
    db: AsyncIOMotorDatabase,
    incident_identifier: str,
    update_data: Union[Dict[str, Any], Any],
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Dict[str, Any]:
    """Update incident priority, status, or assigned_analyst."""
    existing = await get_incident_by_id(db, incident_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_identifier}' not found"
        )

    if hasattr(update_data, "model_dump"):
        data = update_data.model_dump(exclude_unset=True, exclude_none=True)
    else:
        data = {k: v for k, v in dict(update_data).items() if v is not None}

    fields_to_set: Dict[str, Any] = {}

    if "assigned_analyst" in data:
        fields_to_set["assigned_analyst"] = data["assigned_analyst"]
    if "priority" in data:
        fields_to_set["priority"] = normalize_priority(data["priority"])
    if "status" in data:
        new_status = normalize_status(data["status"])
        fields_to_set["status"] = new_status
        if new_status in (IncidentStatus.RESOLVED.value, IncidentStatus.CLOSED.value):
            fields_to_set["resolved_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if not fields_to_set:
        return existing

    search_query = {"incident_id": existing["incident_id"]}
    updated_doc = await db["incidents"].find_one_and_update(
        search_query,
        {"$set": fields_to_set},
        return_document=True
    )

    formatted = format_incident_doc(updated_doc)

    await log_audit_event(
        request,
        user,
        action=f"Incident Updated (ID: {existing['incident_id']})",
        module="Incidents",
        status="Success"
    )

    return formatted


async def add_incident_note(
    db: AsyncIOMotorDatabase,
    incident_identifier: str,
    text: str,
    author: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Dict[str, Any]:
    """Append an investigation note to an incident."""
    existing = await get_incident_by_id(db, incident_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_identifier}' not found"
        )

    note_author = author or (user.get("email") if user else "Security Analyst")
    note_obj = {
        "author": note_author,
        "text": text,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    search_query = {"incident_id": existing["incident_id"]}
    updated_doc = await db["incidents"].find_one_and_update(
        search_query,
        {"$push": {"notes": note_obj}},
        return_document=True
    )

    formatted = format_incident_doc(updated_doc)

    await log_audit_event(
        request,
        user,
        action=f"Incident Note Added (ID: {existing['incident_id']})",
        module="Incidents",
        status="Success"
    )

    return formatted


async def delete_incident(
    db: AsyncIOMotorDatabase,
    incident_identifier: str,
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> Dict[str, Any]:
    """Delete an incident document from MongoDB."""
    existing = await get_incident_by_id(db, incident_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_identifier}' not found"
        )

    search_query = {"incident_id": existing["incident_id"]}
    await db["incidents"].delete_one(search_query)

    await log_audit_event(
        request,
        user,
        action=f"Incident Deleted (ID: {existing['incident_id']})",
        module="Incidents",
        status="Success"
    )

    return {"message": "Incident deleted successfully", "incident_id": existing["incident_id"]}
