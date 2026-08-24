import datetime
import logging
import traceback
from typing import Optional

from fastapi import Request

logger = logging.getLogger("netshield.backend.audit")


async def log_audit_event(
    request: Optional[Request],
    user: Optional[dict],
    action: str,
    module: str,
    status: str = "Success"
):
    """
    Log an audit event to the MongoDB audit_logs collection.
    Handles None gracefully for request and user.
    Prints full traceback on failure so errors are never silently ignored.
    """
    try:
        # Lazy import to avoid circular dependency with database.py
        from app.database.database import db_connection  # noqa: PLC0415

        if db_connection.database is None:
            logger.warning("audit_logger: database is None — skipping audit log for action=%s", action)
            return

        ip_address = "Unknown"
        http_method = "Unknown"
        endpoint = "Unknown"
        user_agent = "Unknown"

        if request is not None:
            try:
                ip_address = request.client.host if request.client else "Unknown"
            except Exception:
                pass
            try:
                http_method = request.method
            except Exception:
                pass
            try:
                endpoint = str(request.url.path)
            except Exception:
                pass
            try:
                user_agent = request.headers.get("user-agent", "Unknown")
            except Exception:
                pass

        user_id = "Unknown"
        email = "Unknown"
        full_name = "Unknown"
        role = "Unknown"

        if user:
            try:
                user_id = str(user.get("_id", user.get("id", "Unknown")))
            except Exception:
                pass
            email = user.get("email", "Unknown")
            full_name = user.get("full_name", "Unknown")
            role = user.get("role", "Unknown")

        doc = {
            "userId": user_id,
            "fullName": full_name,
            "email": email,
            "role": role,
            "action": action,
            "module": module,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "ipAddress": ip_address,
            "httpMethod": http_method,
            "endpoint": endpoint,
            "status": status,
            "userAgent": user_agent,
        }

        result = await db_connection.database["audit_logs"].insert_one(doc)
        logger.info(
            "audit_log inserted: action=%s email=%s status=%s id=%s",
            action, email, status, result.inserted_id
        )

    except Exception:
        # Print full traceback — never silently ignore audit log failures.
        print("=" * 60)
        print(f"AUDIT LOG FAILURE — action={action!r} module={module!r}")
        traceback.print_exc()
        print("=" * 60)
