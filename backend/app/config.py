from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "NetShield API"
    
    # PostgreSQL Settings
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "Ankan"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "netshield"
    
    # MongoDB Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "netshield_logs"
    
    # JWT Settings
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return "sqlite:///./netshield.db"

    class Config:
        env_file = ".env"

settings = Settings()
