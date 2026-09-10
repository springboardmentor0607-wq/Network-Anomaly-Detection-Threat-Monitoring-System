import uuid
import math
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.models.user import User
from app.models.role import Role, RoleEnum
from app.models.audit_log import AuditLog
from app.schemas.auth import UserResponse
from app.core.permissions import require_roles, get_current_user
from app.core.security import get_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["Users"])

# ============ Schemas ============

class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_name: str

class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# ============ Endpoints ============

@router.get("", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    role_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
) -> Any:
    """List all users with pagination and filtering"""
    query = db.query(User)
    
    # Filter by role
    if role_name:
        query = query.filter(User.role.has(Role.name == role_name))
    
    # Search by email or name
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | 
            (User.full_name.ilike(f"%{search}%"))
        )
    
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    
    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
) -> Any:
    """Get user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
) -> Any:
    """Create a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Get role
    role = db.query(Role).filter(Role.name == user_data.role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{user_data.role_name}' does not exist"
        )
    
    # Create user
    new_user = User(
        id=uuid.uuid4(),
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role_id=role.id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log audit
    audit_log = AuditLog(
        user_email=current_user.email,
        action="USER_CREATED",
        resource=f"users/{new_user.email}",
        status_result="SUCCESS",
        details={"role": user_data.role_name, "created_by": current_user.email},
        ip_address="0.0.0.0"
    )
    db.add(audit_log)
    db.commit()
    
    return UserResponse.model_validate(new_user)

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    user_data: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
) -> Any:
    """Update user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Handle role update
    if "role_name" in update_data:
        role = db.query(Role).filter(Role.name == update_data.pop("role_name")).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")
        user.role_id = role.id
    
    # Update other fields
    for field, value in update_data.items():
        if value is not None:
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    # Log audit
    audit_log = AuditLog(
        user_email=current_user.email,
        action="USER_UPDATED",
        resource=f"users/{user.email}",
        status_result="SUCCESS",
        details={"updated_user": user.email, "updated_by": current_user.email},
        ip_address="0.0.0.0"
    )
    db.add(audit_log)
    db.commit()
    
    return UserResponse.model_validate(user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
) -> None:
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prevent deleting self
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    email = user.email
    db.delete(user)
    db.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_email=current_user.email,
        action="USER_DELETED",
        resource=f"users/{email}",
        status_result="SUCCESS",
        details={"deleted_user": email, "deleted_by": current_user.email},
        ip_address="0.0.0.0"
    )
    db.add(audit_log)
    db.commit()
