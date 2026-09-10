"""
NetShield AI - Synthetic Dataset & ML Model Training Script

Trains both the Isolation Forest anomaly detection model and the
RandomForest/XGBoost attack classifier using a synthetic CICIDS2017-compatible dataset.
Produces real, persisted model artifacts that the inference engine loads at runtime.

Run from the backend directory:
    python -m app.ml.train_models
"""
import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# ── Attack class definitions ──────────────────────────────────────────────────
ATTACK_CLASSES = [
    "BENIGN",
    "DoS SYN Flood",
    "DDoS",
    "Port Scan",
    "SSH Brute Force",
    "DNS Tunneling",
    "SQL Injection",
    "Command Injection",
    "Reconnaissance",
    "FTP Brute Force",
]

# CICIDS2017-style feature names
NUMERIC_FEATURES = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Average Packet Size",
]
CATEGORICAL_FEATURES = ["Protocol"]
TARGET_COL = "Label"
PROTOCOLS = ["TCP", "UDP", "ICMP", "DNS", "SSH", "HTTP", "HTTPS"]


def generate_flow_features(attack_class: str, n: int) -> pd.DataFrame:
    """Generate CICIDS2017-compatible synthetic features for a given attack class."""
    if attack_class == "BENIGN":
        data = {
            "Destination Port": np.random.choice([80, 443, 22, 8080, 53, 3389, 25], n),
            "Flow Duration": np.random.exponential(scale=50_000, size=n),
            "Total Fwd Packets": np.random.randint(1, 50, n),
            "Total Backward Packets": np.random.randint(1, 45, n),
            "Total Length of Fwd Packets": np.random.randint(40, 1500, n),
            "Total Length of Bwd Packets": np.random.randint(40, 1500, n),
            "Flow Bytes/s": np.random.exponential(scale=5_000, size=n),
            "Flow Packets/s": np.random.exponential(scale=80, size=n),
            "Average Packet Size": np.random.randint(64, 1500, n),
            "Protocol": np.random.choice(["TCP", "UDP", "HTTPS", "HTTP"], n, p=[0.4, 0.3, 0.2, 0.1]),
        }
    elif attack_class in ("DoS SYN Flood", "DDoS"):
        data = {
            "Destination Port": np.random.choice([80, 443, 8080], n),
            "Flow Duration": np.random.randint(1, 5000, n),
            "Total Fwd Packets": np.random.randint(2000, 15000, n),
            "Total Backward Packets": np.random.randint(0, 100, n),
            "Total Length of Fwd Packets": np.random.randint(200, 500, n),
            "Total Length of Bwd Packets": np.random.randint(0, 50, n),
            "Flow Bytes/s": np.random.uniform(500_000, 5_000_000, n),
            "Flow Packets/s": np.random.uniform(10_000, 100_000, n),
            "Average Packet Size": np.random.randint(40, 100, n),
            "Protocol": np.random.choice(["TCP", "UDP"], n, p=[0.7, 0.3]),
        }
    elif attack_class == "Port Scan":
        data = {
            "Destination Port": np.random.randint(1, 65535, n),
            "Flow Duration": np.random.randint(1, 500, n),
            "Total Fwd Packets": np.random.randint(1, 5, n),
            "Total Backward Packets": np.random.randint(0, 2, n),
            "Total Length of Fwd Packets": np.random.randint(40, 80, n),
            "Total Length of Bwd Packets": np.random.randint(0, 40, n),
            "Flow Bytes/s": np.random.uniform(200, 2000, n),
            "Flow Packets/s": np.random.uniform(5, 100, n),
            "Average Packet Size": np.random.randint(40, 80, n),
            "Protocol": np.random.choice(["TCP", "UDP", "ICMP"], n, p=[0.6, 0.3, 0.1]),
        }
    elif attack_class in ("SSH Brute Force", "FTP Brute Force"):
        data = {
            "Destination Port": np.full(n, 22 if "SSH" in attack_class else 21),
            "Flow Duration": np.random.randint(500, 5000, n),
            "Total Fwd Packets": np.random.randint(200, 2000, n),
            "Total Backward Packets": np.random.randint(200, 2000, n),
            "Total Length of Fwd Packets": np.random.randint(1000, 50000, n),
            "Total Length of Bwd Packets": np.random.randint(1000, 50000, n),
            "Flow Bytes/s": np.random.uniform(5000, 50000, n),
            "Flow Packets/s": np.random.uniform(100, 1000, n),
            "Average Packet Size": np.random.randint(100, 500, n),
            "Protocol": np.full(n, "SSH"),
        }
    elif attack_class == "DNS Tunneling":
        data = {
            "Destination Port": np.full(n, 53),
            "Flow Duration": np.random.randint(10000, 500000, n),
            "Total Fwd Packets": np.random.randint(100, 1000, n),
            "Total Backward Packets": np.random.randint(100, 1000, n),
            "Total Length of Fwd Packets": np.random.randint(10000, 200000, n),
            "Total Length of Bwd Packets": np.random.randint(10000, 200000, n),
            "Flow Bytes/s": np.random.uniform(10000, 200000, n),
            "Flow Packets/s": np.random.uniform(50, 500, n),
            "Average Packet Size": np.random.randint(200, 1500, n),
            "Protocol": np.full(n, "DNS"),
        }
    elif attack_class in ("SQL Injection", "Command Injection"):
        data = {
            "Destination Port": np.random.choice([80, 443, 8080, 8443], n),
            "Flow Duration": np.random.randint(100, 10000, n),
            "Total Fwd Packets": np.random.randint(5, 200, n),
            "Total Backward Packets": np.random.randint(5, 200, n),
            "Total Length of Fwd Packets": np.random.randint(500, 20000, n),
            "Total Length of Bwd Packets": np.random.randint(500, 20000, n),
            "Flow Bytes/s": np.random.uniform(1000, 100000, n),
            "Flow Packets/s": np.random.uniform(10, 500, n),
            "Average Packet Size": np.random.randint(200, 1000, n),
            "Protocol": np.random.choice(["HTTP", "HTTPS"], n),
        }
    else:  # Reconnaissance / Unknown
        data = {
            "Destination Port": np.random.randint(1, 65535, n),
            "Flow Duration": np.random.randint(100, 50000, n),
            "Total Fwd Packets": np.random.randint(10, 500, n),
            "Total Backward Packets": np.random.randint(10, 500, n),
            "Total Length of Fwd Packets": np.random.randint(200, 5000, n),
            "Total Length of Bwd Packets": np.random.randint(200, 5000, n),
            "Flow Bytes/s": np.random.uniform(500, 20000, n),
            "Flow Packets/s": np.random.uniform(10, 200, n),
            "Average Packet Size": np.random.randint(64, 1000, n),
            "Protocol": np.random.choice(["TCP", "UDP"], n),
        }

    data["Label"] = attack_class
    return pd.DataFrame(data)


def build_synthetic_dataset(samples_per_class: int = 500) -> pd.DataFrame:
    """Build a balanced synthetic CICIDS2017-compatible dataset."""
    dfs = []
    for cls in ATTACK_CLASSES:
        n = samples_per_class if cls == "BENIGN" else max(50, samples_per_class // (len(ATTACK_CLASSES) - 1))
        dfs.append(generate_flow_features(cls, n))
    df = pd.concat(dfs, ignore_index=True).sample(frac=1.0, random_state=RANDOM_STATE)
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    return df


def train_models(samples_per_class: int = 800):
    """
    Train both Isolation Forest (anomaly detection) and RandomForest (attack classifier).
    Saves all model artifacts to ml_artifacts/cicids2017/.
    """
    print("=" * 65)
    print("NetShield AI — ML Model Training Pipeline")
    print("=" * 65)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Generating synthetic CICIDS2017-compatible dataset...")

    df = build_synthetic_dataset(samples_per_class=samples_per_class)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Dataset generated: {len(df)} rows, {df.shape[1]} columns")
    print(f"  Class distribution:")
    for cls, cnt in df["Label"].value_counts().items():
        print(f"    {cls:30s} : {cnt}")

    # ── Directory Setup ────────────────────────────────────────────────────────
    output_dir = os.path.abspath("ml_artifacts/cicids2017")
    os.makedirs(output_dir, exist_ok=True)

    # ── Preprocessing ──────────────────────────────────────────────────────────
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Preprocessing features...")

    # Encode categorical feature (Protocol)
    proto_encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    proto_encoded = proto_encoder.fit_transform(df[["Protocol"]])
    proto_cols = [f"proto_{c}" for c in proto_encoder.categories_[0]]
    df_proto = pd.DataFrame(proto_encoded, columns=proto_cols, index=df.index)

    X_numeric = df[NUMERIC_FEATURES].astype(float)
    X = pd.concat([X_numeric, df_proto], axis=1)
    y = df["Label"].values

    # Scale numeric features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    all_feature_cols = NUMERIC_FEATURES + proto_cols

    # ── 1. Attack Classifier — RandomForest ────────────────────────────────────
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Training RandomForest Attack Classifier...")
    label_encoder = LabelEncoder()
    y_train_enc = label_encoder.fit_transform(y_train)
    y_test_enc = label_encoder.transform(y_test)

    clf = RandomForestClassifier(
        n_estimators=150, max_depth=20,
        random_state=RANDOM_STATE, n_jobs=-1
    )
    clf.fit(X_train, y_train_enc)
    y_pred_enc = clf.predict(X_test)
    y_pred = label_encoder.inverse_transform(y_pred_enc)

    # Binary metrics (attack vs benign)
    y_test_bin = (y_test != "BENIGN").astype(int)
    y_pred_bin = (y_pred != "BENIGN").astype(int)

    clf_acc = accuracy_score(y_test_enc, y_pred_enc)
    clf_prec = precision_score(y_test_bin, y_pred_bin, zero_division=0)
    clf_rec = recall_score(y_test_bin, y_pred_bin, zero_division=0)
    clf_f1 = f1_score(y_test_bin, y_pred_bin, zero_division=0)
    detection_rate = clf_rec
    fp_rate = 1 - clf_prec if clf_prec > 0 else 0

    print(f"  Accuracy:          {clf_acc:.4f}")
    print(f"  Precision:         {clf_prec:.4f}")
    print(f"  Recall:            {clf_rec:.4f}")
    print(f"  F1-score:          {clf_f1:.4f}")
    print(f"  Detection Rate:    {detection_rate:.4f}")
    print(f"  False Positive Rate: {fp_rate:.4f}")

    clf_metadata = {
        "model_name": "RandomForest Attack Classifier",
        "version": "1.0.0",
        "algorithm": "RandomForestClassifier",
        "dataset": "CICIDS2017 (Synthetic)",
        "is_synthetic": True,
        "trained_at": datetime.now().isoformat(),
        "n_samples_train": len(X_train),
        "n_samples_test": len(X_test),
        "attack_classes": list(label_encoder.classes_),
        "feature_names": all_feature_cols,
        "metrics": {
            "accuracy": round(float(clf_acc), 4),
            "precision": round(float(clf_prec), 4),
            "recall": round(float(clf_rec), 4),
            "f1_score": round(float(clf_f1), 4),
            "detection_rate": round(float(detection_rate), 4),
            "false_positive_rate": round(float(fp_rate), 4),
            "attack_classification_accuracy": round(float(clf_acc), 4),
        }
    }

    # Save classifier artifacts
    clf_path = os.path.join(output_dir, "attack_classifier.joblib")
    enc_path = os.path.join(output_dir, "label_encoder.joblib")
    scaler_path = os.path.join(output_dir, "feature_scaler.joblib")
    proto_enc_path = os.path.join(output_dir, "proto_encoder.joblib")
    clf_meta_path = os.path.join(output_dir, "classifier_metadata.json")

    joblib.dump(clf, clf_path)
    joblib.dump(label_encoder, enc_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(proto_encoder, proto_enc_path)

    with open(clf_meta_path, "w") as f:
        json.dump(clf_metadata, f, indent=2)

    print(f"  [OK] Saved attack_classifier.joblib")
    print(f"  [OK] Saved label_encoder.joblib")
    print(f"  [OK] Saved feature_scaler.joblib")
    print(f"  [OK] Saved classifier_metadata.json")

    # ── 2. Anomaly Detector — Isolation Forest ─────────────────────────────────
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Training Isolation Forest Anomaly Detector...")

    # Train only on BENIGN flows for a pure anomaly detector
    benign_mask = y_train == "BENIGN"
    X_train_benign = X_train[benign_mask]

    iforest = IsolationForest(
        n_estimators=150, contamination=0.05,
        random_state=RANDOM_STATE, n_jobs=-1
    )
    iforest.fit(X_train_benign)

    # Evaluate on test set
    y_scores_raw = iforest.score_samples(X_test)
    y_pred_iforest = iforest.predict(X_test)  # -1=anomaly, 1=normal
    y_pred_iforest_bin = (y_pred_iforest == -1).astype(int)  # 1=anomaly

    iso_prec = precision_score(y_test_bin, y_pred_iforest_bin, zero_division=0)
    iso_rec = recall_score(y_test_bin, y_pred_iforest_bin, zero_division=0)
    iso_f1 = f1_score(y_test_bin, y_pred_iforest_bin, zero_division=0)
    iso_acc = accuracy_score(y_test_bin, y_pred_iforest_bin)
    iso_fp_rate = 1 - iso_prec if iso_prec > 0 else 0

    print(f"  Accuracy:          {iso_acc:.4f}")
    print(f"  Precision:         {iso_prec:.4f}")
    print(f"  Recall:            {iso_rec:.4f}")
    print(f"  F1-score:          {iso_f1:.4f}")
    print(f"  Detection Rate:    {iso_rec:.4f}")
    print(f"  False Positive Rate: {iso_fp_rate:.4f}")

    iso_metadata = {
        "model_name": "Isolation Forest Anomaly Detector",
        "version": "1.0.0",
        "algorithm": "IsolationForest",
        "dataset": "CICIDS2017 (Synthetic)",
        "is_synthetic": True,
        "trained_at": datetime.now().isoformat(),
        "n_samples_benign_train": int(benign_mask.sum()),
        "n_samples_test": len(X_test),
        "feature_names": all_feature_cols,
        "metrics": {
            "accuracy": round(float(iso_acc), 4),
            "precision": round(float(iso_prec), 4),
            "recall": round(float(iso_rec), 4),
            "f1_score": round(float(iso_f1), 4),
            "detection_rate": round(float(iso_rec), 4),
            "false_positive_rate": round(float(iso_fp_rate), 4),
        }
    }

    iso_path = os.path.join(output_dir, "isolation_forest.joblib")
    iso_meta_path = os.path.join(output_dir, "metadata.json")

    joblib.dump(iforest, iso_path)
    with open(iso_meta_path, "w") as f:
        json.dump(iso_metadata, f, indent=2)

    # Save shared feature configuration
    feature_config = {
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "proto_categories": list(proto_encoder.categories_[0]),
        "all_feature_cols": all_feature_cols,
        "attack_classes": list(label_encoder.classes_),
    }
    feature_config_path = os.path.join(output_dir, "feature_config.json")
    with open(feature_config_path, "w") as f:
        json.dump(feature_config, f, indent=2)

    print(f"  [OK] Saved isolation_forest.joblib")
    print(f"  [OK] Saved metadata.json")
    print(f"  [OK] Saved feature_config.json")

    print(f"\n{'=' * 65}")
    print("Training Complete! All model artifacts saved to:")
    print(f"  {output_dir}")
    print("=" * 65)
    print("\nClassifier Metrics Summary:")
    print(json.dumps(clf_metadata["metrics"], indent=4))
    print("\nAnomaly Detector Metrics Summary:")
    print(json.dumps(iso_metadata["metrics"], indent=4))

    return clf_metadata, iso_metadata


if __name__ == "__main__":
    train_models(samples_per_class=800)
