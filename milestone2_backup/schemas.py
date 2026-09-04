from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    department: Optional[str] = "SOC Operations"
    employee_id: Optional[str] = None
    role: str = "Security Analyst"
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TrafficInput(BaseModel):
    duration: float = 0.0
    protocol_type: str = "tcp"
    service: str = "http"
    flag: str = "SF"
    src_bytes: float = 181.0
    dst_bytes: float = 5450.0
    land: int = 0
    wrong_fragment: int = 0
    urgent: int = 0
    hot: int = 0
    num_failed_logins: int = 0
    logged_in: int = 1
    num_compromised: int = 0
    root_shell: int = 0
    su_attempted: int = 0
    num_root: int = 0
    num_file_creations: int = 0
    num_shells: int = 0
    num_access_files: int = 0
    num_outbound_cmds: int = 0
    is_host_login: int = 0
    is_guest_login: int = 0

class PredictionResponse(BaseModel):
    predicted_class: str
    confidence: float
    anomaly_score: float
    risk_score: float
    severity: str
    recommended_action: str
    prediction_time: str
    model_used: str
    model_version: str

class TrainRequest(BaseModel):
    algorithm: str = "Random Forest Classifier"
    dataset: str = "NSL-KDD"