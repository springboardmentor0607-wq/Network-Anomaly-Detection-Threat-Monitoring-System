from typing import Any, Optional
from pydantic import BaseModel, Field, model_validator


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
    source: Optional[str] = Field(default="Dataset", description="Alert source (usually 'Dataset')")
    source_ip: Optional[str] = Field(default="192.168.1.100", description="Source IP address")
    destination_ip: Optional[str] = Field(default="10.0.0.1", description="Destination IP address")
    src_port: Optional[int] = Field(default=None, description="Source port")
    dst_port: Optional[int] = Field(default=None, description="Destination port")
    protocol: Optional[str] = Field(default="TCP", description="Protocol")
    attack_type: Optional[str] = Field(default="Attack", description="Detected attack type")
    prediction: Optional[str] = Field(default="Attack", description="Prediction label")
    confidence: Optional[float] = Field(default=0.85, description="Confidence score")
    risk_score: Optional[int] = Field(default=75, description="Risk score")
    severity: Optional[str] = Field(default="High", description="Severity")
    timestamp: Optional[str] = Field(default=None, description="Timestamp")

    @model_validator(mode="before")
    @classmethod
    def sanitize_dataset_payload(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        if not values.get("source_ip"):
            values["source_ip"] = "192.168.1.100"

        if not values.get("destination_ip"):
            values["destination_ip"] = "10.0.0.1"

        if not values.get("attack_type"):
            values["attack_type"] = (
                values.get("traffic_label")
                or values.get("prediction")
                or "Attack"
            )

        conf = values.get("confidence")
        if conf is not None:
            try:
                conf_str = str(conf).replace("%", "").strip()
                c_val = float(conf_str)
                if c_val > 1.0 and c_val <= 100.0:
                    c_val = c_val / 100.0
                values["confidence"] = max(0.0, min(1.0, c_val))
            except Exception:
                values["confidence"] = 0.85
        else:
            values["confidence"] = 0.85

        risk = values.get("risk_score")
        if risk is not None:
            try:
                r_val = int(round(float(risk)))
                values["risk_score"] = max(0, min(100, r_val))
            except Exception:
                values["risk_score"] = 75
        else:
            values["risk_score"] = 75

        if not values.get("protocol"):
            values["protocol"] = "TCP"

        if values.get("src_port") is None and values.get("source_port") is None:
            values["src_port"] = 80
        if values.get("dst_port") is None and values.get("destination_port") is None:
            values["dst_port"] = 80

        if not values.get("prediction"):
            values["prediction"] = "Attack"

        if not values.get("severity"):
            values["severity"] = values.get("threat_level") or "High"

        return values


class AlertAcknowledge(BaseModel):
    assigned_to: Optional[str] = Field(default=None, description="Email/Name of user acknowledging the alert")


class AlertResolve(BaseModel):
    assigned_to: Optional[str] = Field(default=None, description="Email/Name of user resolving the alert")
    resolution_note: Optional[str] = Field(default=None, description="Optional resolution notes")


class AlertResponse(BaseModel):
    id: Optional[str] = Field(default=None, description="MongoDB Document ID")
    alert_id: Optional[str] = Field(default="ALT-UNKNOWN", description="Alert ID")
    timestamp: Optional[str] = Field(default="", description="ISO timestamp")
    created_at: Optional[str] = Field(default=None, description="ISO creation timestamp")
    source_ip: Optional[str] = Field(default="192.168.1.100", description="Source IP")
    destination_ip: Optional[str] = Field(default="10.0.0.1", description="Destination IP")
    source_port: Optional[int] = Field(default=None, description="Source Port")
    destination_port: Optional[int] = Field(default=None, description="Destination Port")
    protocol: Optional[str] = Field(default="TCP", description="Protocol")
    attack_type: Optional[str] = Field(default="Attack", description="Attack type")
    confidence: Optional[float] = Field(default=0.85, description="Confidence score")
    risk_score: Optional[int] = Field(default=50, description="Risk score")
    severity: Optional[str] = Field(default="Medium", description="Severity level")
    status: Optional[str] = Field(default="Open", description="Alert status")
    assigned_to: Optional[str] = None
    source: Optional[str] = Field(default="Live Network", description="Alert source")
    detection_details: Optional[dict] = None

