from datetime import datetime
from fastapi import APIRouter
from config import Config
from database import check_db_connection
from mongo_db import check_mongo_connection
from services.siem_service import get_siem_status, dispatch_siem_event

system_router = APIRouter(tags=['System Telemetry & Integrations'])
system_bp = system_router

@system_router.get('/health')
async def health_check():
    return {
        'status': 'HEALTHY',
        'backend': 'FastAPI',
        'postgresql': 'CONNECTED' if check_db_connection() else 'STANDBY',
        'mongodb': 'CONNECTED' if check_mongo_connection() else 'STANDBY',
        'timestamp': datetime.now().isoformat()
    }

@system_router.get('/system-info')
async def get_system_info():
    return {
        'name': 'NetShield AI',
        'version': '4.2-FastAPI-Production',
        'architecture': 'Multi-Tiered FastAPI + PostgreSQL + MongoDB',
        'ml_engine': 'Random Forest Classifier (Production Model)',
        'threat_intel': Config.THREAT_INTEL_PROVIDER,
        'siem_integration': get_siem_status()
    }

@system_router.get('/siem/status')
async def siem_status():
    return get_siem_status()

@system_router.post('/siem/test')
async def test_siem():
    success = dispatch_siem_event('TEST_ALERT', {
        'message': 'NetShield AI SIEM connectivity self-test event',
        'test_timestamp': datetime.now().isoformat()
    })
    return {'status': 'DISPATCHED' if success else 'DISABLED_OR_FAILED', 'siem_config': get_siem_status()}
