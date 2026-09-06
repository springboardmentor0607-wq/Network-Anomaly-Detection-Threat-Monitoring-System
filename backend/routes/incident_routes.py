from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from database import fetch_all, fetch_one, execute_query
from auth import get_optional_user

incident_router = APIRouter(tags=['Incidents'])
incident_bp = incident_router

class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = ''
    priority: Optional[str] = 'HIGH'
    assigned_to: Optional[int] = None
    alert_id: Optional[int] = None

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    resolution: Optional[str] = None
    assigned_to: Optional[int] = None

@incident_router.get('/incidents')
async def get_incidents(current_user: Optional[dict] = Depends(get_optional_user)):
    incidents = fetch_all("""
        SELECT i.id, i.alert_id, i.title, i.description, i.priority, i.assigned_to, i.status, i.resolution, i.created_at, i.updated_at,
               COALESCE(u.name, 'Security Analyst') AS assigned_analyst_name
        FROM incidents i
        LEFT JOIN users u ON i.assigned_to = u.id
        ORDER BY i.created_at DESC
        LIMIT 100
    """)
    return {'incidents': incidents or []}

@incident_router.post('/incidents')
async def create_incident(req: IncidentCreate, current_user: Optional[dict] = Depends(get_optional_user)):
    inc_id = execute_query(
        """INSERT INTO incidents (alert_id, title, description, priority, assigned_to, status)
           VALUES (%s, %s, %s, %s, %s, 'OPEN') RETURNING id""",
        (req.alert_id, req.title, req.description, req.priority, req.assigned_to)
    )
    return {'message': 'Incident created successfully', 'incident_id': inc_id}

@incident_router.put('/incidents/{incident_id}')
async def update_incident(incident_id: int, req: IncidentUpdate, current_user: Optional[dict] = Depends(get_optional_user)):
    if req.status:
        execute_query("UPDATE incidents SET status = %s, updated_at = NOW() WHERE id = %s", (req.status, incident_id))
    if req.resolution:
        execute_query("UPDATE incidents SET resolution = %s, updated_at = NOW() WHERE id = %s", (req.resolution, incident_id))
    if req.assigned_to is not None:
        execute_query("UPDATE incidents SET assigned_to = %s, updated_at = NOW() WHERE id = %s", (req.assigned_to, incident_id))
    return {'message': f'Incident #{incident_id} updated successfully.'}
