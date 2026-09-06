import logging
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class IncidentPriority(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class IncidentStatus(str, Enum):
    NEW = "New"
    IN_PROGRESS = "In Progress"
    UNDER_INVESTIGATION = "Under Investigation"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


def generate_incident_id() -> str:
    """Generate a unique human-readable incident identifier (e.g. INC-A1B2C3D4)."""
    return f"INC-{uuid.uuid4().hex[:8].upper()}"


class IncidentNote(BaseModel):
    author: str = Field(default="Security Analyst")
    text: str = Field(..., min_length=1)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class IncidentDocument(BaseModel):
    incident_id: str = Field(default_factory=generate_incident_id)
    alert_id: Optional[str] = None
    title: str = Field(default="Security Incident Investigation")
    assigned_analyst_id: Optional[str] = None
    assigned_analyst_name: Optional[str] = None
    assigned_analyst: Optional[str] = Field(default="Unassigned")
    assigned_at: Optional[str] = None
    priority: IncidentPriority = Field(default=IncidentPriority.HIGH)
    status: IncidentStatus = Field(default=IncidentStatus.NEW)
    notes: List[IncidentNote] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    resolved_at: Optional[str] = None

    def to_db_dict(self) -> Dict[str, Any]:
        return self.model_dump(mode="json")


async def create_incident_indexes(db: AsyncIOMotorDatabase) -> None:
    """
    Create database indexes for the 'incidents' collection in MongoDB.
    """
    try:
        incidents_collection = db["incidents"]
        await incidents_collection.create_index(
            "incident_id", unique=True, name="idx_incidents_incident_id_unique"
        )
        await incidents_collection.create_index(
            "alert_id", name="idx_incidents_alert_id"
        )
        await incidents_collection.create_index(
            "assigned_analyst_id", name="idx_incidents_assigned_analyst_id"
        )
        await incidents_collection.create_index(
            "status", name="idx_incidents_status"
        )
        await incidents_collection.create_index(
            "priority", name="idx_incidents_priority"
        )
        await incidents_collection.create_index(
            [("created_at", pymongo.DESCENDING)], name="idx_incidents_created_at_desc"
        )
        logger.info("Successfully created indexes for 'incidents' collection.")
    except pymongo.errors.OperationFailure as e:
        logger.error(f"Failed to create indexes for 'incidents' collection: {e}")
    except Exception as e:
        logger.error(f"Unexpected error while creating incident indexes: {e}")
