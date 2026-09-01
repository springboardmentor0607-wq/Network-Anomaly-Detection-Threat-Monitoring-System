import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class TrafficFlowResponse(BaseModel):
    id: uuid.UUID
    timestamp: datetime
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    packets: int
    bytes: int
    duration: float
    dataset_source: str
    metadata_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class TrafficFlowListResponse(BaseModel):
    items: List[TrafficFlowResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class TrafficStatsResponse(BaseModel):
    total_flows: int
    total_packets: int
    total_bytes: int
    avg_duration: float
    protocol_distribution: Dict[str, int]
    top_sources: List[Dict[str, Any]]
    top_destinations: List[Dict[str, Any]]

class DatasetUploadResponse(BaseModel):
    success: bool
    filename: str
    dataset_name: str
    total_rows_processed: int
    anomalies_detected: int
    message: str
