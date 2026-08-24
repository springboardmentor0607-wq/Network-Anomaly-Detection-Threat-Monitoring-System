import logging
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    SAFE = "Safe"


class AlertStatus(str, Enum):
    OPEN = "Open"
    ACKNOWLEDGED = "Acknowledged"
    RESOLVED = "Resolved"


def generate_alert_id() -> str:
    """Generate a unique human-readable alert identifier (e.g. ALT-A1B2C3D4)."""
    return f"ALT-{uuid.uuid4().hex[:8].upper()}"


class AlertDocument(BaseModel):
    alert_id: str = Field(default_factory=generate_alert_id)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source_ip: str = Field(default="192.168.1.100")
    destination_ip: str = Field(default="10.0.0.1")
    attack_type: str = Field(default="Unknown")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    risk_score: int = Field(default=50, ge=0, le=100)
    severity: AlertSeverity = Field(default=AlertSeverity.MEDIUM)
    status: AlertStatus = Field(default=AlertStatus.OPEN)
    assigned_to: Optional[str] = None

    def to_db_dict(self) -> Dict[str, Any]:
        return self.model_dump(mode="json")


async def create_alert_indexes(db: AsyncIOMotorDatabase) -> None:
    """
    Create database indexes for the 'alerts' collection in MongoDB.
    """
    try:
        alerts_collection = db["alerts"]
        await alerts_collection.create_index(
            "alert_id", unique=True, name="idx_alerts_alert_id_unique"
        )
        await alerts_collection.create_index(
            [("timestamp", pymongo.DESCENDING)], name="idx_alerts_timestamp_desc"
        )
        await alerts_collection.create_index(
            "status", name="idx_alerts_status"
        )
        await alerts_collection.create_index(
            "severity", name="idx_alerts_severity"
        )
        logger.info("Successfully created indexes for 'alerts' collection.")
    except pymongo.errors.OperationFailure as e:
        logger.error(f"Failed to create indexes for 'alerts' collection: {e}")
    except Exception as e:
        logger.error(f"Unexpected error while creating alert indexes: {e}")
