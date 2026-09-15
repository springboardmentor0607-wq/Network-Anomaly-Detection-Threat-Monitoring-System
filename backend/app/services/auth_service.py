from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.role import Role, RoleEnum
from app.models.team import Team
from app.models.audit_log import AuditLog
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest, client_ip: Optional[str] = None) -> TokenResponse:
        user = db.query(User).filter(User.email == login_data.email).first()

        if not user or not verify_password(login_data.password, user.password_hash):
            audit = AuditLog(
                user_email=login_data.email,
                action="LOGIN_FAILED",
                resource="AUTH",
                status_result="FAILURE",
                ip_address=client_ip,
                details={"reason": "Invalid credentials"}
            )
            db.add(audit)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )

        user.last_login = datetime.utcnow()

        audit = AuditLog(
            user_email=user.email,
            action="LOGIN_SUCCESS",
            resource="AUTH",
            status_result="SUCCESS",
            ip_address=client_ip,
            details={"role": user.role.name if user.role else "USER"}
        )
        db.add(audit)
        db.commit()
        db.refresh(user)

        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.name if user.role else "USER"},
            expires_delta=expires_delta
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    def register_user(db: Session, register_data: RegisterRequest, client_ip: Optional[str] = None) -> TokenResponse:
        existing = db.query(User).filter(User.email == register_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User email is already registered."
            )

        # Match role or fallback to SECURITY_ANALYST
        requested_role = register_data.role.upper() if register_data.role else "SECURITY_ANALYST"
        role_enum = RoleEnum.SECURITY_ANALYST
        if requested_role in [e.value for e in RoleEnum]:
            role_enum = RoleEnum(requested_role)

        role = db.query(Role).filter(Role.name == role_enum).first()
        if not role:
            role = Role(name=role_enum, description="Registered User Role")
            db.add(role)
            db.commit()
            db.refresh(role)

        team = db.query(Team).first()
        if not team:
            team = Team(name="SOC Operations Team", description="Primary Response Team")
            db.add(team)
            db.commit()
            db.refresh(team)

        password_hash = get_password_hash(register_data.password)

        new_user = User(
            email=register_data.email,
            full_name=register_data.full_name,
            password_hash=password_hash,
            role_id=role.id,
            team_id=team.id,
            is_active=True,
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Record audit log
        audit = AuditLog(
            user_email=new_user.email,
            action="USER_REGISTERED",
            resource="AUTH",
            status_result="SUCCESS",
            ip_address=client_ip,
            details={"role": role.name}
        )
        db.add(audit)
        db.commit()

        # Generate access token
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id), "role": role.name},
            expires_delta=expires_delta
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(new_user)
        )
