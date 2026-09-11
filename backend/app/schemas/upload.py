from pydantic import BaseModel
from typing import Dict

class UploadResponse(BaseModel):
    dataset: str
    original_records: int
    processed_records: int
    average_confidence: float
    summary: Dict[str, int]