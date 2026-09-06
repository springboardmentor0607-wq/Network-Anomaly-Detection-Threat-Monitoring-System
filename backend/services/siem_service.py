import logging
import json
import requests
from datetime import datetime
from config import Config

logger = logging.getLogger(__name__)

def dispatch_siem_event(event_type, event_payload):
    if not Config.SIEM_ENABLED or not Config.SIEM_WEBHOOK_URL:
        return False
        
    siem_doc = {
        'timestamp': datetime.utcnow().isoformat(),
        'source': 'NetShield_AI_SOC',
        'format': Config.SIEM_FORMAT,
        'event_type': event_type,
        'payload': event_payload
    }
    
    try:
        resp = requests.post(
            Config.SIEM_WEBHOOK_URL,
            json=siem_doc,
            headers={'Content-Type': 'application/json'},
            timeout=3
        )
        logger.info(f'Dispatched SIEM event {event_type} to webhook: Status {resp.status_code}')
        return resp.status_code in (200, 201, 202, 204)
    except Exception as e:
        logger.warning(f'Failed to dispatch SIEM webhook event: {str(e)}')
        return False

def get_siem_status():
    return {
        'enabled': Config.SIEM_ENABLED,
        'webhook_configured': bool(Config.SIEM_WEBHOOK_URL),
        'format': Config.SIEM_FORMAT,
        'target_endpoint': Config.SIEM_WEBHOOK_URL if Config.SIEM_WEBHOOK_URL else 'Not Configured (Standalone Mode)'
    }
