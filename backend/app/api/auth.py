import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pymongo.errors import PyMongoError

from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.database.database import get_db
from app.auth.handler import get_password_hash, verify_password, create_access_token, get_current_user
from app.models.user import build_user_document
from app.services.audit_logger import log_audit_event

router = APIRouter()
logger = logging.getLogger("netshield.backend.auth")


def normalize_email(email: str) -> str:
    return str(email).strip().lower()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(request: Request, user: UserRegister, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Register a new user."""
    normalized_email = normalize_email(user.email)

    try:
        existing_user = await db["users"].find_one({"email": normalized_email})
        if existing_user:
            logger.warning("Registration rejected for duplicate email: %s", normalized_email)
            await log_audit_event(request, {"email": normalized_email}, "Failed Registration", "Auth", "Failure")
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        hashed_password = get_password_hash(user.password)
        user_dict = build_user_document(
            full_name=user.full_name.strip(),
            email=normalized_email,
            hashed_password=hashed_password,
            role=user.role.value,
        )

        result = await db["users"].insert_one(user_dict)
        created_user = await db["users"].find_one({"_id": result.inserted_id})
        if not created_user:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user record")

        created_user.pop("hashed_password", None)
        created_user["id"] = str(created_user["_id"])
        created_user.pop("_id", None)
        logger.info("User registered successfully: %s", normalized_email)
        await log_audit_event(request, created_user, "User Registration", "Auth", "Success")
        return created_user
    except HTTPException:
        raise
    except PyMongoError as exc:
        logger.exception("MongoDB error during registration for %s", normalized_email)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to create user account") from exc
    except Exception as exc:
        logger.exception("Unexpected error during registration for %s", normalized_email)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to create user account") from exc

@router.post("/login", response_model=TokenResponse)
async def login_user(request: Request, user_credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Authenticate a user and return a JWT access token."""
    normalized_email = normalize_email(user_credentials.email)

    try:
        user = await db["users"].find_one({"email": normalized_email})
        if not user:
            logger.warning("Login attempt failed for unknown email: %s", normalized_email)
            await log_audit_event(request, {"email": normalized_email}, "Failed Login", "Auth", "Failure")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(user_credentials.password, user["hashed_password"]):
            logger.warning("Login attempt failed due to invalid password for email: %s", normalized_email)
            await log_audit_event(request, user, "Failed Login", "Auth", "Failure")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.get("is_active", True):
            await log_audit_event(request, user, "Failed Login", "Auth", "Failure")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user account"
            )

        access_token = create_access_token(subject=str(user["_id"]))
        logger.info("User authenticated successfully: %s", normalized_email)
        await log_audit_event(request, user, "User Login", "Auth", "Success")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except PyMongoError as exc:
        logger.exception("MongoDB error during login for %s", normalized_email)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to authenticate user") from exc
    except Exception as exc:
        logger.exception("Unexpected error during login for %s", normalized_email)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to authenticate user") from exc

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout_user(request: Request, current_user: dict = Depends(get_current_user)):
    """Record a logout audit event. Token invalidation is handled client-side."""
    await log_audit_event(request, current_user, "User Logout", "Auth", "Success")
    logger.info("User logged out: %s", current_user.get("email"))
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve the profile of the currently authenticated user."""
    safe_user = {key: value for key, value in current_user.items() if key != "hashed_password"}
    safe_user["id"] = str(safe_user["_id"])
    safe_user.pop("_id", None)
    return safe_user
