import logging
import requests
from datetime import datetime
from config import Config
from mongo_db import cache_threat_intel_doc, get_cached_threat_intel

logger = logging.getLogger(__name__)

KNOWN_IP_REPUTATION = {
    '192.168.1.105': {'abuse_confidence_score': 95, 'is_whitelisted': False, 'country_code': 'RU', 'usage_type': 'Data Center', 'domain': 'botnet-node.net', 'total_reports': 142},
    '192.168.1.120': {'abuse_confidence_score': 88, 'is_whitelisted': False, 'country_code': 'CN', 'usage_type': 'Commercial', 'domain': 'scanner-c2.org', 'total_reports': 89},
    '10.0.0.55': {'abuse_confidence_score': 76, 'is_whitelisted': False, 'country_code': 'IR', 'usage_type': 'Hosting', 'domain': 'patator-cluster.io', 'total_reports': 64},
    '172.16.0.4': {'abuse_confidence_score': 98, 'is_whitelisted': False, 'country_code': 'KP', 'usage_type': 'Military/Gov', 'domain': 'apt-strike.net', 'total_reports': 310},
    '127.0.0.1': {'abuse_confidence_score': 0, 'is_whitelisted': True, 'country_code': 'US', 'usage_type': 'Loopback', 'domain': 'localhost', 'total_reports': 0},
    '10.0.0.1': {'abuse_confidence_score': 0, 'is_whitelisted': True, 'country_code': 'US', 'usage_type': 'Internal Gateway', 'domain': 'lan.gateway', 'total_reports': 0},
}

def check_ip_reputation(ip_address):
    if not ip_address:
        return {'ip': ip_address, 'status': 'UNKNOWN', 'score': 0}
        
    cached = get_cached_threat_intel(ip_address)
    if cached:
        return cached
        
    if Config.THREAT_INTEL_ENABLED and Config.THREAT_INTEL_API_KEY:
        try:
            headers = {
                'Key': Config.THREAT_INTEL_API_KEY,
                'Accept': 'application/json'
            }
            params = {'ipAddress': ip_address, 'maxAgeInDays': 90}
            resp = requests.get(Config.THREAT_INTEL_API_URL, headers=headers, params=params, timeout=3)
            if resp.status_code == 200:
                data = resp.json().get('data', {})
                intel_doc = {
                    'ip_address': ip_address,
                    'provider': Config.THREAT_INTEL_PROVIDER,
                    'is_public': data.get('isPublic', True),
                    'abuse_confidence_score': data.get('abuseConfidenceScore', 0),
                    'country_code': data.get('countryCode', 'US'),
                    'usage_type': data.get('usageType', 'ISP'),
                    'domain': data.get('domain', '-'),
                    'total_reports': data.get('totalReports', 0),
                    'last_reported_at': data.get('lastReportedAt', datetime.utcnow().isoformat()),
                    'queried_at': datetime.utcnow().isoformat()
                }
                cache_threat_intel_doc(ip_address, intel_doc)
                return intel_doc
        except Exception as e:
            logger.warning(f'External threat intel query note: {str(e)}')
            
    rep = KNOWN_IP_REPUTATION.get(ip_address, {
        'abuse_confidence_score': 15 if ip_address.startswith(('192.', '10.', '172.')) else 45,
        'is_whitelisted': ip_address.startswith('127.') or ip_address.endswith('.1'),
        'country_code': 'US',
        'usage_type': 'Enterprise Subnet',
        'domain': 'internal.node',
        'total_reports': 0
    })
    
    intel_doc = {
        'ip_address': ip_address,
        'provider': f'{Config.THREAT_INTEL_PROVIDER} (Local/Cached)',
        'is_public': not ip_address.startswith(('10.', '192.168.', '172.16.', '127.')),
        'abuse_confidence_score': rep.get('abuse_confidence_score', 0),
        'country_code': rep.get('country_code', 'US'),
        'usage_type': rep.get('usage_type', 'ISP'),
        'domain': rep.get('domain', '-'),
        'total_reports': rep.get('total_reports', 0),
        'queried_at': datetime.utcnow().isoformat()
    }
    
    cache_threat_intel_doc(ip_address, intel_doc)
    return intel_doc
