import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR.parent
DATASETS_PROCESSED_DIR = BACKEND_DIR / "datasets" / "processed"

SAVED_MODELS_DIR = BASE_DIR / "saved_models"
REPORTS_DIR = BASE_DIR / "reports"
LOGS_DIR = BACKEND_DIR / "logs"

SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Risk score mappings (0-100 score + risk level)
RISK_SCORE_MAPPING = {
    "Normal": {"score": 5, "severity": "LOW"},
    "BENIGN": {"score": 5, "severity": "LOW"},
    "DoS": {"score": 80, "severity": "HIGH"},
    "DoS Hulk": {"score": 82, "severity": "HIGH"},
    "DoS GoldenEye": {"score": 85, "severity": "HIGH"},
    "DoS slowloris": {"score": 78, "severity": "HIGH"},
    "DDoS": {"score": 100, "severity": "CRITICAL"},
    "Botnet": {"score": 95, "severity": "CRITICAL"},
    "Bot": {"score": 92, "severity": "CRITICAL"},
    "Brute Force": {"score": 75, "severity": "HIGH"},
    "FTP-Patator": {"score": 75, "severity": "HIGH"},
    "SSH-Patator": {"score": 77, "severity": "HIGH"},
    "Port Scan": {"score": 60, "severity": "MEDIUM"},
    "PortScan": {"score": 60, "severity": "MEDIUM"},
    "Web Attack": {"score": 70, "severity": "HIGH"},
    "Infiltration": {"score": 90, "severity": "CRITICAL"},
    "Exploits": {"score": 85, "severity": "HIGH"},
    "Fuzzers": {"score": 65, "severity": "MEDIUM"},
    "Generic": {"score": 50, "severity": "MEDIUM"},
    "Reconnaissance": {"score": 55, "severity": "MEDIUM"},
    "Analysis": {"score": 45, "severity": "MEDIUM"},
    "Backdoor": {"score": 95, "severity": "CRITICAL"},
    "Shellcode": {"score": 98, "severity": "CRITICAL"},
    "Worms": {"score": 99, "severity": "CRITICAL"},
    "Heartbleed": {"score": 100, "severity": "CRITICAL"},
    "Unknown": {"score": 50, "severity": "MEDIUM"}
}

ATTACK_CLASSES = [
    "Normal",
    "DoS",
    "DDoS",
    "Botnet",
    "Port Scan",
    "Brute Force",
    "Web Attack",
    "Infiltration",
    "Heartbleed",
    "Unknown"
]

TARGET_ACCURACY = float(os.getenv('TARGET_ACCURACY', '0.97'))
