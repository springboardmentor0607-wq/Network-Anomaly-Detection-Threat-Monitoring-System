from pathlib import Path
from datetime import datetime
import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

CICIDS_DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "CICIDS2017"
    / "cleaned_CICIDS2017.csv"
)

UNSW_DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "UNSW-NB15"
    / "UNSW_NB15_training-set.parquet"
)

CICIDS_MODEL_PATH = (
    BASE_DIR
    / "ml"
    / "saved_models"
    / "attack_classifier.pkl"
)

CICIDS_ENCODER_PATH = (
    BASE_DIR
    / "ml"
    / "saved_models"
    / "attack_label_encoder.pkl"
)

UNSW_MODEL_PATH = (
    BASE_DIR
    / "ml"
    / "saved_models"
    / "unsw_attack_classifier.pkl"
)

UNSW_ENCODER_PATH = (
    BASE_DIR
    / "ml"
    / "saved_models"
    / "unsw_attack_label_encoder.pkl"
)

UNSW_FEATURE_ENCODERS_PATH = (
    BASE_DIR
    / "ml"
    / "saved_models"
    / "unsw_feature_encoders.pkl"
)


# ============================================================
# LOAD MODELS
# ============================================================

cicids_model = joblib.load(CICIDS_MODEL_PATH)
cicids_encoder = joblib.load(CICIDS_ENCODER_PATH)

unsw_model = joblib.load(UNSW_MODEL_PATH)
unsw_encoder = joblib.load(UNSW_ENCODER_PATH)
unsw_feature_encoders = joblib.load(UNSW_FEATURE_ENCODERS_PATH)


# ============================================================
# RISK CALCULATION
# ============================================================

def calculate_risk(attack_type):

    attack = str(attack_type).lower()

    risk_mapping = {

        "dos hulk": 90,
        "dos goldeneye": 85,
        "dos slowhttptest": 80,
        "dos slowloris": 80,

        "ftp-patator": 75,
        "ssh-patator": 75,

        "exploits": 85,
        "generic": 80,
        "dos": 90,
        "fuzzers": 70,
        "reconnaissance": 60,
        "analysis": 50,
        "backdoor": 90,
        "shellcode": 95,
        "worms": 95,

        "benign": 0,
        "normal": 0
    }

    return risk_mapping.get(attack, 50)


# ============================================================
# SEVERITY
# ============================================================

def calculate_severity(risk_score):

    if risk_score >= 90:
        return "Critical"

    elif risk_score >= 70:
        return "High"

    elif risk_score >= 30:
        return "Medium"

    else:
        return "Low"


# ============================================================
# CICIDS2017 CLASSIFICATION
# ============================================================

def classify_cicids_attack(row):

    features = [[
        row["Destination Port"],
        row["Flow Duration"],
        row["Total Fwd Packets"],
        row["Total Backward Packets"],
        row["Total Length of Fwd Packets"],
        row["Total Length of Bwd Packets"],
        row["Flow Bytes/s"],
        row["Flow Packets/s"]
    ]]

    prediction = cicids_model.predict(features)[0]

    attack_type = cicids_encoder.inverse_transform(
        [prediction]
    )[0]

    return attack_type


# ============================================================
# UNSW-NB15 CLASSIFICATION
# ============================================================

def classify_unsw_attack(row):

    feature_columns = [
        "dur",
        "proto",
        "service",
        "state",
        "spkts",
        "dpkts",
        "sbytes",
        "dbytes",
        "rate",
        "sload",
        "dload",
        "sloss",
        "dloss",
        "sinpkt",
        "dinpkt",
        "sjit",
        "djit",
        "swin",
        "stcpb",
        "dtcpb",
        "dwin",
        "tcprtt",
        "synack",
        "ackdat",
        "smean",
        "dmean",
        "trans_depth",
        "response_body_len",
        "ct_src_dport_ltm",
        "ct_dst_sport_ltm",
        "is_ftp_login",
        "ct_ftp_cmd",
        "ct_flw_http_mthd",
        "is_sm_ips_ports"
    ]

    data = row[feature_columns].copy()

    # Encode categorical features using the same encoders
    for column in ["proto", "service", "state"]:

        encoder = unsw_feature_encoders[column]

        value = str(data[column])

        if value in encoder.classes_:
            data[column] = encoder.transform([value])[0]
        else:
            # Unknown category fallback
            data[column] = 0

    # Convert everything to numeric
    data = pd.to_numeric(data, errors="coerce").fillna(0)

    features = data.values.reshape(1, -1)

    prediction = unsw_model.predict(features)[0]

    attack_type = unsw_encoder.inverse_transform(
        [prediction]
    )[0]

    return attack_type


# ============================================================
# SECURITY ALERT GENERATION
# ============================================================

def generate_alert(
    attack_type,
    dataset,
    source
):

    risk_score = calculate_risk(attack_type)

    severity = calculate_severity(risk_score)

    detected_at = datetime.now().isoformat()

    alert = {

        "alert_id":
            f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",

        "dataset":
            dataset,

        "attack_type":
            attack_type,

        "severity":
            severity,

        "source":
            source,

        "detected_at":
            detected_at,

        "risk_score":
            risk_score,

        "risk_level":
            severity,

        "status":
            "Open"
    }

    return alert


# ============================================================
# DISPLAY ALERT
# ============================================================

def display_alert(alert):

    print(f"Alert ID     : {alert['alert_id']}")
    print(f"Dataset      : {alert['dataset']}")
    print(f"Attack Type  : {alert['attack_type']}")
    print(f"Severity     : {alert['severity']}")
    print(f"Source       : {alert['source']}")
    print(f"Detected At  : {alert['detected_at']}")
    print(f"Risk Score   : {alert['risk_score']}")
    print(f"Risk Level   : {alert['risk_level']}")
    print(f"Status       : {alert['status']}")
    print("-" * 60)


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("\n========== NetShield AI Security Alerts ==========\n")


    # ========================================================
    # CICIDS2017
    # ========================================================

    print("Loading CICIDS2017 dataset...")

    cicids_df = pd.read_csv(
        CICIDS_DATASET_PATH,
        low_memory=False
    )

    cicids_df.columns = cicids_df.columns.str.strip()

    cicids_attacks = cicids_df[
        cicids_df["Label"] != "BENIGN"
    ]

    print(
        f"CICIDS2017 attack packets available: "
        f"{len(cicids_attacks)}"
    )

    print("\nGenerating CICIDS2017 alerts...\n")

    for _, row in cicids_attacks.head(5).iterrows():

        attack_type = classify_cicids_attack(row)

        alert = generate_alert(
            attack_type=attack_type,
            dataset="CICIDS2017",
            source="CICIDS2017 Network Traffic"
        )

        display_alert(alert)


    # ========================================================
    # UNSW-NB15
    # ========================================================

    print("\nLoading UNSW-NB15 dataset...")

    unsw_df = pd.read_parquet(
        UNSW_DATASET_PATH
    )

    print(
        f"UNSW-NB15 records available: "
        f"{len(unsw_df)}"
    )

    # Select actual attack records
    unsw_attacks = unsw_df[
        unsw_df["label"] == 1
    ]

    print(
        f"UNSW-NB15 attack records available: "
        f"{len(unsw_attacks)}"
    )

    print("\nGenerating UNSW-NB15 alerts...\n")

    for _, row in unsw_attacks.head(5).iterrows():

        attack_type = classify_unsw_attack(row)

        alert = generate_alert(
            attack_type=attack_type,
            dataset="UNSW-NB15",
            source="UNSW-NB15 Network Traffic"
        )

        display_alert(alert)


    print("\n========== Alert Generation Completed ==========\n")