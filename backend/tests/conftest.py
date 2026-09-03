# tests/conftest.py — Shared pytest fixtures for NetShield API tests

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure the backend app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app


@pytest.fixture(scope="module")
def client():
    """FastAPI test client — module-scoped for speed."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def cicids_sample_features():
    """
    A realistic sample of CICIDS2017 feature values for a BENIGN flow.
    Feature names match those in feature_names.joblib.
    """
    return {
        "Destination Port": 80,
        "Flow Duration": 1000000,
        "Total Fwd Packets": 5,
        "Total Backward Packets": 4,
        "Total Length of Fwd Packets": 500,
        "Total Length of Bwd Packets": 300,
        "Fwd Packet Length Max": 200,
        "Fwd Packet Length Min": 40,
        "Fwd Packet Length Mean": 100.0,
        "Fwd Packet Length Std": 50.0,
        "Bwd Packet Length Max": 150,
        "Bwd Packet Length Min": 20,
        "Bwd Packet Length Mean": 75.0,
        "Bwd Packet Length Std": 40.0,
        "Flow Bytes/s": 800.0,
        "Flow Packets/s": 9.0,
        "Flow IAT Mean": 100000.0,
        "Flow IAT Std": 50000.0,
        "Flow IAT Max": 200000.0,
        "Flow IAT Min": 10000.0,
        "Fwd IAT Total": 400000.0,
        "Fwd IAT Mean": 100000.0,
        "Fwd IAT Std": 50000.0,
        "Fwd IAT Max": 200000.0,
        "Fwd IAT Min": 10000.0,
        "Bwd IAT Total": 300000.0,
        "Bwd IAT Mean": 100000.0,
        "Bwd IAT Std": 50000.0,
        "Bwd IAT Max": 200000.0,
        "Bwd IAT Min": 10000.0,
        "Fwd PSH Flags": 0,
        "Bwd PSH Flags": 0,
        "Fwd URG Flags": 0,
        "Bwd URG Flags": 0,
        "Fwd Header Length": 60,
        "Bwd Header Length": 48,
        "Fwd Packets/s": 5.0,
        "Bwd Packets/s": 4.0,
        "Min Packet Length": 20,
        "Max Packet Length": 200,
        "Packet Length Mean": 88.0,
        "Packet Length Std": 50.0,
        "Packet Length Variance": 2500.0,
        "FIN Flag Count": 1,
        "SYN Flag Count": 1,
        "RST Flag Count": 0,
        "PSH Flag Count": 2,
        "ACK Flag Count": 5,
        "URG Flag Count": 0,
        "CWE Flag Count": 0,
        "ECE Flag Count": 0,
        "Down/Up Ratio": 0.8,
        "Average Packet Size": 88.0,
        "Avg Fwd Segment Size": 100.0,
        "Avg Bwd Segment Size": 75.0,
        "Fwd Header Length.1": 60,
        "Fwd Avg Bytes/Bulk": 0,
        "Fwd Avg Packets/Bulk": 0,
        "Fwd Avg Bulk Rate": 0,
        "Bwd Avg Bytes/Bulk": 0,
        "Bwd Avg Packets/Bulk": 0,
        "Bwd Avg Bulk Rate": 0,
        "Subflow Fwd Packets": 5,
        "Subflow Fwd Bytes": 500,
        "Subflow Bwd Packets": 4,
        "Subflow Bwd Bytes": 300,
        "Init_Win_bytes_forward": 65535,
        "Init_Win_bytes_backward": 65535,
        "act_data_pkt_fwd": 4,
        "min_seg_size_forward": 20,
        "Active Mean": 100000.0,
        "Active Std": 50000.0,
        "Active Max": 200000.0,
        "Active Min": 10000.0,
        "Idle Mean": 50000.0,
        "Idle Std": 25000.0,
        "Idle Max": 100000.0,
        "Idle Min": 5000.0
    }


@pytest.fixture(scope="module")
def attack_sample_features():
    """
    Simulated DDoS-like feature pattern (very high packet rate, large flow).
    Used to test that the model detects anomalous flows.
    """
    return {
        "Destination Port": 80,
        "Flow Duration": 100,
        "Total Fwd Packets": 9000,
        "Total Backward Packets": 1,
        "Total Length of Fwd Packets": 900000,
        "Total Length of Bwd Packets": 10,
        "Flow Bytes/s": 9000000.0,
        "Flow Packets/s": 90000.0,
        "Fwd Packets/s": 90000.0,
        "Bwd Packets/s": 0.01,
        "SYN Flag Count": 9000,
        "ACK Flag Count": 0,
        "FIN Flag Count": 0,
        "RST Flag Count": 0,
        "PSH Flag Count": 0,
        "URG Flag Count": 0,
        "Init_Win_bytes_forward": 0,
        "Init_Win_bytes_backward": 0,
    }
