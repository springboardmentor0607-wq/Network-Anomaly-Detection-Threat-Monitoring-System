import logging
from typing import Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.config import settings
from app.services.system_logger import log_system_event

logger = logging.getLogger(__name__)

class MongoDBConnection:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

# Central database connection state instance
db_connection = MongoDBConnection()

async def connect_to_mongo():
    """
    Establish a connection to the MongoDB instance and select the database.
    Performs a connection check (ping) to handle startup connection errors properly.
    """
    if db_connection.client is not None:
        logger.warning("MongoDB client is already initialized.")
        return

    try:
        logger.info(f"Connecting to MongoDB instance at: {settings.MONGODB_URL}")
        # Initialize the client with a server selection timeout (e.g. 5 seconds) to avoid hanging
        db_connection.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )
        db_connection.database = db_connection.client[settings.DATABASE_NAME]
        
        # Ping the admin database to verify connection immediately at startup
        # This will raise ServerSelectionTimeoutError or ConnectionFailure if offline
        await db_connection.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {settings.DATABASE_NAME}")
        
        # Create MongoDB indexes in background for optimal query performance
        db = db_connection.database
        indexes_to_create = [
            ("alerts", [("timestamp", -1)]),
            ("alerts", [("severity", 1)]),
            ("alerts", [("attack_type", 1)]),
            ("alerts", [("alert_id", 1)]),
            ("incidents", [("created_at", -1)]),
            ("users", [("email", 1)]),
            ("audit_logs", [("timestamp", -1)]),
            ("system_logs", [("timestamp", -1)]),
        ]
        for col_name, idx_spec in indexes_to_create:
            try:
                await db[col_name].create_index(idx_spec, background=True)
            except Exception:
                pass
        logger.info("MongoDB collection indexes checked/initialized.")

        await log_system_event("SUCCESS", "Database", "MongoDB Connected")
    
    except (ServerSelectionTimeoutError, ConnectionFailure) as e:
        logger.error(
            f"Could not connect to MongoDB at {settings.MONGODB_URL}. "
            f"Please verify that your database server is running and accessible. Error: {e}"
        )
        # Clear connections on failure and log, but do not raise, to prevent application startup failure.
        db_connection.client = None
        db_connection.database = None
        await log_system_event("ERROR", "Database", "MongoDB Connection Failed", exception=str(e))
        
    except Exception as e:
        logger.error(f"An unexpected error occurred during database connection startup: {e}")
        db_connection.client = None
        db_connection.database = None
        await log_system_event("ERROR", "Database", "Unexpected error during connection", exception=str(e))

async def close_mongo_connection():
    """
    Gracefully close the MongoDB client connection.
    """
    if db_connection.client is not None:
        db_connection.client.close()
        logger.info("MongoDB connection closed.")
        db_connection.client = None
        db_connection.database = None
    else:
        logger.warning("MongoDB client is not initialized, cannot close connection.")

def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency that returns the database instance.
    Ensures connection is initialized before usage.
    """
    if db_connection.database is None:
        logger.error("Attempted to access database dependency before client was connected.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection not initialized")
    return db_connection.database
