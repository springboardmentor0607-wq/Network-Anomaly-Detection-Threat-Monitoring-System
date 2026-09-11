from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd

from app.database.mongodb import (
    predictions_collection,
    alerts_collection
)


# ============================================================
# LOAD MODELS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"

CIC_MODEL_PATH = MODEL_DIR / "model_cic.pkl"
CIC_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"

UNSW_MODEL_PATH = MODEL_DIR / "model_unsw.pkl"
UNSW_ENCODER_PATH = MODEL_DIR / "unsw_label_encoder.pkl"


# ============================================================
# LAZY MODEL VARIABLES
# Models are NOT loaded when FastAPI starts.
# They are loaded only when prediction is requested.
# ============================================================

cic_model = None
cic_encoder = None

unsw_model = None
unsw_encoder = None


def get_cic_model():

    global cic_model
    global cic_encoder

    if cic_model is None:

        print(
            "Loading CICIDS2017 model..."
        )

        cic_model = joblib.load(
            CIC_MODEL_PATH
        )

        cic_encoder = joblib.load(
            CIC_ENCODER_PATH
        )

        print(
            "CICIDS2017 model loaded."
        )

    return cic_model, cic_encoder


def get_unsw_model():

    global unsw_model
    global unsw_encoder

    if unsw_model is None:

        print(
            "Loading UNSW-NB15 model..."
        )

        unsw_model = joblib.load(
            UNSW_MODEL_PATH
        )

        unsw_encoder = joblib.load(
            UNSW_ENCODER_PATH
        )

        print(
            "UNSW-NB15 model loaded."
        )

    return unsw_model, unsw_encoder


# ============================================================
# SEVERITY CALCULATION
# ============================================================

def calculate_severity(
    attack_type: str,
    count: int,
    confidence: float
):

    attack = attack_type.lower()

    critical_attacks = [
        "ddos",
        "dos",
        "bot",
        "malware",
        "ransomware",
        "infiltration"
    ]

    high_attacks = [
        "sql injection",
        "brute force",
        "xss",
        "exploit",
        "backdoor",
        "shellcode",
        "web attack"
    ]

    if any(
        item in attack
        for item in critical_attacks
    ):
        return "Critical"

    if any(
        item in attack
        for item in high_attacks
    ):
        return "High"

    if count >= 100 and confidence >= 90:
        return "High"

    if count >= 20:
        return "Medium"

    return "Low"


# ============================================================
# CREATE SECURITY ALERT
# ============================================================

def create_security_alert(
    dataset: str,
    attack_type: str,
    count: int,
    confidence: float
):

    severity = calculate_severity(
        attack_type,
        count,
        confidence
    )

    created_at = datetime.now(
        timezone.utc
    )

    alert_document = {

        "dataset": dataset.upper(),

        "attack_type": attack_type,

        "detected_count": int(count),

        "confidence": float(confidence),

        "severity": severity,

        "status": "New",

        "source": "NetShield AI",

        "created_at": created_at

    }

    result = alerts_collection.insert_one(
        alert_document
    )

    print("\n===================================")
    print("       SECURITY ALERT CREATED")
    print("===================================")

    print(
        f"Alert ID      : {result.inserted_id}"
    )

    print(
        f"Dataset       : {dataset.upper()}"
    )

    print(
        f"Attack        : {attack_type}"
    )

    print(
        f"Count         : {count}"
    )

    print(
        f"Confidence    : {confidence}%"
    )

    print(
        f"Severity      : {severity}"
    )

    print(
        "Status        : New"
    )

    print(
        f"Created At    : {created_at}"
    )

    return {

        "alert_id": str(
            result.inserted_id
        ),

        "dataset": dataset.upper(),

        "attack_type": attack_type,

        "detected_count": int(count),

        "confidence": float(confidence),

        "severity": severity,

        "status": "New",

        "created_at": created_at.isoformat()

    }


# ============================================================
# PREDICT CSV
# ============================================================

def predict_csv(
    file_path: str,
    dataset: str
):

    print("\n===================================")
    print("      NETSHIELD AI PREDICTION")
    print("===================================\n")

    print(
        "Reading Uploaded CSV..."
    )

    # ========================================================
    # VALIDATE DATASET
    # ========================================================

    dataset = dataset.strip().lower()

    if dataset not in ["cic", "unsw"]:

        raise Exception(
            "Invalid Dataset. Use 'cic' or 'unsw'."
        )

    # ========================================================
    # READ CSV
    # ========================================================

    df = pd.read_csv(
        file_path,
        low_memory=False
    )

    total_rows = len(df)

    # ========================================================
    # DEMO MODE
    # ========================================================

    df = df.head(1000).copy()

    print(
        f"Original Rows  : {total_rows}"
    )

    print(
        f"Rows Processed : {len(df)}"
    )

    # ========================================================
    # DATA CLEANING
    # ========================================================

    df.columns = (
        df.columns
        .str.strip()
    )

    df.replace(
        [np.inf, -np.inf],
        np.nan,
        inplace=True
    )

    df.fillna(
        0,
        inplace=True
    )

    # ========================================================
    # CICIDS2017
    # ========================================================

    if dataset == "cic":

        print(
            "\nUsing CICIDS2017 Random Forest Model..."
        )

        # ----------------------------------------------------
        # LOAD CIC MODEL ONLY WHEN NEEDED
        # ----------------------------------------------------

        cic_model, cic_encoder = get_cic_model()

        # Remove target column
        if "Label" in df.columns:

            df.drop(
                columns=["Label"],
                inplace=True
            )

        # Convert columns to numeric
        for col in df.columns:

            df[col] = pd.to_numeric(
                df[col],
                errors="coerce"
            )

        df.fillna(
            0,
            inplace=True
        )

        # Prediction
        predictions = cic_model.predict(
            df
        )

        probabilities = (
            cic_model.predict_proba(df)
        )

        labels = (
            cic_encoder.inverse_transform(
                predictions
            )
        )

    # ========================================================
    # UNSW-NB15
    # ========================================================

    elif dataset == "unsw":

        print(
            "\nUsing UNSW-NB15 Random Forest Model..."
        )

        # ----------------------------------------------------
        # LOAD UNSW MODEL ONLY WHEN NEEDED
        # ----------------------------------------------------

        unsw_model, unsw_encoder = get_unsw_model()

        # Remove target columns
        if "attack_cat" in df.columns:

            df.drop(
                columns=["attack_cat"],
                inplace=True
            )

        if "label" in df.columns:

            df.drop(
                columns=["label"],
                inplace=True
            )

        if "id" in df.columns:

            df.drop(
                columns=["id"],
                inplace=True
            )

        # Categorical columns
        categorical = [
            "proto",
            "service",
            "state"
        ]

        existing = [
            c
            for c in categorical
            if c in df.columns
        ]

        # One-hot encoding
        df = pd.get_dummies(
            df,
            columns=existing
        )

        # Prediction
        predictions = unsw_model.predict(
            df
        )

        probabilities = (
            unsw_model.predict_proba(df)
        )

        labels = (
            unsw_encoder.inverse_transform(
                predictions
            )
        )

    # ========================================================
    # THREAT SUMMARY
    # ========================================================

    summary = dict(
        Counter(
            str(label)
            for label in labels
        )
    )

    # ========================================================
    # AVERAGE CONFIDENCE
    # ========================================================

    confidence = round(
        float(
            np.mean(
                np.max(
                    probabilities,
                    axis=1
                )
            ) * 100
        ),
        2
    )

    print(
        "\nPrediction Summary:"
    )

    for attack, count in summary.items():

        print(
            f"  {attack}: {count}"
        )

    print(
        f"\nAverage Confidence : {confidence}%"
    )

    # ========================================================
    # FIND THREATS
    # ========================================================

    threat_summary = {

        attack: count

        for attack, count
        in summary.items()

        if str(attack).upper() != "BENIGN"
    }

    total_threat_packets = sum(
        threat_summary.values()
    )

    print(
        f"Total Threat Packets : "
        f"{total_threat_packets}"
    )

    # ========================================================
    # CREATION TIME
    # ========================================================

    created_at = datetime.now(
        timezone.utc
    )

    # ========================================================
    # CREATE PREDICTION DOCUMENT
    # ========================================================

    prediction_document = {

        "dataset": dataset.upper(),

        "original_records": int(
            total_rows
        ),

        "processed_records": int(
            len(df)
        ),

        "average_confidence": float(
            confidence
        ),

        "summary": summary,

        "threat_summary": threat_summary,

        "total_threat_packets": int(
            total_threat_packets
        ),

        "created_at": created_at

    }

    # ========================================================
    # SAVE PREDICTION TO MONGODB
    # ========================================================

    prediction_result = (
        predictions_collection.insert_one(
            prediction_document
        )
    )

    prediction_id = (
        prediction_result.inserted_id
    )

    print(
        "\nPrediction saved to MongoDB"
    )

    print(
        f"Prediction ID : {prediction_id}"
    )

    # ========================================================
    # CREATE SECURITY ALERTS
    # ========================================================

    alerts_created = 0

    for attack, count in threat_summary.items():

        if int(count) <= 0:
            continue

        severity = calculate_severity(
            attack,
            int(count),
            confidence
        )

        alert_document = {

            "prediction_id": prediction_id,

            "dataset": dataset.upper(),

            "threat_type": str(attack),

            "threat_count": int(count),

            "severity": severity,

            "confidence": float(confidence),

            "status": "New",

            "created_at": created_at,

            "updated_at": created_at,

            "message":
                f"{attack} attack detected. "
                f"{count} malicious records identified.",

            "source":
                "AI Prediction Engine"

        }

        alert_result = (
            alerts_collection.insert_one(
                alert_document
            )
        )

        alerts_created += 1

        print(
            f"Security Alert Created: "
            f"{attack} | "
            f"{severity} | "
            f"{count} threats | "
            f"Alert ID: {alert_result.inserted_id}"
        )

    # ========================================================
    # ALERT STATUS MESSAGE
    # ========================================================

    if alerts_created > 0:

        print(
            f"\n{alerts_created} "
            f"security alert(s) created."
        )

    else:

        print(
            "\nNo threats detected."
        )

        print(
            "No security alert created."
        )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "dataset": dataset.upper(),

        "original_records": int(
            total_rows
        ),

        "processed_records": int(
            len(df)
        ),

        "average_confidence": float(
            confidence
        ),

        "summary": summary,

        "alerts_created": int(
            alerts_created
        ),

        "created_at":
            created_at.isoformat()

    }