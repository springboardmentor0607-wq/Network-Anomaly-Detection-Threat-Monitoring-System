from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IncidentNoteSchema(BaseModel):
    author: str = Field(default="Security Analyst")
    text: str = Field(..., min_length=1)
    timestamp: str


class IncidentCreate(BaseModel):
    alert_id: Optional[str] = Field(default=None, description="Optional associated alert_id")
    title: Optional[str] = Field(default=None, description="Incident title or description")
    assigned_analyst: Optional[str] = Field(default="Unassigned", description="Assigned analyst email or name")
    priority: Optional[str] = Field(default="High", description="Priority: Critical, High, Medium, Low")
    status: Optional[str] = Field(default="New", description="Status: New, In Progress, Under Investigation, Resolved, Closed")
    initial_note: Optional[str] = Field(default=None, description="Optional initial investigation note")


class IncidentUpdate(BaseModel):
    assigned_analyst: Optional[str] = Field(default=None, description="Assigned analyst email or name")
    priority: Optional[str] = Field(default=None, description="Priority: Critical, High, Medium, Low")
    status: Optional[str] = Field(default=None, description="Status: New, In Progress, Under Investigation, Resolved, Closed")


class IncidentNoteCreate(BaseModel):
    text: str = Field(..., min_length=1, description="Investigation note content")
    author: Optional[str] = Field(default=None, description="Author name or email")


class IncidentResponse(BaseModel):
    id: Optional[str] = Field(default=None, description="MongoDB Document ID")
    incident_id: str
    alert_id: Optional[str] = None
    title: str
    assigned_analyst: str
    priority: str
    status: str
    notes: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: str
    resolved_at: Optional[str] = None
