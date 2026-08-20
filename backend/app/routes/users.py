from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()

class RoleUpdateRequest(BaseModel):
    role: str

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """Retrieve all users from the database."""
    users = db.query(User).all()
    return users

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: str, role_update: RoleUpdateRequest, db: Session = Depends(get_db)):
    """Update a user's role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role_update.role not in ["admin", "analyst"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'analyst'")
        
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user from the system."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}
