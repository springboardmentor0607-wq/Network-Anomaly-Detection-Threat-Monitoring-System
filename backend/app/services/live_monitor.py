import threading
import time
import random
import os

import pandas as pd
import joblib

from datetime import datetime

from app.database import alerts_collection


# ============================================================
# NETSHIELD AI - LIVE NETWORK MONITOR
# Milestone 3
# ============================================================


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

AI_DIR = os.path.join(
    BASE_DIR,
    "ai"
)

BACKEND_DIR = os.path.dirname(
    BASE_DIR
)

DATASET_PATH = os.path.join(
    BACKEND_DIR,
    "dataset",
    "KDDTrain+.txt"
)

MODEL_PATH = os.path.join(
    AI_DIR,
    "model.pkl"
)

SCALER_PATH = os.path.join(
    AI_DIR,
    "scaler.pkl"
)

ENCODERS_PATH = os.path.join(
    AI_DIR,
    "encoders.pkl"
)

ATTACK_ENCODER_PATH = os.path.join(
    AI_DIR,
    "attack_label_encoder.pkl"
)


# ============================================================
# NSL-KDD DATASET COLUMNS
# ============================================================

COLUMNS = [
    "duration",
    "protocol_type",
    "service",
    "flag",
    "src_bytes",
    "dst_bytes",
    "land",
    "wrong_fragment",
    "urgent",
    "hot",
    "num_failed_logins",
    "logged_in",
    "num_compromised",
    "root_shell",
    "su_attempted",
    "num_root",
    "num_file_creations",
    "num_shells",
    "num_access_files",
    "num_outbound_cmds",
    "is_host_login",
    "is_guest_login",
    "count",
    "srv_count",
    "serror_rate",
    "srv_serror_rate",
    "rerror_rate",
    "srv_rerror_rate",
    "same_srv_rate",
    "diff_srv_rate",
    "srv_diff_host_rate",
    "dst_host_count",
    "dst_host_srv_count",
    "dst_host_same_srv_rate",
    "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate",
    "dst_host_srv_serror_rate",
    "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate",
    "attack",
    "level"
]


# ============================================================
# MODEL FEATURES
# ============================================================

MODEL_COLUMNS = COLUMNS[:-2]


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

CATEGORICAL_COLUMNS = [
    "protocol_type",
    "service",
    "flag"
]


# ============================================================
# SERVICE -> COMMON PORT
# ============================================================

SERVICE_PORTS = {

    "http": 80,
    "http_443": 443,
    "https": 443,

    "ftp": 21,
    "ftp_data": 20,

    "ssh": 22,
    "telnet": 23,

    "smtp": 25,

    "domain": 53,
    "domain_u": 53,
    "dns": 53,

    "pop_3": 110,
    "imap4": 143,

    "ldap": 389,

    "login": 513,
    "shell": 514,
    "exec": 512,

    "ntp_u": 123,

    "other": 443
}


# ============================================================
# LOAD MODEL
# ============================================================

print(
    "[LIVE MONITOR] Loading Random Forest model..."
)

model = joblib.load(
    MODEL_PATH
)

print(
    "[LIVE MONITOR] Random Forest model loaded."
)


# ============================================================
# LOAD SCALER
# ============================================================

print(
    "[LIVE MONITOR] Loading scaler..."
)

scaler = joblib.load(
    SCALER_PATH
)

print(
    "[LIVE MONITOR] Scaler loaded."
)


# ============================================================
# LOAD CATEGORICAL ENCODERS
# ============================================================

print(
    "[LIVE MONITOR] Loading categorical encoders..."
)

encoders = joblib.load(
    ENCODERS_PATH
)

print(
    "[LIVE MONITOR] Categorical encoders loaded."
)


# ============================================================
# LOAD ATTACK LABEL ENCODER
# ============================================================

print(
    "[LIVE MONITOR] Loading attack label encoder..."
)

attack_label_encoder = joblib.load(
    ATTACK_ENCODER_PATH
)

print(
    "[LIVE MONITOR] Attack label encoder loaded."
)


# ============================================================
# LOAD DATASET
# ============================================================

print(
    "[LIVE MONITOR] Loading NSL-KDD dataset..."
)

dataset = pd.read_csv(
    DATASET_PATH,
    sep="\t",
    names=COLUMNS
)

print(
    f"[LIVE MONITOR] Dataset loaded: {len(dataset)} records"
)


# ============================================================
# MONITOR CONTROL
# ============================================================

_monitor_running = False

_monitor_thread = None


# ============================================================
# SAFE FLOAT
# ============================================================

def safe_float(
    value,
    default=0.0
):

    try:

        return float(value)

    except (
        ValueError,
        TypeError
    ):

        return default


# ============================================================
# DESTINATION PORT
# ============================================================

def get_destination_port(
    service
):

    service = str(
        service
    ).lower()

    return SERVICE_PORTS.get(
        service,
        random.choice(
            [
                80,
                443,
                21,
                22,
                25,
                53,
                3389
            ]
        )
    )


# ============================================================
# DECODE ATTACK CATEGORY
# ============================================================

def decode_prediction(
    prediction
):

    try:

        prediction_value = int(
            prediction
        )

        decoded = attack_label_encoder.inverse_transform(
            [prediction_value]
        )[0]

        return str(
            decoded
        )

    except Exception:

        return str(
            prediction
        )


# ============================================================
# DETERMINE THREAT
# ============================================================

def is_threat(
    attack_category
):

    return attack_category.lower() != "normal"


# ============================================================
# CALCULATE SEVERITY
# ============================================================

def calculate_severity(
    confidence,
    attack_category
):

    if attack_category.lower() == "normal":

        return "Low"

    if attack_category == "DoS":

        if confidence >= 90:
            return "Critical"

        if confidence >= 75:
            return "High"

        return "Medium"

    if attack_category == "U2R":

        return "Critical"

    if attack_category == "R2L":

        if confidence >= 90:
            return "Critical"

        return "High"

    if attack_category == "Probe":

        if confidence >= 90:
            return "High"

        return "Medium"

    if confidence >= 90:

        return "Critical"

    if confidence >= 75:

        return "High"

    return "Medium"


# ============================================================
# CALCULATE RISK SCORE
# ============================================================

def calculate_risk_score(
    confidence,
    attack_category
):

    if attack_category.lower() == "normal":

        return random.randint(
            0,
            30
        )

    if attack_category == "DoS":

        return random.randint(
            85,
            100
        )

    if attack_category == "U2R":

        return random.randint(
            90,
            100
        )

    if attack_category == "R2L":

        return random.randint(
            75,
            95
        )

    if attack_category == "Probe":

        return random.randint(
            60,
            90
        )

    return random.randint(
        60,
        90
    )


# ============================================================
# GENERATE LIVE EVENT
# ============================================================

def generate_live_event():

    # --------------------------------------------------------
    # SELECT RANDOM NSL-KDD RECORD
    # --------------------------------------------------------

    row = dataset.sample(
        n=1
    ).iloc[0]


    # --------------------------------------------------------
    # BUILD 41 FEATURES
    # --------------------------------------------------------

    features = []

    for column in MODEL_COLUMNS:

        value = row[column]

        # -----------------------------------------------
        # CATEGORICAL FEATURE
        # -----------------------------------------------

        if column in CATEGORICAL_COLUMNS:

            value = str(
                value
            )

            encoder = encoders[column]

            try:

                encoded_value = encoder.transform(
                    [value]
                )[0]

            except Exception:

                encoded_value = 0

            features.append(
                encoded_value
            )

        # -----------------------------------------------
        # NUMERIC FEATURE
        # -----------------------------------------------

        else:

            numeric_value = safe_float(
                value
            )

            features.append(
                numeric_value
            )


    # --------------------------------------------------------
    # SAFETY CHECK
    # --------------------------------------------------------

    if len(features) != 41:

        raise ValueError(
            f"Expected 41 features, "
            f"but generated {len(features)}"
        )


    # --------------------------------------------------------
    # DATAFRAME
    # --------------------------------------------------------

    feature_dataframe = pd.DataFrame(
        [features],
        columns=MODEL_COLUMNS
    )


    # --------------------------------------------------------
    # SCALE
    # --------------------------------------------------------

    scaled_features = scaler.transform(
        feature_dataframe
    )


    # --------------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------------

    prediction = model.predict(
        scaled_features
    )[0]


    # --------------------------------------------------------
    # PREDICTION CONFIDENCE
    # --------------------------------------------------------

    try:

        probabilities = model.predict_proba(
            scaled_features
        )[0]

        confidence = float(
            max(probabilities) * 100
        )

    except Exception:

        confidence = 100.0


    confidence = round(
        confidence,
        2
    )


    # --------------------------------------------------------
    # DECODE PREDICTION
    # --------------------------------------------------------

    attack_category = decode_prediction(
        prediction
    )


    # --------------------------------------------------------
    # THREAT STATUS
    # --------------------------------------------------------

    threat_detected = is_threat(
        attack_category
    )


    if threat_detected:

        threat_type = attack_category

        status = "Threat Detected"

    else:

        threat_type = "Normal Traffic"

        status = "Normal"


    # --------------------------------------------------------
    # SEVERITY
    # --------------------------------------------------------

    severity = calculate_severity(
        confidence,
        attack_category
    )


    # --------------------------------------------------------
    # RISK SCORE
    # --------------------------------------------------------

    risk_score = calculate_risk_score(
        confidence,
        attack_category
    )


    # ========================================================
    # NETWORK INFORMATION
    # ========================================================

    protocol = str(
        row["protocol_type"]
    )

    service = str(
        row["service"]
    )

    flag = str(
        row["flag"]
    )


    packet_size = int(
        safe_float(
            row["src_bytes"]
        )
    )


    duration = int(
        safe_float(
            row["duration"]
        )
    )


    connection_count = int(
        safe_float(
            row["count"]
        )
    )


    # ========================================================
    # NETWORK PORTS
    # ========================================================

    source_port = random.randint(
        1024,
        65535
    )

    destination_port = get_destination_port(
        service
    )


    # ========================================================
    # SIMULATED NETWORK IDENTITY
    # ========================================================

    source_ip = (
        f"192.168.1."
        f"{random.randint(100, 220)}"
    )

    destination_ip = (
        f"192.168.1."
        f"{random.randint(10, 50)}"
    )

    source_host = (
        f"WORKSTATION-"
        f"{random.randint(1, 20):02d}"
    )

    destination_host = random.choice(
        [
            "WEB-SERVER",
            "DB-SERVER",
            "MAIL-SERVER",
            "DNS-SERVER",
            "FILE-SERVER",
            "APP-SERVER"
        ]
    )

    username = (
        f"user"
        f"{random.randint(1, 20):02d}"
    )


    # ========================================================
    # TIMESTAMP
    # ========================================================

    timestamp = datetime.utcnow()


    # ========================================================
    # CREATE ALERT
    # ========================================================

    alert = {

        # ----------------------------------------------------
        # NETWORK IDENTITY
        # ----------------------------------------------------

        "source_ip":
            source_ip,

        "destination_ip":
            destination_ip,

        "source_host":
            source_host,

        "destination_host":
            destination_host,

        "username":
            username,


        # ----------------------------------------------------
        # NETWORK TELEMETRY
        # ----------------------------------------------------

        "packet_size":
            packet_size,

        "duration":
            duration,

        "connection_count":
            connection_count,

        "source_port":
            source_port,

        "destination_port":
            destination_port,

        "protocol":
            protocol,

        "protocol_type":
            protocol,

        "service":
            service,

        "flag":
            flag,


        # ----------------------------------------------------
        # AI ANALYSIS
        # ----------------------------------------------------

        "threat_type":
            threat_type,

        "prediction":
            attack_category,

        "prediction_value":
            int(prediction),

        "severity":
            severity,

        "confidence":
            f"{confidence:.2f}%",

        "confidence_value":
            confidence,

        "risk_score":
            risk_score,


        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        "status":
            status,

        "workflow_status":
            "New",


        # ----------------------------------------------------
        # EVENT INFORMATION
        # ----------------------------------------------------

        "timestamp":
            timestamp,

        "source":
            "Live Network Monitor",

        "monitor_type":
            "LIVE"

    }


    # ========================================================
    # SAVE TO MONGODB
    # ========================================================

    result = alerts_collection.insert_one(
        alert
    )


    alert["_id"] = str(
        result.inserted_id
    )

    alert["id"] = str(
        result.inserted_id
    )


    # ========================================================
    # CONSOLE OUTPUT
    # ========================================================

    print(
        "\n"
        "======================================================"
    )

    print(
        "[LIVE MONITOR] NEW NETWORK EVENT"
    )

    print(
        "------------------------------------------------------"
    )

    print(
        f"Threat Type       : {threat_type}"
    )

    print(
        f"Prediction        : {attack_category}"
    )

    print(
        f"Prediction Value  : {prediction}"
    )

    print(
        f"Severity          : {severity}"
    )

    print(
        f"Confidence        : {confidence:.2f}%"
    )

    print(
        f"Risk Score        : {risk_score}/100"
    )

    print(
        f"Status            : {status}"
    )

    print(
        "Workflow          : New"
    )

    print(
        f"Protocol          : {protocol}"
    )

    print(
        f"Service           : {service}"
    )

    print(
        f"Destination Port  : {destination_port}"
    )

    print(
        f"Source IP         : {source_ip}"
    )

    print(
        f"Destination IP    : {destination_ip}"
    )

    print(
        "------------------------------------------------------"
    )

    print(
        "[LIVE MONITOR] Alert stored in MongoDB."
    )

    print(
        "======================================================"
    )


    return alert


# ============================================================
# CONTINUOUS MONITORING LOOP
# ============================================================

def monitor_loop():

    global _monitor_running

    print(
        "[LIVE MONITOR] Continuous monitoring started."
    )

    print(
        "[LIVE MONITOR] Generating a network event every 5 seconds."
    )


    while _monitor_running:

        try:

            generate_live_event()

        except Exception as error:

            print(
                f"[LIVE MONITOR ERROR] {error}"
            )

        time.sleep(
            5
        )


    print(
        "[LIVE MONITOR] Continuous monitoring stopped."
    )


# ============================================================
# START MONITOR
# ============================================================

def start_monitor():

    global _monitor_running
    global _monitor_thread


    if _monitor_running:

        print(
            "[LIVE MONITOR] Monitor is already running."
        )

        return


    _monitor_running = True


    _monitor_thread = threading.Thread(
        target=monitor_loop,
        daemon=True,
        name="NetShield-Live-Monitor"
    )


    _monitor_thread.start()


    print(
        "[LIVE MONITOR] Monitor thread started successfully."
    )


# ============================================================
# STOP MONITOR
# ============================================================

def stop_monitor():

    global _monitor_running

    _monitor_running = False


    print(
        "[LIVE MONITOR] Monitoring stop requested."
    )


# ============================================================
# MONITOR STATUS
# ============================================================

def is_monitor_running():

    return _monitor_running