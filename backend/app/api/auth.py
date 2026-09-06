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
            gender=user.gender,
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
    safe_user["id"] = str(safe_user.get("id") or safe_user.get("_id", ""))
    safe_user.pop("_id", None)
    return safe_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Change the authenticated user's password.
    Verifies the current password before updating to the new hashed password.
    Accepts JSON body: { current_password, new_password, confirm_password }
    """
    # Parse body manually to give clear validation errors
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request body")

    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")
    confirm_password = body.get("confirm_password", "")

    # Validate inputs
    if not current_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is required")
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters")
    if new_password != confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password and confirmation do not match")

    # Cannot use the same password
    if current_password == new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must differ from current password")

    user_id = str(current_user.get("id") or current_user.get("_id") or "")

    try:
        # Re-fetch user from DB to get the hashed_password (safe_user strips it)
        db_user = None
        if ObjectId.is_valid(user_id):
            db_user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not db_user:
            db_user = await db["users"].find_one({"email": current_user.get("email", "")})

        if not db_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

        # Verify the current password against the stored hash
        stored_hash = db_user.get("hashed_password", "")
        if not verify_password(current_password, stored_hash):
            await log_audit_event(request, current_user, "Password Change Failed (Wrong Current Password)", "Auth", "Failure")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

        # Hash the new password and update
        new_hashed = get_password_hash(new_password)
        update_filter = {"_id": db_user["_id"]}
        await db["users"].update_one(update_filter, {"$set": {"hashed_password": new_hashed}})

        logger.info("Password changed successfully for user: %s", current_user.get("email"))
        await log_audit_event(request, current_user, "Password Changed Successfully", "Auth", "Success")
        return {"message": "Password updated successfully. Please log in again with your new password."}

    except HTTPException:
        raise
    except PyMongoError as exc:
        logger.exception("MongoDB error during password change for user %s", user_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to update password") from exc
    except Exception as exc:
        logger.exception("Unexpected error during password change for user %s", user_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to update password") from exc
