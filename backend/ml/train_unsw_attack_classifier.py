import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report


# ============================================================
# PATHS
# ============================================================

DATASET_PATH = (
    "backend/datasets/UNSW-NB15/UNSW_NB15_training-set.parquet"
)

MODEL_DIR = "backend/ml/saved_models"


# ============================================================
# LOAD DATASET
# ============================================================

print("Loading UNSW-NB15 dataset...")

df = pd.read_parquet(DATASET_PATH)

print("Dataset Shape:", df.shape)


# ============================================================
# CLEAN COLUMN NAMES
# ============================================================

df.columns = df.columns.str.strip()


# ============================================================
# REMOVE MISSING VALUES
# ============================================================

df = df.dropna()

print("After cleaning:", df.shape)


# ============================================================
# FEATURES
# ============================================================

features = [
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


X = df[features].copy()

y = df["attack_cat"].astype(str)


# ============================================================
# EXPLICIT CATEGORICAL COLUMNS
# ============================================================

categorical_columns = [
    "proto",
    "service",
    "state"
]


# ============================================================
# ENCODE CATEGORICAL FEATURES
# ============================================================

feature_encoders = {}

print("\nEncoding categorical features...")

for col in categorical_columns:

    encoder = LabelEncoder()

    X[col] = encoder.fit_transform(
        X[col].astype(str)
    )

    feature_encoders[col] = encoder

    print(
        f"{col}: {len(encoder.classes_)} categories"
    )


# ============================================================
# ENCODE ATTACK CATEGORIES
# ============================================================

attack_encoder = LabelEncoder()

y_encoded = attack_encoder.fit_transform(y)


print("\nAttack Categories:")

for number, category in enumerate(
    attack_encoder.classes_
):
    print(
        f"{number} = {category}"
    )


# ============================================================
# HANDLE INVALID VALUES
# ============================================================

X = X.replace(
    [float("inf"), float("-inf")],
    0
)

X = X.fillna(0)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)


# ============================================================
# TRAIN MODEL
# ============================================================

print("\nTraining UNSW-NB15 attack classifier...")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# EVALUATION
# ============================================================

prediction = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    prediction
)


print("\n===================================")
print("UNSW-NB15 CLASSIFIER RESULTS")
print("===================================")

print(
    "Accuracy:",
    accuracy
)


print("\nClassification Report:\n")

print(
    classification_report(
        y_test,
        prediction,
        target_names=attack_encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# SAVE MODELS
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


joblib.dump(
    model,
    os.path.join(
        MODEL_DIR,
        "unsw_attack_classifier.pkl"
    )
)


joblib.dump(
    attack_encoder,
    os.path.join(
        MODEL_DIR,
        "unsw_attack_label_encoder.pkl"
    )
)


joblib.dump(
    feature_encoders,
    os.path.join(
        MODEL_DIR,
        "unsw_feature_encoders.pkl"
    )
)


print("\nModels saved successfully!")

print(
    "✓ unsw_attack_classifier.pkl"
)

print(
    "✓ unsw_attack_label_encoder.pkl"
)

print(
    "✓ unsw_feature_encoders.pkl"
)