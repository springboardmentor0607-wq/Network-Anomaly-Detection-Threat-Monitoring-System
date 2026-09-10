import uuid
import math
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.permissions import require_roles, get_current_user
from app.models.role import RoleEnum
from datetime import datetime

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

# ============ Schemas ============

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    action: str
    target_resource: str
    details: str
    ip_address: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# ============ Endpoints ============

@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    action: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER]))
) -> Any:
    """Get audit logs with filtering and pagination"""
    
    query = db.query(AuditLog).join(User)
    
    # Filter by action
    if action and action.upper() != "ALL":
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    
    # Filter by user email
    if user_email:
        query = query.filter(User.email.ilike(f"%{user_email}%"))
    
    # Filter by date range
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    offset = (page - 1) * page_size
    items = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size).all()
    
    # Convert to response format
    audit_logs = []
    for log in items:
        user = db.query(User).filter(User.id == log.user_id).first()
        audit_log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": user.email if user else "system",
            "action": log.action,
            "target_resource": log.target_resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        }
        audit_logs.append(AuditLogResponse(**audit_log_dict))
    
    return AuditLogListResponse(
        items=audit_logs,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{log_id}", response_model=AuditLogResponse)
def get_audit_log(
    log_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
) -> Any:
    """Get specific audit log"""
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    user = db.query(User).filter(User.id == log.user_id).first()
    
    return AuditLogResponse(
        id=log.id,
        user_id=log.user_id,
        user_email=user.email if user else "system",
        action=log.action,
        target_resource=log.target_resource,
        details=log.details,
        ip_address=log.ip_address,
        created_at=log.created_at
    )

@router.get("/statistics/summary")
def get_audit_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
) -> Any:
    """Get audit log statistics"""
    
    total_logs = db.query(func.count(AuditLog.id)).scalar() or 0
    
    # Count by action (top 10)
    action_counts = db.query(
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).group_by(AuditLog.action).order_by(desc(func.count(AuditLog.id))).limit(10).all()
    
    # Count by user (top 5)
    user_counts = db.query(
        User.email,
        func.count(AuditLog.id).label('count')
    ).join(AuditLog).group_by(User.email).order_by(desc(func.count(AuditLog.id))).limit(5).all()
    
    return {
        "total_logs": total_logs,
        "recent_logs_count": db.query(func.count(AuditLog.id)).filter(
            AuditLog.created_at >= datetime.now().replace(day=1)
        ).scalar() or 0,
        "top_actions": [{"action": action, "count": count} for action, count in action_counts],
        "top_users": [{"email": email, "count": count} for email, count in user_counts]
    }
