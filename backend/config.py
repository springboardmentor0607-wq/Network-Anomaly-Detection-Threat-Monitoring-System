import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

class Config:
    # Relational Database (PostgreSQL is the active primary engine)
    DB_ENGINE = os.getenv('DB_ENGINE', 'postgresql')
    DB_HOST = os.getenv('POSTGRES_HOST', os.getenv('DB_HOST', '127.0.0.1'))
    DB_PORT = int(os.getenv('POSTGRES_PORT', os.getenv('DB_PORT', 5432)))
    DB_USER = os.getenv('POSTGRES_USER', os.getenv('DB_USER', 'postgres'))
    DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', os.getenv('DB_PASSWORD', 'postgres'))
    DB_NAME = os.getenv('POSTGRES_DB', os.getenv('DB_NAME', 'netshield_ai'))
    
    # Document Database (MongoDB for detailed telemetry events, raw PCAP/Zeek, and threat intel cache)
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'netshield_ai')
    
    # JWT Security Configuration
    JWT_SECRET = os.getenv('JWT_SECRET', 'netshield_super_secret_jwt_key_2026_safe')
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    PORT = int(os.getenv('PORT', 5000))
    
    # Threat Intelligence API Configuration
    THREAT_INTEL_ENABLED = os.getenv('THREAT_INTEL_ENABLED', 'true').lower() in ('true', '1', 'yes')
    THREAT_INTEL_PROVIDER = os.getenv('THREAT_INTEL_PROVIDER', 'AbuseIPDB')  # AbuseIPDB, VirusTotal, AlienVault_OTX
    THREAT_INTEL_API_KEY = os.getenv('THREAT_INTEL_API_KEY', '')
    THREAT_INTEL_API_URL = os.getenv('THREAT_INTEL_API_URL', 'https://api.abuseipdb.com/api/v2/check')
    
    # Generic SIEM Webhook Integration
    SIEM_ENABLED = os.getenv('SIEM_ENABLED', 'false').lower() in ('true', '1', 'yes')
    SIEM_WEBHOOK_URL = os.getenv('SIEM_WEBHOOK_URL', '')
    SIEM_FORMAT = os.getenv('SIEM_FORMAT', 'JSON')  # JSON, CEF, Syslog
    
    # Directory paths
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    REPORTS_FOLDER = os.path.join(BASE_DIR, 'reports')
    MODELS_FOLDER = os.path.join(BASE_DIR, 'models')
    LOGS_FOLDER = os.path.join(BASE_DIR, 'logs')

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.REPORTS_FOLDER, exist_ok=True)
os.makedirs(Config.MODELS_FOLDER, exist_ok=True)
os.makedirs(Config.LOGS_FOLDER, exist_ok=True)
