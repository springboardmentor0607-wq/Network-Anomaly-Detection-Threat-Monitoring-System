from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class IncidentCreateSchema(BaseModel):
    title: str
    description: str
    severity: str = "HIGH"
    alert_ids: Optional[List[str]] = []
    affected_systems: Optional[List[str]] = []
    assigned_analyst: Optional[str] = "SOC Analyst"

class IncidentUpdateSchema(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_analyst: Optional[str] = None
    resolution_notes: Optional[str] = None

MOCK_INCIDENTS = [
    {
        "id": "INC-2026-0891",
        "title": "Distributed Denial of Service (DDoS) Attack on Gateway",
        "description": "High volume SYN Flood originating from 42.112.98.14 targeting primary API gateway (192.168.1.100). Bandwidth spike exceeded 8.4 Gbps.",
        "severity": "CRITICAL",
        "status": "INVESTIGATING",
        "related_alerts": ["ALT-8921", "ALT-8922"],
        "affected_systems": ["API Gateway", "Auth Service"],
        "assigned_analyst": "Sarah Connor (SOC Lead)",
        "created_at": "2026-08-10T08:15:00Z",
        "updated_at": "2026-08-10T09:30:00Z",
        "resolution_notes": "Rate-limiting rules applied at cloud edge. BGP blackholing initiated for malicious range."
    },
    {
        "id": "INC-2026-0890",
        "title": "Credential Dumping via SSH Brute Force",
        "description": "Multiple failed SSH authentication attempts detected on database cluster server (192.168.1.250). Total 1,420 attempts within 5 minutes.",
        "severity": "HIGH",
        "status": "CONTAINED",
        "related_alerts": ["ALT-8915"],
        "affected_systems": ["PostgreSQL DB Cluster"],
        "assigned_analyst": "Alex Mercer",
        "created_at": "2026-08-10T06:45:00Z",
        "updated_at": "2026-08-10T08:10:00Z",
        "resolution_notes": "Source IP 185.220.101.5 blocked via iptables. Fail2ban jail triggered permanently."
    },
    {
        "id": "INC-2026-0889",
        "title": "DNS Tunneling Anomaly Detected",
        "description": "Exfiltration pattern identified via encoded DNS query payloads to unmapped TLD domain `ns1.mal-tunnel.cx`.",
        "severity": "MEDIUM",
        "status": "OPEN",
        "related_alerts": ["ALT-8902"],
        "affected_systems": ["Workstation WS-SEC-04"],
        "assigned_analyst": "Unassigned",
        "created_at": "2026-08-10T04:20:00Z",
        "updated_at": "2026-08-10T04:20:00Z",
        "resolution_notes": ""
    }
]

@router.get("", response_model=List[dict])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filtered = MOCK_INCIDENTS
    if status and status.upper() != "ALL":
        filtered = [inc for inc in filtered if inc["status"] == status.upper()]
    if severity and severity.upper() != "ALL":
        filtered = [inc for inc in filtered if inc["severity"] == severity.upper()]
    return filtered

@router.get("/{incident_id}", response_model=dict)
def get_incident(incident_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for inc in MOCK_INCIDENTS:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_id = f"INC-2026-{len(MOCK_INCIDENTS) + 892}"
    now = datetime.utcnow().isoformat() + "Z"
    new_inc = {
        "id": new_id,
        "title": payload.title,
        "description": payload.description,
        "severity": payload.severity.upper(),
        "status": "OPEN",
        "related_alerts": payload.alert_ids or [],
        "affected_systems": payload.affected_systems or ["General Network"],
        "assigned_analyst": payload.assigned_analyst or getattr(current_user, "email", "SOC Analyst"),
        "created_at": now,
        "updated_at": now,
        "resolution_notes": ""
    }
    MOCK_INCIDENTS.insert(0, new_inc)
    return new_inc

@router.patch("/{incident_id}", response_model=dict)
def update_incident(incident_id: str, payload: IncidentUpdateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for inc in MOCK_INCIDENTS:
        if inc["id"] == incident_id:
            if payload.status:
                inc["status"] = payload.status.upper()
            if payload.severity:
                inc["severity"] = payload.severity.upper()
            if payload.assigned_analyst:
                inc["assigned_analyst"] = payload.assigned_analyst
            if payload.resolution_notes is not None:
                inc["resolution_notes"] = payload.resolution_notes
            inc["updated_at"] = datetime.utcnow().isoformat() + "Z"
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")
