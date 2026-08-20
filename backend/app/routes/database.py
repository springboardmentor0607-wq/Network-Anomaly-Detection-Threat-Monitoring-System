from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, get_mongo
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/status")
async def get_database_status(db: Session = Depends(get_db), mongo_db = Depends(get_mongo)):
    status = {
        "postgres": {
            "status": "Offline",
            "size_mb": 0,
            "total_users": 0
        },
        "mongodb": {
            "status": "Offline",
            "size_mb": 0,
            "total_telemetry": 0
        }
    }
    
    # Check Postgres
    try:
        size_result = db.execute(text("SELECT pg_database_size(current_database());")).fetchone()
        if size_result:
            status["postgres"]["size_mb"] = round(size_result[0] / (1024 * 1024), 2)
            
        user_count = db.execute(text("SELECT count(*) FROM users")).fetchone()
        if user_count:
            status["postgres"]["total_users"] = user_count[0]
            
        status["postgres"]["status"] = "Online"
    except Exception as e:
        logger.error(f"Postgres status error: {e}")
        
    # Check MongoDB
    try:
        stats = await mongo_db.command("dbstats")
        status["mongodb"]["size_mb"] = round(stats.get("dataSize", 0) / (1024 * 1024), 2)
        
        count = await mongo_db["network_traffic"].estimated_document_count()
        status["mongodb"]["total_telemetry"] = count
        
        status["mongodb"]["status"] = "Online"
    except Exception as e:
        logger.error(f"MongoDB status error: {e}")
        
    return status
