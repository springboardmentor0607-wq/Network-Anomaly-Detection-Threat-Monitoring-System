import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.handler import get_current_user
from app.database.database import get_db
from app.schemas.incident import IncidentCreate, IncidentNoteCreate, IncidentResponse, IncidentUpdate
from app.services.audit_logger import log_audit_event
from app.services.incident_service import (
    add_incident_note,
    check_analyst_incident_access,
    create_incident,
    create_incident_from_alert,
    delete_incident,
    get_incident_by_id,
    get_incidents,
    update_incident,
)

router = APIRouter()
logger = logging.getLogger("netshield.backend.incidents.api")


@router.get("/my-assigned", response_model=List[IncidentResponse])
async def list_my_assigned_incidents(
    request: Request,
    status: Optional[str] = Query(default=None, description="Filter by status"),
    priority: Optional[str] = Query(default=None, description="Filter by priority"),
    limit: int = Query(default=100, ge=1, le=1000),
    skip: int = Query(default=0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve only incidents assigned to the currently authenticated analyst.
    """
    await log_audit_event(request, current_user, "Analyst Assigned Incidents Viewed", "Incidents")
    user_id = str(current_user.get("id") or current_user.get("_id") or "")
    try:
        incidents = await get_incidents(
            db=db,
            status_filter=status,
            priority_filter=priority,
            assigned_analyst_id=user_id,
            user=current_user,
            limit=limit,
            skip=skip,
        )
        return incidents
    except Exception as exc:
        logger.exception("Failed to retrieve analyst-assigned incidents")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch assigned incidents",
        ) from exc


@router.get("/analysts")
async def list_available_analysts(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve list of registered Security Analysts for assignment dropdowns.
    """
    try:
        cursor = db["users"].find(
            {"role": "Security Analyst", "is_active": {"$ne": False}},
            {"hashed_password": 0},
        ).sort("full_name", 1)
        analysts = []
        async for u in cursor:
            analysts.append({
                "id": str(u["_id"]),
                "full_name": u.get("full_name", "Unknown"),
                "email": u.get("email", ""),
                "role": u.get("role", "Security Analyst"),
            })
        return analysts
    except Exception as exc:
        logger.exception("Failed to load analysts list")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load analysts",
        ) from exc


@router.get("", response_model=List[IncidentResponse])
@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    request: Request,
    status: Optional[str] = Query(default=None, description="Filter by status: New, In Progress, Under Investigation, Resolved, Closed"),
    priority: Optional[str] = Query(default=None, description="Filter by priority: Critical, High, Medium, Low"),
    assigned_analyst: Optional[str] = Query(default=None, description="Filter by analyst email or name"),
    limit: int = Query(default=100, ge=1, le=1000),
    skip: int = Query(default=0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve incidents.
    - Administrators can view all incidents and use filters.
    - Security Analysts are automatically restricted to only their assigned incidents.
    """
    await log_audit_event(request, current_user, "Incidents List Viewed", "Incidents")
    try:
        incidents = await get_incidents(
            db=db,
            status_filter=status,
            priority_filter=priority,
            assigned_analyst_filter=assigned_analyst,
            user=current_user,
            limit=limit,
            skip=skip,
        )
        return incidents
    except Exception as exc:
        logger.exception("Failed to retrieve incidents from MongoDB")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch incidents",
        ) from exc


@router.get("/{id}", response_model=IncidentResponse)
async def get_incident(
    id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get incident details by incident_id or MongoDB document ID.
    Enforces authorization: analysts cannot access incidents assigned to other analysts.
    """
    incident = await get_incident_by_id(db, id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{id}' not found",
        )

    if not check_analyst_incident_access(incident, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view this incident",
        )

    await log_audit_event(request, current_user, f"Incident Details Viewed ({id})", "Incidents")
    return incident


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_incident(
    incident_in: IncidentCreate,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Manually create a new security incident document.
    """
    try:
        created = await create_incident(
            incident_data=incident_in,
            db=db,
            request=request,
            user=current_user,
        )
        return created
    except Exception as exc:
        logger.exception("Failed to create incident document")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create incident",
        ) from exc


@router.post("/from-alert/{alert_id}", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def promote_alert_to_incident(
    alert_id: str,
    request: Request,
    assigned_analyst: Optional[str] = Query(default=None),
    assigned_analyst_id: Optional[str] = Query(default=None),
    assigned_analyst_name: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    initial_note: Optional[str] = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Promote an existing Alert into a full Incident record.
    """
    try:
        incident = await create_incident_from_alert(
            alert_id=alert_id,
            db=db,
            assigned_analyst=assigned_analyst,
            assigned_analyst_id=assigned_analyst_id,
            assigned_analyst_name=assigned_analyst_name,
            priority=priority,
            initial_note=initial_note,
            request=request,
            user=current_user,
        )
        return incident
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to promote alert '{alert_id}' to incident")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to promote alert to incident",
        ) from exc


@router.patch("/{id}", response_model=IncidentResponse)
async def update_incident_endpoint(
    id: str,
    incident_update: IncidentUpdate,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Update an incident's priority, status, or assigned analyst.
    Enforces authorization: analysts can only update their assigned incidents, and cannot reassign.
    """
    try:
        updated = await update_incident(
            db=db,
            incident_identifier=id,
            update_data=incident_update,
            user=current_user,
            request=request,
        )
        return updated
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to update incident '{id}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update incident",
        ) from exc


@router.post("/{id}/notes", response_model=IncidentResponse)
async def add_note_to_incident(
    id: str,
    note_in: IncidentNoteCreate,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Append an investigation note to an incident.
    Enforces authorization: analysts can only add notes to their assigned incidents.
    """
    try:
        updated = await add_incident_note(
            db=db,
            incident_identifier=id,
            text=note_in.text,
            author=note_in.author,
            user=current_user,
            request=request,
        )
        return updated
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to add note to incident '{id}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add investigation note",
        ) from exc


@router.delete("/{id}")
async def delete_incident_endpoint(
    id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete an incident document from MongoDB. Restricted to administrators.
    """
    try:
        res = await delete_incident(
            db=db,
            incident_identifier=id,
            user=current_user,
            request=request,
        )
        return res
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to delete incident '{id}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete incident",
        ) from exc
