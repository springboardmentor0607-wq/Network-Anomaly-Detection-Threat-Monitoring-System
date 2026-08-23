import os
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "raw"
CICIDS_DIR = RAW_DIR / "CICIDS2017"
UNSW_DIR = RAW_DIR / "UNSW-NB15"

def check_dataset_status():
    status = {
        "CICIDS2017": {
            "present": False,
            "path": str(CICIDS_DIR),
            "files": [],
            "message": ""
        },
        "UNSW-NB15": {
            "present": False,
            "path": str(UNSW_DIR),
            "files": [],
            "message": ""
        }
    }

    # Check CICIDS2017
    if CICIDS_DIR.exists():
        files = [f.name for f in CICIDS_DIR.glob("*.csv")]
        status["CICIDS2017"]["files"] = files
        if files:
            status["CICIDS2017"]["present"] = True
            status["CICIDS2017"]["message"] = f"Found {len(files)} CSV file(s) in CICIDS2017 directory."
        else:
            status["CICIDS2017"]["message"] = "Directory exists but no CSV files found. Please place CICIDS2017 CSV datasets in backend/datasets/raw/CICIDS2017/."
    else:
        status["CICIDS2017"]["message"] = "Raw dataset folder backend/datasets/raw/CICIDS2017/ does not exist. Created folder structure."
        CICIDS_DIR.mkdir(parents=True, exist_ok=True)

    # Check UNSW-NB15
    if UNSW_DIR.exists():
        files = [f.name for f in UNSW_DIR.glob("*.csv")]
        status["UNSW-NB15"]["files"] = files
        if files:
            status["UNSW-NB15"]["present"] = True
            status["UNSW-NB15"]["message"] = f"Found {len(files)} CSV file(s) in UNSW-NB15 directory."
        else:
            status["UNSW-NB15"]["message"] = "Directory exists but no CSV files found. Please place UNSW-NB15 CSV datasets in backend/datasets/raw/UNSW-NB15/."
    else:
        status["UNSW-NB15"]["message"] = "Raw dataset folder backend/datasets/raw/UNSW-NB15/ does not exist. Created folder structure."
        UNSW_DIR.mkdir(parents=True, exist_ok=True)

    return status

if __name__ == "__main__":
    result = check_dataset_status()
    print(json.dumps(result, indent=2))
