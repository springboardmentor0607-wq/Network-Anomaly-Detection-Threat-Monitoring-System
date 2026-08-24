import time
from fastapi import APIRouter
from app.database.database import db_connection
from app.services.network_monitoring import get_dataset_status

router = APIRouter()

@router.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint to verify backend and database connection status."""
    db_status = "disconnected"
    if db_connection.client is not None:
        try:
            # Check database connectivity by pinging the admin database
            await db_connection.client.admin.command('ping')
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
    return {
        "status": "online",
        "database": db_status,
        "dataset_status": get_dataset_status(),
        "timestamp": time.time()
    }
