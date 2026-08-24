import datetime
import logging
from typing import Optional

logger = logging.getLogger("netshield.backend.system")


async def log_system_event(
    level: str,
    module: str,
    message: str,
    exception: Optional[str] = None
):
    """
    Log a system event to the MongoDB system_logs collection.
    Uses a lazy import of db_connection to break the circular import with database.py.
    """
    try:
        # Lazy import to avoid circular dependency:
        # database.py -> system_logger.py -> database.py
        from app.database.database import db_connection  # noqa: PLC0415

        if db_connection.database is None:
            return

        doc = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "level": level,  # INFO, WARNING, ERROR, SUCCESS
            "module": module,
            "message": message,
            "exception": exception
        }
        await db_connection.database["system_logs"].insert_one(doc)
    except Exception as exc:
        logger.error("Failed to write system log: %s", exc)
