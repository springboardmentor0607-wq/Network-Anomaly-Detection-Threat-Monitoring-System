
import pandas as pd
import os
import joblib

from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# NETSHIELD AI
# MULTICLASS RANDOM FOREST TRAINING
# ============================================================


# ============================================================
# NSL-KDD COLUMN NAMES
# ============================================================

columns = [
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
# PATH CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.dirname(
    os.path.dirname(BASE_DIR)
)

DATASET_PATH = os.path.join(
    BACKEND_DIR,
    "dataset",
    "KDDTrain+.txt"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.pkl"
)

SCALER_PATH = os.path.join(
    BASE_DIR,
    "scaler.pkl"
)

ENCODERS_PATH = os.path.join(
    BASE_DIR,
    "encoders.pkl"
)

LABEL_ENCODER_PATH = os.path.join(
    BASE_DIR,
    "attack_label_encoder.pkl"
)


# ============================================================
# ATTACK GROUPS
# ============================================================

DOS_ATTACKS = {

    "back",
    "land",
    "neptune",
    "pod",
    "smurf",
    "teardrop",
    "apache2",
    "udpstorm",
    "processtable",
    "mailbomb"
}


PROBE_ATTACKS = {

    "ipsweep",
    "nmap",
    "portsweep",
    "satan",
    "mscan",
    "saint"
}


R2L_ATTACKS = {

    "ftp_write",
    "guess_passwd",
    "imap",
    "multihop",
    "phf",
    "spy",
    "warezclient",
    "warezmaster",
    "named",
    "sendmail",
    "snmpgetattack",
    "snmpguess",
    "xlock",
    "xsnoop",
    "httptunnel"
}


U2R_ATTACKS = {

    "buffer_overflow",
    "loadmodule",
    "perl",
    "rootkit",
    "ps",
    "sqlattack",
    "xterm"
}


# ============================================================
# MAP ATTACK TO CATEGORY
# ============================================================

def classify_attack_category(attack):

    attack = str(
        attack
    ).strip().lower()

    # Remove NSL-KDD trailing period
    attack = attack.rstrip(".")

    if attack == "normal":

        return "Normal"

    if attack in DOS_ATTACKS:

        return "DoS"

    if attack in PROBE_ATTACKS:

        return "Probe"

    if attack in R2L_ATTACKS:

        return "R2L"

    if attack in U2R_ATTACKS:

        return "U2R"

    return "Other"


# ============================================================
# START
# ============================================================

print(
    "\n======================================================"
)

print(
    "        NETSHIELD AI - MODEL TRAINING"
)

print(
    "======================================================"
)


# ============================================================
# CHECK DATASET
# ============================================================

if not os.path.exists(DATASET_PATH):

    raise FileNotFoundError(
        f"Dataset not found:\n{DATASET_PATH}"
    )


print(
    f"\n[TRAINING] Dataset path:"
)

print(
    DATASET_PATH
)


# ============================================================
# LOAD DATASET
# ============================================================

print(
    "\n[TRAINING] Loading NSL-KDD dataset..."
)


data = pd.read_csv(

    DATASET_PATH,

    sep="\t",

    names=columns,

    header=None
)


print(
    f"[TRAINING] Dataset loaded: {len(data)} records"
)


# ============================================================
# DEBUG ATTACK COLUMN
# ============================================================

print(
    "\n[TRAINING] Sample attack labels before cleaning:"
)

print(
    data["attack"]
    .astype(str)
    .head(20)
    .tolist()
)


# ============================================================
# CLEAN ATTACK COLUMN
# ============================================================

data["attack"] = (
    data["attack"]
    .astype(str)
    .str.strip()
    .str.lower()
    .str.rstrip(".")
)


print(
    "\n[TRAINING] Sample attack labels after cleaning:"
)

print(
    data["attack"]
    .head(20)
    .tolist()
)


# ============================================================
# DISPLAY ORIGINAL ATTACK TYPES
# ============================================================

print(
    "\n[TRAINING] Original attack distribution:"
)

print(
    data["attack"].value_counts().head(30)
)


# ============================================================
# CREATE ATTACK CATEGORY
# ============================================================

data["attack_category"] = (
    data["attack"]
    .apply(
        classify_attack_category
    )
)


# ============================================================
# DISPLAY CATEGORY DISTRIBUTION
# ============================================================

print(
    "\n[TRAINING] Attack category distribution:"
)

print(
    data["attack_category"]
    .value_counts()
)


# ============================================================
# REMOVE UNKNOWN ATTACKS
# ============================================================

data = data[
    data["attack_category"] != "Other"
].copy()


print(
    f"\n[TRAINING] Records after cleaning: {len(data)}"
)


# ============================================================
# SAFETY CHECK
# ============================================================

if len(data) == 0:

    raise ValueError(
        "No usable records found. "
        "Check the dataset separator and attack labels."
    )


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

categorical_columns = [

    "protocol_type",

    "service",

    "flag"
]


encoders = {}


print(
    "\n[TRAINING] Encoding categorical features..."
)


for column in categorical_columns:

    data[column] = (
        data[column]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    encoder = LabelEncoder()

    data[column] = encoder.fit_transform(
        data[column]
    )

    encoders[column] = encoder


print(
    "[TRAINING] Categorical encoding completed."
)


# ============================================================
# ENCODE TARGET
# ============================================================

attack_label_encoder = LabelEncoder()


data["attack_category_encoded"] = (
    attack_label_encoder.fit_transform(
        data["attack_category"]
    )
)


print(
    "\n[TRAINING] Target classes:"
)


for index, label in enumerate(
    attack_label_encoder.classes_
):

    print(
        f"    {index} -> {label}"
    )


# ============================================================
# FEATURES
# ============================================================

X = data.drop(

    [
        "attack",
        "level",
        "attack_category",
        "attack_category_encoded"
    ],

    axis=1
)


# ============================================================
# TARGET
# ============================================================

y = data[
    "attack_category_encoded"
]


print(
    f"\n[TRAINING] Number of features: {X.shape[1]}"
)


if X.shape[1] != 41:

    raise ValueError(
        f"Expected 41 features, "
        f"but found {X.shape[1]}"
    )


# ============================================================
# SCALE FEATURES
# ============================================================

print(
    "\n[TRAINING] Scaling features..."
)


scaler = StandardScaler()


X_scaled = scaler.fit_transform(
    X
)


# ============================================================
# TRAIN TEST SPLIT
# ============================================================

print(
    "\n[TRAINING] Creating train/test split..."
)


X_train, X_test, y_train, y_test = train_test_split(

    X_scaled,

    y,

    test_size=0.20,

    random_state=42,

    stratify=y
)


print(
    f"[TRAINING] Training samples: {len(X_train)}"
)

print(
    f"[TRAINING] Testing samples : {len(X_test)}"
)


# ============================================================
# RANDOM FOREST
# ============================================================

print(
    "\n[TRAINING] Training Random Forest..."
)


model = RandomForestClassifier(

    n_estimators=150,

    random_state=42,

    class_weight="balanced",

    n_jobs=-1
)


model.fit(

    X_train,

    y_train
)


print(
    "[TRAINING] Random Forest training completed."
)


# ============================================================
# PREDICTION
# ============================================================

print(
    "\n[TRAINING] Evaluating model..."
)


predictions = model.predict(
    X_test
)


# ============================================================
# ACCURACY
# ============================================================

accuracy = accuracy_score(

    y_test,

    predictions
)


print(
    "\n======================================================"
)

print(
    f"Accuracy: {accuracy:.4f}"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print(
    "\nClassification Report:\n"
)


print(
    classification_report(

        y_test,

        predictions,

        target_names=
        attack_label_encoder.classes_,

        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print(
    "\nConfusion Matrix:\n"
)


print(
    confusion_matrix(

        y_test,

        predictions
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

print(
    "\n[TRAINING] Saving model..."
)


joblib.dump(

    model,

    MODEL_PATH
)


# ============================================================
# SAVE SCALER
# ============================================================

print(
    "[TRAINING] Saving scaler..."
)


joblib.dump(

    scaler,

    SCALER_PATH
)


# ============================================================
# SAVE FEATURE ENCODERS
# ============================================================

print(
    "[TRAINING] Saving feature encoders..."
)


joblib.dump(

    encoders,

    ENCODERS_PATH
)


# ============================================================
# SAVE ATTACK LABEL ENCODER
# ============================================================

print(
    "[TRAINING] Saving attack label encoder..."
)


joblib.dump(

    attack_label_encoder,

    LABEL_ENCODER_PATH
)


# ============================================================
# COMPLETE
# ============================================================

print(
    "\n======================================================"
)

print(
    "        MODEL TRAINING COMPLETED"
)

print(
    "======================================================"
)


print(
    "\nGenerated files:"
)

print(
    f"  ✓ {MODEL_PATH}"
)

print(
    f"  ✓ {SCALER_PATH}"
)

print(
    f"  ✓ {ENCODERS_PATH}"
)

print(
    f"  ✓ {LABEL_ENCODER_PATH}"
)


print(
    "\nSupported categories:"
)


for label in attack_label_encoder.classes_:

    print(
        f"  ✓ {label}"
    )


print(
    "\n======================================================"
)

