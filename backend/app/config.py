import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "NetShield AI Backend"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000

    # Live Capture Settings
    NETSHIELD_CAPTURE_INTERFACE: str = "4"
    NETSHIELD_TSHARK_PATH: str = r"E:\Wireshark\tshark.exe"
    
    # CORS Origins (JSON list or comma separated)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # React default Vite port
        "http://localhost:5174",  # React alternate Vite port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ]

    # MongoDB Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "netshield_db"

    # JWT Settings (Ready for JWT authentication)
    JWT_SECRET_KEY: str = "placeholder_super_secret_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Load configuration from environment file (.env)
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore" # Ignore extra env vars loaded by system
    )

settings = Settings()
