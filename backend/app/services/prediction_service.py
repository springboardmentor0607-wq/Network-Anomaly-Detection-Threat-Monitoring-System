from pathlib import Path
from datetime import datetime

import joblib
import numpy as np
import pandas as pd


# ==========================================
# MODEL PATHS
# ==========================================

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_DIR = BASE_DIR / "models"

CIC_MODEL_PATH = MODEL_DIR / "model_cic.pkl"
CIC_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"

UNSW_MODEL_PATH = MODEL_DIR / "model_unsw.pkl"
UNSW_ENCODER_PATH = MODEL_DIR / "unsw_label_encoder.pkl"


# ==========================================
# LAZY MODEL LOADING
# ==========================================

cic_model = None
cic_encoder = None

unsw_model = None
unsw_encoder = None


def get_cic_model():

    global cic_model
    global cic_encoder

    if cic_model is None:

        cic_model = joblib.load(
            CIC_MODEL_PATH
        )

        cic_encoder = joblib.load(
            CIC_ENCODER_PATH
        )

    return cic_model, cic_encoder


def get_unsw_model():

    global unsw_model
    global unsw_encoder

    if unsw_model is None:

        unsw_model = joblib.load(
            UNSW_MODEL_PATH
        )

        unsw_encoder = joblib.load(
            UNSW_ENCODER_PATH
        )

    return unsw_model, unsw_encoder


# ==========================================
# RISK LEVEL
# ==========================================

def get_risk_level(confidence):

    if confidence >= 95:
        return "Critical"

    elif confidence >= 80:
        return "High"

    elif confidence >= 60:
        return "Medium"

    return "Low"


# ==========================================
# RECOMMENDATIONS
# ==========================================

def get_recommendation(label):

    recommendations = {

        "BENIGN": "Traffic is normal.",

        "Normal": "Traffic is normal.",

        "DDoS": "Block source IP and enable rate limiting.",

        "DoS Hulk": "Monitor traffic and isolate affected server.",

        "PortScan": "Block scanner and review firewall rules.",

        "Generic": "Investigate suspicious activity.",

        "Exploits": "Patch vulnerable systems immediately.",

        "Fuzzers": "Inspect application logs for abnormal inputs.",

        "Reconnaissance": "Monitor source IP and strengthen monitoring.",

        "Backdoor": "Disconnect host and perform malware scan.",

        "Shellcode": "Isolate endpoint immediately.",

        "Worms": "Disconnect infected devices from the network."

    }

    return recommendations.get(
        label,
        "Notify Security Team."
    )


# ==========================================
# CIC PREDICTION
# ==========================================

def predict_cic(features: dict):

    model, encoder = get_cic_model()

    df = pd.DataFrame([features])

    prediction = model.predict(df)[0]

    probability = np.max(
        model.predict_proba(df)
    ) * 100

    label = encoder.inverse_transform(
        [prediction]
    )[0]

    return {

        "dataset": "CICIDS2017",

        "model": "Random Forest",

        "prediction": label,

        "confidence": round(
            float(probability),
            2
        ),

        "risk_level": get_risk_level(
            probability
        ),

        "recommendation": get_recommendation(
            label
        ),

        "timestamp": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    }


# ==========================================
# UNSW PREDICTION
# ==========================================

def predict_unsw(features: dict):

    model, encoder = get_unsw_model()

    df = pd.DataFrame([features])

    prediction = model.predict(df)[0]

    probability = np.max(
        model.predict_proba(df)
    ) * 100

    label = encoder.inverse_transform(
        [prediction]
    )[0]

    return {

        "dataset": "UNSW-NB15",

        "model": "Random Forest",

        "prediction": label,

        "confidence": round(
            float(probability),
            2
        ),

        "risk_level": get_risk_level(
            probability
        ),

        "recommendation": get_recommendation(
            label
        ),

        "timestamp": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    }