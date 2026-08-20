from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# --- PostgreSQL Setup ---
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MongoDB Setup ---
motor_client = AsyncIOMotorClient(settings.MONGODB_URL)
mongo_db = motor_client[settings.MONGODB_DB]

def get_mongo():
    return mongo_db
