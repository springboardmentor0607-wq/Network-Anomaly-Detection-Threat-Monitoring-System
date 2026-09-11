from pathlib import Path
from collections import Counter

import joblib
import pandas as pd

from app.services.pcap_flow_features import extract_cic_flows
from app.services.alert_service import create_security_alert


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"

CIC_MODEL_PATH = MODEL_DIR / "model_cic.pkl"
CIC_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"


# Lazy loading:
# The large CIC model is loaded only when PCAP prediction is actually used.
cic_model = None
cic_encoder = None


def get_cic_model():
    global cic_model
    global cic_encoder

    if cic_model is None:
        cic_model = joblib.load(CIC_MODEL_PATH)
        cic_encoder = joblib.load(CIC_ENCODER_PATH)

    return cic_model, cic_encoder


FEATURE_ALIASES = {
    "Total Length of Fwd Packets": "Total Length of FwdPackets",
    "Packet Length Variance": "Packet LengthVariance",
    "URG Flag Count": "URGFlag Count",
    "Avg Fwd Segment Size": "Avg Fwd SegmentSize",
    "Active Min": "ActiveMin"
}


def align_features(df, model):
    df = df.copy()

    df = df.rename(columns=FEATURE_ALIASES)

    expected_features = getattr(
        model,
        "feature_names_in_",
        None
    )

    if expected_features is None:
        raise ValueError(
            "CIC model does not contain feature_names_in_."
        )

    expected_features = list(expected_features)

    for column in expected_features:
        if column not in df.columns:
            df[column] = 0

    df = df[expected_features]

    df = df.apply(
        pd.to_numeric,
        errors="coerce"
    )

    df = df.replace(
        [float("inf"), float("-inf")],
        0
    )

    df = df.fillna(0)

    return df


def calculate_severity(threat_count, confidence):
    # No threats means no severity.
    if threat_count <= 0:
        return None

    if threat_count >= 100 or confidence >= 95:
        return "Critical"

    if threat_count >= 50 or confidence >= 85:
        return "High"

    if threat_count >= 10 or confidence >= 70:
        return "Medium"

    return "Low"


def predict_pcap_threats(file_path):
    print("==========================================")
    print("PCAP AI THREAT PREDICTION")
    print("==========================================")

    flow_df = extract_cic_flows(file_path)

    if flow_df.empty:
        print("No flows detected.")

        return {
            "success": True,
            "total_flows": 0,
            "total_threats": 0,
            "total_benign": 0,
            "threat_percentage": 0,
            "benign_percentage": 0,
            "average_confidence": 0,
            "main_threat": None,
            "main_threat_count": 0,
            "attack_distribution": {},
            "threat_distribution": {},
            "severity": None,
            "alert_created": False,
            "alert_id": None
        }

    # Load the CIC model only when a PCAP prediction is actually requested.
    model, encoder = get_cic_model()

    X = align_features(flow_df, model)

    print(f"Flows sent to AI model: {len(X)}")

    predictions = model.predict(X)

    probabilities = model.predict_proba(X)

    try:
        predicted_labels = encoder.inverse_transform(
            predictions
        )
    except Exception:
        predicted_labels = predictions

    confidence_values = probabilities.max(axis=1)

    average_confidence = (
        confidence_values.mean() * 100
    )

    label_counts = Counter(
        str(label)
        for label in predicted_labels
    )

    benign_labels = {
        "BENIGN",
        "Benign",
        "benign",
        "NORMAL",
        "Normal",
        "normal"
    }

    threat_counts = {}

    for label, count in label_counts.items():
        if label not in benign_labels:
            threat_counts[label] = int(count)

    total_flows = len(predicted_labels)

    total_threats = sum(
        threat_counts.values()
    )

    total_benign = (
        total_flows - total_threats
    )

    threat_percentage = (
        (total_threats / total_flows) * 100
        if total_flows > 0
        else 0
    )

    benign_percentage = (
        (total_benign / total_flows) * 100
        if total_flows > 0
        else 0
    )

    main_threat = None
    main_threat_count = 0

    if threat_counts:
        main_threat = max(
            threat_counts,
            key=threat_counts.get
        )

        main_threat_count = (
            threat_counts[main_threat]
        )

    severity = calculate_severity(
        total_threats,
        average_confidence
    )

    alert_created = False
    alert_id = None

    # Create an alert only when an actual threat is detected.
    if total_threats > 0:

        alert = create_security_alert(
            alert_type="PCAP AI Threat Detection",
            severity=severity,
            title="Threats detected in PCAP analysis",
            description=(
                f"AI analysis detected "
                f"{total_threats} threat flows "
                f"out of {total_flows} total flows. "
                f"Primary threat: {main_threat}. "
                f"Average confidence: "
                f"{average_confidence:.2f}%."
            ),
            threat_count=total_threats,
            confidence=average_confidence,
            source="PCAP AI Prediction Engine"
        )

        alert_created = True

        if alert:
            alert_id = str(
                alert.get("_id")
                or alert.get("alert_id")
                or ""
            )

        print("Security alert created.")

    else:
        print("No threats detected. No alert created.")

    print("------------------------------------------")
    print(f"Total Flows       : {total_flows}")
    print(f"Total Threats     : {total_threats}")
    print(f"Total Benign      : {total_benign}")
    print(
        f"Threat Percentage : "
        f"{threat_percentage:.2f}%"
    )
    print(
        f"Average Confidence: "
        f"{average_confidence:.2f}%"
    )
    print(f"Severity          : {severity}")
    print("------------------------------------------")

    return {
        "success": True,
        "total_flows": int(total_flows),
        "total_threats": int(total_threats),
        "total_benign": int(total_benign),
        "threat_percentage": round(
            threat_percentage,
            2
        ),
        "benign_percentage": round(
            benign_percentage,
            2
        ),
        "average_confidence": round(
            float(average_confidence),
            2
        ),
        "main_threat": main_threat,
        "main_threat_count": int(
            main_threat_count
        ),
        "attack_distribution": {
            str(key): int(value)
            for key, value in label_counts.items()
        },
        "threat_distribution": {
            str(key): int(value)
            for key, value in threat_counts.items()
        },
        "severity": severity,
        "alert_created": alert_created,
        "alert_id": alert_id
    }