from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.role import RoleEnum
from app.schemas.auth import UserResponse
from app.core.permissions import require_roles, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER]))
) -> Any:
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]
