import logging

import datetime
import random
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth.handler import RoleChecker
from app.services.audit_logger import log_audit_event
from app.database.database import get_db
from app.services.network_monitoring import (
    ensure_dataset_loaded_async,
    get_cached_analytics,
    get_dataset_status,
    get_processed_dataframe,
    query_traffic_page,
)

router = APIRouter()
logger = logging.getLogger("netshield.backend.admin")

admin_only = RoleChecker(["Security Administrator"])


class RoleUpdateRequest(BaseModel):
    role: str


@router.get("/users")
async def manage_users(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(admin_only),
):
    """List user records stored in MongoDB for the Security Administrator."""
    try:
        users_cursor = db["users"].find({}, {"hashed_password": 0}).sort("created_at", -1)
        users = []
        async for user in users_cursor:
            user["id"] = str(user.pop("_id"))
            users.append(user)
        await log_audit_event(request, current_user, "Users List Viewed", "Admin", "Success")
        return {"users": users, "requested_by": current_user["email"]}
    except Exception as exc:
        logger.exception("Failed to load users from MongoDB")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to load users") from exc


@router.patch("/users/{user_id}/role")
async def update_user_role(
    request: Request,
    user_id: str,
    body: RoleUpdateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(admin_only),
):
    """Update a user's role. Restricted to Security Administrators."""
    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user identifier") from exc

    allowed_roles = {"Security Administrator", "Security Analyst"}
    if body.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role must be one of: {sorted(allowed_roles)}")

    try:
        result = await db["users"].find_one_and_update(
            {"_id": object_id},
            {"$set": {"role": body.role}},
            return_document=True,
            projection={"hashed_password": 0},
        )
        if result is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        result["id"] = str(result.pop("_id"))
        await log_audit_event(
            request, current_user,
            f"Role Updated to '{body.role}'", "Admin", "Success"
        )
        return {"user": result, "requested_by": current_user["email"]}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update role for user %s", user_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to update role") from exc


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    request: Request,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(admin_only),
):
    """Delete a user account from MongoDB. Restricted to Security Administrators."""
    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user identifier") from exc

    if str(current_user.get("_id")) == str(object_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")

    try:
        result = await db["users"].delete_one({"_id": object_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        await log_audit_event(request, current_user, "User Deletion", "Admin", "Success")
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete user %s", user_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to delete user") from exc


@router.get("/analytics")
async def get_analytics(request: Request, current_user: dict = Depends(admin_only)):
    """Provide aggregate traffic analytics for the authenticated administrator."""
    await log_audit_event(request, current_user, "Analytics Viewed", "Admin", "Success")
    dataset_status = await ensure_dataset_loaded_async()
    analytics = get_cached_analytics()

    if dataset_status == "loading":
        return {
            "dataset_status": "loading",
            "rows_processed": 0,
            "attack_records": 0,
            "normal_records": 0,
            "protocol_distribution": [],
            "traffic_timeline": [],
            "requested_by": current_user["email"],
        }

    # Build traffic_timeline from cached DataFrame (no CSV reads — O(page_size)).
    combined = get_processed_dataframe()
    recent_rows = combined.iloc[:20] if not combined.empty else combined
    protocol_distribution = [
        {"protocol": item["name"], "count": item["count"]}
        for item in analytics.get("protocol_distribution", [])
    ]
    traffic_timeline = [
        {"label": f"Record {index + 1}", "value": int(row.get("packet_size") or 0)}
        for index, row in enumerate(recent_rows.to_dict(orient="records"))
        if "packet_size" in row
    ]

    return {
        "dataset_status": dataset_status,
        "rows_processed": analytics.get("total_traffic", 0),
        "attack_records": analytics.get("attack_traffic", 0),
        "normal_records": analytics.get("normal_traffic", 0),
        "protocol_distribution": protocol_distribution,
        "traffic_timeline": traffic_timeline,
        "requested_by": current_user["email"],
    }


@router.get("/reports")
async def get_reports(request: Request, current_user: dict = Depends(admin_only)):
    """Provide report summary metrics for operational export."""
    await log_audit_event(request, current_user, "Reports Viewed", "Admin", "Success")
    dataset_status = await ensure_dataset_loaded_async()
    analytics = get_cached_analytics()
    protocols = [item["name"] for item in analytics.get("protocol_distribution", [])]

    return {
        "dataset_status": dataset_status,
        "rows_processed": analytics.get("total_traffic", 0),
        "attack_records": analytics.get("attack_traffic", 0),
        "normal_records": analytics.get("normal_traffic", 0),
        "protocols": sorted(protocols),
        "requested_by": current_user["email"],
    }


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    event_type: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    """Provide real MongoDB audit logs."""
    query = {}
    if search:
        query["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"fullName": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if event_type:
        query["action"] = event_type

    total_logs = await db["audit_logs"].count_documents(query)
    
    start_idx = (page - 1) * limit
    cursor = db["audit_logs"].find(query).sort("timestamp", -1).skip(start_idx).limit(limit)
    
    logs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["username"] = doc.get("email", "Unknown")
        doc["event_type"] = doc.get("action", "Unknown")
        doc["ip_address"] = doc.get("ipAddress", "Unknown")
        logs.append(doc)
    
    return {
        "data": logs,
        "page": page,
        "limit": limit,
        "total": total_logs,
        "requested_by": current_user["email"]
    }

@router.get("/system-logs")
async def get_system_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    """Provide real MongoDB system logs."""
    query = {}
    if search:
        query["$or"] = [
            {"module": {"$regex": search, "$options": "i"}},
            {"message": {"$regex": search, "$options": "i"}}
        ]
        
    total_logs = await db["system_logs"].count_documents(query)
    
    start_idx = (page - 1) * limit
    cursor = db["system_logs"].find(query).sort("timestamp", -1).skip(start_idx).limit(limit)
    
    logs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        logs.append(doc)
        
    return {
        "data": logs,
        "page": page,
        "limit": limit,
        "total": total_logs,
        "requested_by": current_user["email"]
    }
