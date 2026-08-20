from fastapi import APIRouter
import pandas as pd
import joblib

router = APIRouter()


# ==============================
# Dataset
# ==============================

DATASET_PATH = "datasets/combined_intrusion_dataset.csv"

# ==============================
# Load Isolation Forest Model
# ==============================

isolation_model = joblib.load(
    "ml/saved_models/isolation_forest.pkl"
)


# ==============================
# Dashboard Statistics
# ==============================

@router.get("/dashboard/stats")
def dashboard_stats():

    # Load combined dataset
    df = pd.read_csv(
        DATASET_PATH,
        low_memory=False
    )


    # ------------------------------
    # Basic Traffic Statistics
    # ------------------------------

    total_packets = int(len(df))

    normal_traffic = int(
        (df["label"] == 0).sum()
    )

    attack_traffic = int(
        (df["label"] == 1).sum()
    )

    # ------------------------------
    # Isolation Forest Features
    # ------------------------------

    features = [
        "duration",
        "src_packets",
        "dst_packets",
        "src_bytes",
        "dst_bytes"
    ]

    X = df[features].copy()

    # Make sure protocol is numeric
    for column in features: 
        X[column] = pd.to_numeric( X[column], errors="coerce"
    )

    # Replace invalid values
    X = X.fillna(0)

    # ------------------------------
    # Anomaly Detection
    # ------------------------------

    anomaly_predictions = isolation_model.predict(X)

    # Isolation Forest:
    #  1  = Normal
    # -1  = Anomaly

    anomaly_count = int(
        (anomaly_predictions == -1).sum()
    )

    normal_anomaly_count = int(
        (anomaly_predictions == 1).sum()
    )


    # ------------------------------
    # Percentages
    # ------------------------------

    attack_percentage = (
        attack_traffic / total_packets
    ) * 100

    anomaly_percentage = (
        anomaly_count / total_packets
    ) * 100


    # ------------------------------
    # Risk Score
    # ------------------------------

    risk_score = int(
        (attack_percentage * 0.6) +
        (anomaly_percentage * 0.4)
    )


    # Keep score between 0 and 100
    risk_score = max(
        0,
        min(100, risk_score)
    )


    # ------------------------------
    # Risk Level
    # ------------------------------

    if risk_score < 30:
        risk_level = "LOW"

    elif risk_score < 70:
        risk_level = "MEDIUM"

    else:
        risk_level = "HIGH"


    # ------------------------------
    # Response
    # ------------------------------

    return {

        "total_packets": total_packets,
        "normal_traffic": normal_traffic,
        "attack_traffic": attack_traffic,
        "anomalies_detected": anomaly_count,
        "risk_score": risk_score,
        "risk_level": risk_level

    }