"""
NetShield AI — Milestone 4 AI Model Performance & Prediction Accuracy Validation
Tests Random Forest model against real network flow traffic.
Computes:
- Detection Accuracy
- Precision (Macro & Weighted)
- Recall (Macro & Weighted)
- F1-Score (Macro & Weighted)
- False Positive Rate (FPR)
- Confusion Matrix
- Per-Flow Inference Latency (ms)
"""

import os
import sys
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

def run_model_validation():
    print("=" * 70)
    print("NETSHIELD AI — MILESTONE 4: AI MODEL PERFORMANCE & VALIDATION")
    print("=" * 70)

    # 1. Path Setup
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'models')
    data_path = os.path.join(base_dir, 'uploads', 'test_sample.csv')

    model_file = os.path.join(models_dir, 'network_model.pkl')
    feat_file = os.path.join(models_dir, 'feature_names.pkl')
    label_file = os.path.join(models_dir, 'label_encoder.pkl')

    if not os.path.exists(model_file):
        model_file = os.path.join(models_dir, 'network_model_milestone2.pkl')
    if not os.path.exists(feat_file):
        feat_file = os.path.join(models_dir, 'feature_names_milestone2.pkl')
    if not os.path.exists(label_file):
        label_file = os.path.join(models_dir, 'label_encoder_milestone2.pkl')

    print(f"[*] Loading Model from: {os.path.basename(model_file)}")
    model = joblib.load(model_file)
    feature_names = joblib.load(feat_file)
    label_encoder = joblib.load(label_file)

    print(f"[*] Model Architecture: {type(model).__name__}")
    print(f"[*] Total Features Expected: {len(feature_names)}")
    print(f"[*] Target Classes: {list(label_encoder.classes_)}")

    # 2. Load Evaluation Data
    print(f"[*] Loading Test Flow Dataset: {os.path.basename(data_path)}")
    df = pd.read_csv(data_path)
    print(f"[*] Dataset Shape: {df.shape[0]} rows x {df.shape[1]} columns")

    label_col = None
    for c in ['Label', 'label', 'Attack_type', 'attack_type', 'class']:
        if c in df.columns:
            label_col = c
            break

    y_true_raw = df[label_col].astype(str).str.strip().values if label_col else None
    
    # 3. Preprocess Features
    meta_cols = ['Source IP', 'Destination IP', 'Protocol', 'source_ip', 'destination_ip', 'protocol', 'Label', 'label']
    feat_df = df.drop(columns=[c for c in meta_cols if c in df.columns], errors='ignore')

    # Match exact 78 features
    X = pd.DataFrame()
    for col in feature_names:
        if col in feat_df.columns:
            X[col] = pd.to_numeric(feat_df[col], errors='coerce').fillna(0)
        else:
            X[col] = 0.0

    X = X.replace([np.inf, -np.inf], 0).fillna(0)

    # 4. Inference & Latency Measurement
    print("\n[*] Executing Random Forest Inference...")
    start_time = time.perf_counter()
    y_pred_encoded = model.predict(X)
    elapsed_time = time.perf_counter() - start_time
    latency_per_sample_ms = (elapsed_time / len(X)) * 1000.0

    y_pred_labels = label_encoder.inverse_transform(y_pred_encoded)

    # 5. Calculate Metrics
    print("\n" + "=" * 70)
    print("QUANTITATIVE PERFORMANCE RESULTS")
    print("=" * 70)

    print(f"Total Flows Processed       : {len(X):,}")
    print(f"Inference Latency (Total)   : {elapsed_time*1000:.2f} ms")
    print(f"Inference Latency (Per Flow): {latency_per_sample_ms:.4f} ms/flow")
    print(f"Throughput                  : {len(X)/elapsed_time:.1f} flows/sec")

    if y_true_raw is not None:
        # Normalize labels to match encoder classes if case differences exist
        class_map = {c.lower(): c for c in label_encoder.classes_}
        y_true_mapped = [class_map.get(str(y).lower(), str(y)) for y in y_true_raw]

        acc = accuracy_score(y_true_mapped, y_pred_labels)
        prec = precision_score(y_true_mapped, y_pred_labels, average='weighted', zero_division=0)
        rec = recall_score(y_true_mapped, y_pred_labels, average='weighted', zero_division=0)
        f1 = f1_score(y_true_mapped, y_pred_labels, average='weighted', zero_division=0)

        # False Positive Rate (FPR) for Benign class
        cm = confusion_matrix(y_true_mapped, y_pred_labels, labels=label_encoder.classes_)
        
        benign_idx = None
        for i, c in enumerate(label_encoder.classes_):
            if c.upper() in ['BENIGN', 'NORMAL']:
                benign_idx = i
                break

        fpr = 0.0
        if benign_idx is not None and len(cm) > benign_idx:
            fp = cm[:, benign_idx].sum() - cm[benign_idx, benign_idx]
            tn = cm.sum() - (cm[benign_idx, :].sum() + cm[:, benign_idx].sum() - cm[benign_idx, benign_idx])
            fpr = (fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        print(f"\nDetection Accuracy          : {acc * 100:.2f}%")
        print(f"Weighted Precision          : {prec * 100:.2f}%")
        print(f"Weighted Recall             : {rec * 100:.2f}%")
        print(f"Weighted F1-Score           : {f1 * 100:.2f}%")
        print(f"False Positive Rate (FPR)   : {fpr * 100:.2f}%")

        print("\n--- Detailed Classification Report ---")
        print(classification_report(y_true_mapped, y_pred_labels, zero_division=0))

        # Milestone 4 Validation Criteria Checks
        print("--- Milestone 4 Evaluation Checks ---")
        assert acc >= 0.90, f"Accuracy {acc:.2f} failed threshold 0.90"
        print("[PASS] Accuracy > 90% Requirement Met")
        assert f1 >= 0.90, f"F1-Score {f1:.2f} failed threshold 0.90"
        print("[PASS] F1-Score > 90% Requirement Met")
        assert latency_per_sample_ms < 5.0, f"Latency {latency_per_sample_ms:.2f} ms failed threshold 5.0 ms"
        print("[PASS] Inference Latency < 5ms Requirement Met")
        print("[PASS] Milestone 4 Model Performance Validation COMPLETE!")

    print("=" * 70)
    return True

if __name__ == '__main__':
    run_model_validation()
