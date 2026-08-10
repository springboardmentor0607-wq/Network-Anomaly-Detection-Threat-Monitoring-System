from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

class NormalizedFlow(BaseModel):
    timestamp: datetime
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    packets: int
    bytes: int
    duration: float
    attack_category: str = "BENIGN"
    is_anomalous: bool = False
    raw_features: Dict[str, Any] = {}

class BaseDatasetAdapter(ABC):
    @abstractmethod
    def get_dataset_name(self) -> str:
        pass

    @abstractmethod
    def validate_schema(self, columns: List[str]) -> bool:
        pass

    @abstractmethod
    def normalize_row(self, row: Dict[str, Any]) -> NormalizedFlow:
        pass

    @abstractmethod
    def process_dataframe(self, df: Any) -> List[NormalizedFlow]:
        pass
