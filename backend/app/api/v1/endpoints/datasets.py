from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/datasets", tags=["Datasets"])

MOCK_DATASETS = [
    {
        "id": "ds-cicids2017",
        "name": "CICIDS2017 Benchmark Dataset",
        "description": "Canadian Institute for Cybersecurity Intrusion Detection Dataset containing benign and up-to-date common attacks (DoS, DDoS, Brute Force, XSS, SQLi, Infiltration, PortScan, Botnet).",
        "record_count": 2830743,
        "feature_count": 78,
        "size_mb": 420.5,
        "train_samples": 2264594,
        "test_samples": 566149,
        "preprocessing_status": "READY",
        "labels": ["BENIGN", "DoS Hulk", "PortScan", "DDoS", "DoS GoldenEye", "FTP-Patator", "SSH-Patator", "DoS slowloris", "Bot", "Web Attack"],
        "schema_sample": [
            {"name": "Destination Port", "type": "int64", "description": "Port number of target server"},
            {"name": "Flow Duration", "type": "int64", "description": "Microseconds of connection duration"},
            {"name": "Total Fwd Packets", "type": "int64", "description": "Count of forwarded packets"},
            {"name": "Total Backward Packets", "type": "int64", "description": "Count of backward packets"},
            {"name": "Flow Bytes/s", "type": "float64", "description": "Transmission rate in bytes per second"},
            {"name": "Flow Packets/s", "type": "float64", "description": "Transmission rate in packets per second"},
            {"name": "Label", "type": "string", "description": "Ground truth attack classification"}
        ]
    },
    {
        "id": "ds-unsw-nb15",
        "name": "UNSW-NB15 Cybersecurity Dataset",
        "description": "Created by the IXIA PerfectStorm tool in the Cyber Range Lab of UNSW Canberra for generating a hybrid of real modern normal activities and synthetic contemporary attack behaviors.",
        "record_count": 2540044,
        "feature_count": 49,
        "size_mb": 280.0,
        "train_samples": 175341,
        "test_samples": 82332,
        "preprocessing_status": "READY",
        "labels": ["Normal", "Generic", "Exploits", "Fuzzers", "DoS", "Reconnaissance", "Analysis", "Backdoor", "Shellcode", "Worms"],
        "schema_sample": [
            {"name": "dur", "type": "float64", "description": "Record total duration"},
            {"name": "proto", "type": "string", "description": "Transaction protocol (tcp, udp, icmp, etc)"},
            {"name": "service", "type": "string", "description": "http, dns, ftp, ssh, etc"},
            {"name": "spkts", "type": "int64", "description": "Source to destination packet count"},
            {"name": "dpkts", "type": "int64", "description": "Destination to source packet count"},
            {"name": "sbytes", "type": "int64", "description": "Source to destination transaction bytes"},
            {"name": "attack_cat", "type": "string", "description": "Specific attack category name"}
        ]
    }
]

@router.get("", response_model=List[dict])
def list_datasets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return MOCK_DATASETS

@router.get("/{dataset_id}", response_model=dict)
def get_dataset(dataset_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for ds in MOCK_DATASETS:
        if ds["id"] == dataset_id:
            return ds
    return MOCK_DATASETS[0]
