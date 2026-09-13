from typing import Any
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.core.permissions import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    client_ip = request.client.host if request.client else None
    return AuthService.authenticate_user(db, login_data, client_ip=client_ip)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    register_data: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    client_ip = request.client.host if request.client else None
    return AuthService.register_user(db, register_data, client_ip=client_ip)

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    return UserResponse.model_validate(current_user)

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    current_user: User = Depends(get_current_user)
) -> Any:
    return {"message": "Successfully logged out", "user_email": current_user.email}
