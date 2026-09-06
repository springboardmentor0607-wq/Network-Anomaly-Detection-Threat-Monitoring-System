import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr, Field

logger = logging.getLogger(__name__)


class Role(str, Enum):
    security_administrator = "Security Administrator"
    security_analyst = "Security Analyst"


class UserDocument(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    hashed_password: str
    role: Role
    gender: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_db_dict(self) -> Dict[str, Any]:
        return self.model_dump(mode="json", exclude_none=True)


def build_user_document(full_name: str, email: str, hashed_password: str, role: str, gender: Optional[str] = None) -> Dict[str, Any]:
    return UserDocument(
        full_name=full_name,
        email=email,
        hashed_password=hashed_password,
        role=role,
        gender=gender,
    ).to_db_dict()


async def create_user_indexes(db: AsyncIOMotorDatabase):
    """
    Creates unique indexes on 'email' for the users collection.
    """
    try:
        users_collection = db["users"]
        # Create a unique index on the email field
        await users_collection.create_index(
            "email", unique=True, name="idx_users_email_unique"
        )
        logger.info("Successfully created unique indexes for 'users' collection.")
    except pymongo.errors.OperationFailure as e:
        logger.error(f"Failed to create indexes for 'users' collection: {e}")
    except Exception as e:
        logger.error(f"Unexpected error while creating indexes: {e}")
