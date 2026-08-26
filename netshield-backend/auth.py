"""
JWT issuing/verification and role-based access control (RBAC) for NetShield AI.

Flow:
  1. /login verifies the password and hands back a signed JWT that carries
     the user's id, username, and role.
  2. Every protected route depends on `get_current_user`, which decodes that
     token and loads the matching user row.
  3. Routes that should only work for one role add `require_role(...)` on
     top of that — e.g. team management is security_administrator only.
"""
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import SessionLocal
import models

# In production this MUST come from an environment variable / secrets
# manager. The fallback below only exists so the app still runs locally
# if you forget to set one — do not ship that fallback anywhere real.
SECRET_KEY = os.getenv("NETSHIELD_SECRET_KEY", "dev-only-insecure-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hour shift-length session

# tokenUrl is only used to populate FastAPI's /docs "Authorize" button;
# the actual login endpoint takes JSON, not an OAuth2 form.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(*, user_id: int, username: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_error

    return user


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-gated routes.

    Usage:
        @app.get("/admin/users")
        def list_users(user: models.User = Depends(require_role("security_administrator"))):
            ...
    """
    def role_checker(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {', '.join(allowed_roles)}",
            )
        return user

    return role_checker
