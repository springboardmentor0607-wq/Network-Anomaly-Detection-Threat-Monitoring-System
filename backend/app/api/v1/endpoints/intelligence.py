from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/intelligence", tags=["Threat Intelligence"])

MOCK_IOCS = [
    {
        "ip": "42.112.98.14",
        "category": "Botnet / C2 Node",
        "threat_actor": "APT-29 ShadowGroup",
        "reputation_score": 98,
        "confidence": 0.96,
        "first_seen": "2026-07-15T12:00:00Z",
        "last_seen": "2026-08-10T09:12:00Z",
        "observed_activity": "Active SYN Flooding, Credential Harvesting, Automated SSH Probe",
        "country": "US",
        "asn": "AS16509 Amazon.com",
        "related_alerts_count": 48
    },
    {
        "ip": "185.220.101.5",
        "category": "Tor Exit Relay",
        "threat_actor": "Unknown Scanner",
        "reputation_score": 88,
        "confidence": 0.91,
        "first_seen": "2026-06-01T08:30:00Z",
        "last_seen": "2026-08-10T08:45:00Z",
        "observed_activity": "Port Scan (TCP 22, 80, 443, 8080, 5432), Web Vulnerability Probing",
        "country": "DE",
        "asn": "AS200003 Tor Exit",
        "related_alerts_count": 32
    },
    {
        "ip": "194.26.29.112",
        "category": "Malware Host",
        "threat_actor": "FIN7 Ransomware Affiliate",
        "reputation_score": 92,
        "confidence": 0.94,
        "first_seen": "2026-08-01T10:15:00Z",
        "last_seen": "2026-08-10T07:20:00Z",
        "observed_activity": "Payload Delivery (`stage2.exe`), Command & Control Pingback",
        "country": "RU",
        "asn": "AS49505 HostProvider",
        "related_alerts_count": 19
    },
    {
        "ip": "103.251.140.2",
        "category": "Brute Force Source",
        "threat_actor": "Lazarus Subgroup",
        "reputation_score": 79,
        "confidence": 0.85,
        "first_seen": "2026-07-28T16:00:00Z",
        "last_seen": "2026-08-09T22:10:00Z",
        "observed_activity": "RDP Brute Force, Dictionary Password Attack",
        "country": "CN",
        "asn": "AS4134 China Telecom",
        "related_alerts_count": 14
    }
]

@router.get("/iocs", response_model=List[dict])
def list_iocs(
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if query:
        q = query.lower()
        return [ioc for ioc in MOCK_IOCS if q in ioc["ip"].lower() or q in ioc["category"].lower() or q in ioc["country"].lower()]
    return MOCK_IOCS

@router.get("/lookup/{ip}", response_model=dict)
def lookup_ip(ip: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for ioc in MOCK_IOCS:
        if ioc["ip"] == ip:
            return ioc
    return {
        "ip": ip,
        "category": "Clean / Unclassified",
        "threat_actor": "None Identified",
        "reputation_score": 10,
        "confidence": 0.70,
        "first_seen": "2026-08-10T00:00:00Z",
        "last_seen": "2026-08-10T09:00:00Z",
        "observed_activity": "Standard Traffic",
        "country": "Internal / Public DNS",
        "asn": "AS0 Local Network",
        "related_alerts_count": 0
    }
