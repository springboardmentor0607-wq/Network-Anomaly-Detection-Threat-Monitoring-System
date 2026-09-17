import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from pymongo import MongoClient

load_dotenv()

# ---------- PostgreSQL (users, alerts, incidents, audit_logs) ----------
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@localhost:5432/netshield")
if os.getenv("DOCKERIZED") == "true":
    POSTGRES_URL = POSTGRES_URL.replace("@localhost:", "@postgres:").replace(
        "@127.0.0.1:", "@postgres:"
    )

engine = create_engine(POSTGRES_URL, connect_args={"connect_timeout": 5})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- MongoDB (raw traffic logs) ----------
MONGO_URL = os.getenv("MONGO_URL", "")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "netshield")

mongo_client = MongoClient(MONGO_URL)
mongo_db = mongo_client[MONGO_DB_NAME]
traffic_collection = mongo_db["traffic_logs"]


def ensure_compatibility_columns():
    """Add columns introduced after the initial development schema."""
    inspector = inspect(engine)
    notification_columns = {
        column["name"] for column in inspector.get_columns("notifications")
    } if "notifications" in inspector.get_table_names() else set()

    if "user_id" not in notification_columns:
        with engine.begin() as connection:
            connection.execute(text(
                "ALTER TABLE notifications "
                "ADD COLUMN user_id INTEGER REFERENCES users(id)"
            ))
