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
    if "assigned_analyst_id" not in formatted:
        formatted["assigned_analyst_id"] = None
    if "assigned_analyst_name" not in formatted:
        formatted["assigned_analyst_name"] = None
    if "assigned_at" not in formatted:
        formatted["assigned_at"] = None
    if "assigned_analyst" not in formatted or not formatted["assigned_analyst"]:
        formatted["assigned_analyst"] = "Unassigned"
    return formatted


async def resolve_analyst_info(
    db: Optional[AsyncIOMotorDatabase],
    analyst_id: Optional[str] = None,
    analyst_name: Optional[str] = None,
    analyst_str: Optional[str] = None,
    fallback_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Resolve analyst information against the MongoDB users collection.
    Returns dict with assigned_analyst_id, assigned_analyst_name, assigned_analyst, and assigned_at.
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Check if explicitly unassigning or empty
    if analyst_str in ("Unassigned", "", None) and not analyst_id and not analyst_name:
        if fallback_user:
            fallback_role = str(fallback_user.get("role", "")).strip().lower().replace(" ", "_")
            if fallback_role == "security_analyst":
                return {
                    "assigned_analyst_id": str(fallback_user.get("id") or fallback_user.get("_id")),
                    "assigned_analyst_name": fallback_user.get("full_name") or fallback_user.get("email"),
                    "assigned_analyst": fallback_user.get("email") or fallback_user.get("full_name"),
                    "assigned_at": now_iso,
                }
        return {
            "assigned_analyst_id": None,
            "assigned_analyst_name": None,
            "assigned_analyst": "Unassigned",
            "assigned_at": None,
        }

    matched_user = None
    if db is not None:
        try:
            # 1. Try matching by analyst_id
            if analyst_id:
                if ObjectId.is_valid(analyst_id):
                    matched_user = await db["users"].find_one({"_id": ObjectId(analyst_id)})
                if not matched_user:
                    matched_user = await db["users"].find_one({"_id": analyst_id})

            # 2. Try matching by analyst_str or analyst_name
            target_str = analyst_str or analyst_name
            if not matched_user and target_str and target_str != "Unassigned":
                if ObjectId.is_valid(target_str):
                    matched_user = await db["users"].find_one({"_id": ObjectId(target_str)})
                if not matched_user:
                    matched_user = await db["users"].find_one({"email": target_str.strip().lower()})
                if not matched_user:
                    matched_user = await db["users"].find_one({"full_name": target_str.strip()})
        except Exception as e:
            logger.warning("Failed looking up analyst in users collection: %s", e)

    if matched_user:
        return {
            "assigned_analyst_id": str(matched_user["_id"]),
            "assigned_analyst_name": matched_user.get("full_name") or matched_user.get("email"),
            "assigned_analyst": matched_user.get("email") or matched_user.get("full_name"),
            "assigned_at": now_iso,
        }

    if analyst_id:
        return {
            "assigned_analyst_id": analyst_id,
            "assigned_analyst_name": analyst_name or analyst_str or "Assigned Analyst",
            "assigned_analyst": analyst_str or analyst_name or analyst_id,
            "assigned_at": now_iso,
        }

    display = analyst_str or analyst_name or "Unassigned"
    return {
        "assigned_analyst_id": None,
        "assigned_analyst_name": display if display != "Unassigned" else None,
        "assigned_analyst": display,
        "assigned_at": now_iso if display != "Unassigned" else None,
    }


def check_analyst_incident_access(incident: Dict[str, Any], user: Optional[Dict[str, Any]]) -> bool:
    """
    Returns True if user is an Administrator or the analyst assigned to this incident.
    """
    if not user:
        return False
    user_role = str(user.get("role", "")).strip().lower().replace(" ", "_")
    if user_role == "security_administrator":
        return True

    user_id = str(user.get("id") or user.get("_id") or "")
    assigned_id = str(incident.get("assigned_analyst_id") or "")
    if user_id and assigned_id and user_id == assigned_id:
        return True

    current_email = str(user.get("email") or "").strip().lower()
    current_name = str(user.get("full_name") or "").strip().lower()
    assigned_email = str(incident.get("assigned_analyst") or "").strip().lower()
    assigned_name = str(incident.get("assigned_analyst_name") or "").strip().lower()

    if current_email and (assigned_email == current_email or assigned_name == current_email):
        return True
    if current_name and (assigned_name == current_name or assigned_email == current_name):
        return True

    return False


async def create_incident(
    incident_data: Union[Dict[str, Any], Any],
    db: Optional[AsyncIOMotorDatabase] = None,
    request: Optional[Request] = None,
    user: Optional[Dict[str, Any]] = None,
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

    analyst_info = await resolve_analyst_info(
        db=target_db,
        analyst_id=data.get("assigned_analyst_id"),
        analyst_name=data.get("assigned_analyst_name"),
        analyst_str=data.get("assigned_analyst"),
        fallback_user=user,
    )

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
        author = user.get("full_name") or user.get("email") if user else "Security Analyst"
        notes.append({
            "author": author,
            "text": initial_note,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        })

    incident_doc = {
        "incident_id": incident_id,
        "alert_id": alert_id,
        "title": title,
        "assigned_analyst_id": analyst_info["assigned_analyst_id"],
        "assigned_analyst_name": analyst_info["assigned_analyst_name"],
        "assigned_analyst": analyst_info["assigned_analyst"],
        "assigned_at": analyst_info["assigned_at"],
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
        status="Success",
    )

    return incident_doc


async def create_incident_from_alert(
    alert_id: str,
    db: AsyncIOMotorDatabase,
    assigned_analyst: Optional[str] = None,
    assigned_analyst_id: Optional[str] = None,
    assigned_analyst_name: Optional[str] = None,
    priority: Optional[str] = None,
    initial_note: Optional[str] = None,
    request: Optional[Request] = None,
    user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Promote an existing alert into a full Incident record.
    """
    alert = await get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found",
        )

    attack_type = alert.get("attack_type", "Threat")
    src_ip = alert.get("source_ip", "Unknown")
    dst_ip = alert.get("destination_ip", "Unknown")
    title = f"{attack_type} Threat Incident ({src_ip} -> {dst_ip})"

    alert_severity = alert.get("severity", "High")
    calc_priority = priority or normalize_priority(alert_severity)

    analyst_info = await resolve_analyst_info(
        db=db,
        analyst_id=assigned_analyst_id,
        analyst_name=assigned_analyst_name,
        analyst_str=assigned_analyst or alert.get("assigned_to"),
        fallback_user=user,
    )

    note_text = initial_note or f"Promoted from alert '{alert_id}' ({attack_type}, Confidence: {alert.get('confidence')})"

    incident_payload = {
        "alert_id": alert_id,
        "title": title,
        "assigned_analyst_id": analyst_info["assigned_analyst_id"],
        "assigned_analyst_name": analyst_info["assigned_analyst_name"],
        "assigned_analyst": analyst_info["assigned_analyst"],
        "assigned_at": analyst_info["assigned_at"],
        "priority": calc_priority,
        "status": IncidentStatus.IN_PROGRESS.value,
        "initial_note": note_text,
    }

    created_inc = await create_incident(
        incident_data=incident_payload,
        db=db,
        request=request,
        user=user,
    )

    # Update alert status to Acknowledged
    try:
        await db["alerts"].update_one(
            {"alert_id": alert["alert_id"]},
            {"$set": {"status": "Acknowledged", "assigned_to": analyst_info["assigned_analyst"]}},
        )
    except Exception as e:
        logger.warning(f"Could not update status for alert '{alert_id}': {e}")

    return created_inc


async def get_incidents(
    db: AsyncIOMotorDatabase,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    assigned_analyst_filter: Optional[str] = None,
    assigned_analyst_id: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
    limit: int = 100,
    skip: int = 0,
) -> List[Dict[str, Any]]:
    """Retrieve filtered incidents list sorted by created_at descending."""
    query: Dict[str, Any] = {}
    and_conditions: List[Dict[str, Any]] = []

    user_role = str(user.get("role", "")).strip().lower().replace(" ", "_") if user else ""
    is_analyst = user_role == "security_analyst"

    filter_analyst_id = assigned_analyst_id
    if is_analyst and user:
        filter_analyst_id = str(user.get("id") or user.get("_id") or "")

    if filter_analyst_id:
        conditions = [
            {"assigned_analyst_id": filter_analyst_id},
            {"assigned_to": filter_analyst_id},
            {"analyst_id": filter_analyst_id},
            {"assigned_user_id": filter_analyst_id},
        ]
        if user and is_analyst:
            if user.get("email"):
                conditions.append({"assigned_analyst": user.get("email")})
                conditions.append({"assigned_to": user.get("email")})
            if user.get("full_name"):
                conditions.append({"assigned_analyst": user.get("full_name")})
                conditions.append({"assigned_analyst_name": user.get("full_name")})
                conditions.append({"assigned_to": user.get("full_name")})
        and_conditions.append({"$or": conditions})

    if status_filter:
        and_conditions.append({"status": normalize_status(status_filter)})
    if priority_filter:
        and_conditions.append({"priority": normalize_priority(priority_filter)})
    if assigned_analyst_filter and not filter_analyst_id:
        and_conditions.append({
            "$or": [
                {"assigned_analyst": {"$regex": assigned_analyst_filter, "$options": "i"}},
                {"assigned_analyst_name": {"$regex": assigned_analyst_filter, "$options": "i"}},
            ]
        })

    if and_conditions:
        if len(and_conditions) == 1:
            query = and_conditions[0]
        else:
            query = {"$and": and_conditions}

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
    request: Optional[Request] = None,
) -> Dict[str, Any]:
    """Update incident priority, status, or assigned_analyst."""
    existing = await get_incident_by_id(db, incident_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_identifier}' not found",
        )

    # RBAC: Check if user is allowed to access/update this incident
    if user and not check_analyst_incident_access(existing, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to modify this incident",
        )

    if hasattr(update_data, "model_dump"):
        data = update_data.model_dump(exclude_unset=True, exclude_none=True)
    else:
        data = {k: v for k, v in dict(update_data).items() if v is not None}

    user_role = str(user.get("role", "")).strip().lower().replace(" ", "_") if user else ""
    is_admin = user_role == "security_administrator"

    # Only administrators can reassign incidents
    is_reassigning = any(k in data for k in ("assigned_analyst", "assigned_analyst_id", "assigned_analyst_name"))
    if is_reassigning and user and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only administrators can assign or reassign incidents",
        )

    fields_to_set: Dict[str, Any] = {}

    if is_reassigning:
        resolved = await resolve_analyst_info(
            db=db,
            analyst_id=data.get("assigned_analyst_id"),
            analyst_name=data.get("assigned_analyst_name"),
            analyst_str=data.get("assigned_analyst"),
            fallback_user=None,
        )
        fields_to_set["assigned_analyst_id"] = resolved["assigned_analyst_id"]
        fields_to_set["assigned_analyst_name"] = resolved["assigned_analyst_name"]
        fields_to_set["assigned_analyst"] = resolved["assigned_analyst"]
        fields_to_set["assigned_at"] = resolved["assigned_at"]

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
        return_document=True,
    )

    formatted = format_incident_doc(updated_doc)

    await log_audit_event(
        request,
        user,
        action=f"Incident Updated (ID: {existing['incident_id']})",
        module="Incidents",
        status="Success",
    )

    return formatted


async def add_incident_note(
    db: AsyncIOMotorDatabase,
    incident_identifier: str,
    text: str,
    author: Optional[str] = None,
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> Dict[str, Any]:
    """Append an investigation note to an incident."""
    existing = await get_incident_by_id(db, incident_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_identifier}' not found",
        )

    # RBAC: Check if user is allowed to add note to this incident
    if user and not check_analyst_incident_access(existing, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot add notes to an incident not assigned to you",
        )

    note_author = author or (user.get("full_name") or user.get("email") if user else "Security Analyst")
    note_obj = {
        "author": note_author,
        "text": text,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    search_query = {"incident_id": existing["incident_id"]}
    updated_doc = await db["incidents"].find_one_and_update(
        search_query,
        {"$push": {"notes": note_obj}},
        return_document=True,
    )

    formatted = format_incident_doc(updated_doc)

    await log_audit_event(
        request,
        user,
        action=f"Incident Note Added (ID: {existing['incident_id']})",
        module="Incidents",
        status="Success",
    )

    return formatted


async def delete_incident(
    db: AsyncIOMotorDatabase,
    incident_identifier: str,
    user: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> Dict[str, Any]:
    """Delete an incident document from MongoDB. Restricted to administrators."""
    existing = await get_incident_by_id(db, incident_identifier)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_identifier}' not found",
        )

    if user:
        user_role = str(user.get("role", "")).strip().lower().replace(" ", "_")
        if user_role != "security_administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only administrators can delete incidents",
            )

    search_query = {"incident_id": existing["incident_id"]}
    await db["incidents"].delete_one(search_query)

    await log_audit_event(
        request,
        user,
        action=f"Incident Deleted (ID: {existing['incident_id']})",
        module="Incidents",
        status="Success",
    )

    return {"message": "Incident deleted successfully", "incident_id": existing["incident_id"]}
