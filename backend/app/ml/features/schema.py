from typing import List
from pydantic import BaseModel

class FeatureSchema(BaseModel):
    version: str = "1.0.0"
    dataset_name: str
    numeric_features: List[str]
    categorical_features: List[str]
    target_column: str

# CIC-IDS-2017 Feature Schema Definition
CICIDS2017_FEATURE_SCHEMA = FeatureSchema(
    version="1.0.0",
    dataset_name="CICIDS2017",
    numeric_features=[
        "Destination Port",
        "Flow Duration",
        "Total Fwd Packets",
        "Total Backward Packets",
        "Total Length of Fwd Packets",
        "Total Length of Bwd Packets",
        "Flow Bytes/s",
        "Flow Packets/s",
        "Average Packet Size"
    ],
    categorical_features=["Protocol"],
    target_column="Label"
)

# UNSW-NB15 Feature Schema Definition
UNSWNB15_FEATURE_SCHEMA = FeatureSchema(
    version="1.0.0",
    dataset_name="UNSW-NB15",
    numeric_features=[
        "dur",
        "spkts",
        "dpkts",
        "sbytes",
        "dbytes",
        "rate",
        "sload",
        "dload",
        "smean",
        "dmean"
    ],
    categorical_features=["proto", "state"],
    target_column="label"
)
