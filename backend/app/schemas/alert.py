from typing import Optional
from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    source_ip: str = Field(default="192.168.1.100", description="Source IP address")
    destination_ip: str = Field(default="10.0.0.1", description="Destination IP address")
    attack_type: str = Field(..., description="Detected attack type e.g. DDoS, DoS, Malware")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Confidence score")
    risk_score: Optional[int] = Field(default=None, ge=0, le=100, description="Risk score (0-100)")
    severity: Optional[str] = Field(default=None, description="Severity level: Critical, High, Medium, Low, Safe")
    status: Optional[str] = Field(default="Open", description="Alert status: Open, Acknowledged, Resolved")
    assigned_to: Optional[str] = Field(default=None, description="Assigned user email or name")
    source: Optional[str] = Field(default="Live Network", description="Alert source")


class AlertFromDataset(BaseModel):
    source: str = Field(default="Dataset", description="Alert source (usually 'Dataset')")
    source_ip: str = Field(default="192.168.1.100", description="Source IP address")
    destination_ip: str = Field(default="10.0.0.1", description="Destination IP address")
    src_port: Optional[int] = Field(default=None, description="Source port")
    dst_port: Optional[int] = Field(default=None, description="Destination port")
    protocol: Optional[str] = Field(default="TCP", description="Protocol")
    attack_type: str = Field(..., description="Detected attack type")
    prediction: str = Field(default="Attack", description="Prediction label")
    confidence: float = Field(default=0.85, ge=0.0, le=100.0, description="Confidence score")
    risk_score: Optional[int] = Field(default=None, ge=0, le=100, description="Risk score")
    severity: Optional[str] = Field(default=None, description="Severity")
    timestamp: Optional[str] = Field(default=None, description="Timestamp")


class AlertAcknowledge(BaseModel):
    assigned_to: Optional[str] = Field(default=None, description="Email/Name of user acknowledging the alert")


class AlertResolve(BaseModel):
    assigned_to: Optional[str] = Field(default=None, description="Email/Name of user resolving the alert")
    resolution_note: Optional[str] = Field(default=None, description="Optional resolution notes")


class AlertResponse(BaseModel):
    id: Optional[str] = Field(default=None, description="MongoDB Document ID")
    alert_id: Optional[str] = Field(default="ALT-UNKNOWN", description="Alert ID")
    timestamp: Optional[str] = Field(default="", description="ISO timestamp")
    source_ip: Optional[str] = Field(default="192.168.1.100", description="Source IP")
    destination_ip: Optional[str] = Field(default="10.0.0.1", description="Destination IP")
    attack_type: Optional[str] = Field(default="Attack", description="Attack type")
    confidence: Optional[float] = Field(default=0.85, description="Confidence score")
    risk_score: Optional[int] = Field(default=50, description="Risk score")
    severity: Optional[str] = Field(default="Medium", description="Severity level")
    status: Optional[str] = Field(default="Open", description="Alert status")
    assigned_to: Optional[str] = None
    source: Optional[str] = Field(default="Live Network", description="Alert source")
