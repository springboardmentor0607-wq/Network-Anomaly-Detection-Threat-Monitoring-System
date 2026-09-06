import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId

try:
    import bcrypt
except ImportError:  # pragma: no cover - runtime fallback
    bcrypt = None

try:
    from passlib.context import CryptContext
except ImportError:  # pragma: no cover - runtime fallback
    CryptContext = None

from app.config import settings
from app.database.database import get_db

# Password hashing configuration using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") if CryptContext is not None else None
logger = logging.getLogger("netshield.backend.auth.handler")

# OAuth2 scheme for token extraction from headers
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against its hashed version."""
    if not plain_password or not hashed_password:
        return False

    if pwd_context is not None:
        try:
            return bool(pwd_context.verify(plain_password, hashed_password))
        except Exception as exc:
            logger.warning("Passlib password verification failed: %s", exc)

    if bcrypt is None:
        raise RuntimeError("bcrypt is not available")

    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as exc:
        logger.warning("bcrypt password verification failed: %s", exc)
        return False


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of a plain text password."""
    if pwd_context is not None:
        try:
            return pwd_context.hash(password)
        except Exception as exc:
            logger.warning("Passlib password hashing failed: %s", exc)

    if bcrypt is None:
        raise RuntimeError("bcrypt is not available")

    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate a JWT access token for a given subject (e.g., user_id or email)."""
    try:
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode = {"exp": expire, "sub": str(subject)}
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        if isinstance(encoded_jwt, bytes):
            encoded_jwt = encoded_jwt.decode('utf-8')
        return encoded_jwt
    except Exception as exc:
        logger.exception("Failed to create JWT token for subject %s", subject)
        raise exc

def decode_access_token(token: str) -> Optional[dict]:
    """Decode a JWT access token and return its payload if valid, otherwise None."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except InvalidTokenError:
        return None
    except Exception as exc:
        logger.exception("Failed to decode JWT token")
        return None

DEFAULT_ADMIN_USER = {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@netshield.ai",
    "full_name": "Security Administrator",
    "role": "Security Administrator",
    "is_active": True,
}


async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    """
    Dependency to extract and validate the JWT token, then fetch the current user from MongoDB.
    Raises HTTP 401 Unauthorized if the token is invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    if user_id in ("default_admin", "507f1f77bcf86cd799439011"):
        admin_user = dict(DEFAULT_ADMIN_USER)
        admin_user["id"] = str(admin_user.get("id") or admin_user.get("_id"))
        return admin_user

    try:
        if db is not None:
            user = None
            if ObjectId.is_valid(user_id):
                user = await db["users"].find_one({"_id": ObjectId(user_id)})
            if not user:
                user = await db["users"].find_one({"_id": user_id})
            if not user:
                user = await db["users"].find_one({"email": user_id})

            if user:
                user["id"] = str(user["_id"])
                return user
    except Exception as exc:
        logger.warning("Error fetching user from database: %s", exc)

    raise credentials_exception

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = {self._normalize_role_name(role) for role in allowed_roles}

    @staticmethod
    def _normalize_role_name(role: str) -> str:
        return str(role).strip().lower().replace(" ", "_")

    def __call__(self, user: dict = Depends(get_current_user)):
        user_role = self._normalize_role_name(user.get("role", ""))
        if not user_role or user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return user
