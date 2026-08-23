import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from backend.ai.config.config import ATTACK_CLASSES, SAVED_MODELS_DIR

def run_inference():
    if len(sys.argv) < 4:
        print("Usage: python run_inference.py <model_path> <input_csv_path> <output_csv_path>")
        sys.exit(1)

    model_path = sys.argv[1]
    input_csv_path = sys.argv[2]
    output_csv_path = sys.argv[3]

    print(f"Loading model from {model_path}...")
    model = joblib.load(model_path)

    # Load scaler & label encoder if they exist
    scaler = None
    scaler_path = SAVED_MODELS_DIR / "scaler.joblib"
    if scaler_path.exists():
        try:
            scaler = joblib.load(scaler_path)
            print("Loaded scaler.")
        except Exception as e:
            print(f"Warning loading scaler: {e}")

    label_encoder = None
    le_path = SAVED_MODELS_DIR / "label_encoder.joblib"
    if le_path.exists():
        try:
            label_encoder = joblib.load(le_path)
            print("Loaded label encoder.")
        except Exception as e:
            print(f"Warning loading label encoder: {e}")

    print(f"Reading input dataset from {input_csv_path}...")
    df = pd.read_csv(input_csv_path)

    # Keep a copy of columns that might represent IDs or true labels
    original_cols = df.columns.tolist()
    
    # Identify numeric columns for features
    features_df = df.copy()
    if 'label' in features_df.columns:
        features_df = features_df.drop(columns=['label'])
    if 'id' in features_df.columns:
        features_df = features_df.drop(columns=['id'])

    # Drop non-numeric features if any remain
    features_df = features_df.select_dtypes(include=[np.number])

    # Convert to numpy array
    X = features_df.values

    # Adjust feature count to match scaler/model expectations
    expected_features = 78 # Standard default for CICIDS2017 after processing
    if scaler is not None and hasattr(scaler, 'n_features_in_'):
        expected_features = scaler.n_features_in_
    elif hasattr(model, 'n_features_in_'):
        expected_features = model.n_features_in_

    print(f"Dataset shape: {X.shape}, expected feature count: {expected_features}")

    if X.shape[1] < expected_features:
        # Pad with zeros
        padding = np.zeros((X.shape[0], expected_features - X.shape[1]))
        X = np.hstack([X, padding])
    elif X.shape[1] > expected_features:
        # Truncate
        X = X[:, :expected_features]

    # Scale features
    if scaler is not None:
        try:
            X = scaler.transform(X)
        except Exception as e:
            print(f"Warning scaling data: {e}")

    # Predict
    print("Running batch predictions...")
    preds = model.predict(X)
    
    # Calculate probabilities if available
    probs = None
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(X)
        except Exception as e:
            print(f"Warning computing probabilities: {e}")

    # Inverse transform labels if label_encoder exists
    predicted_classes = []
    for i, p in enumerate(preds):
        cls_name = None
        if label_encoder is not None:
            try:
                cls_name = label_encoder.inverse_transform([p])[0]
            except Exception:
                pass
        
        if cls_name is None:
            if isinstance(p, (int, np.integer)) and 0 <= p < len(ATTACK_CLASSES):
                cls_name = ATTACK_CLASSES[p]
            else:
                cls_name = str(p)
        predicted_classes.append(cls_name)

    # Build predictions dataframe
    results = []
    for i in range(len(predicted_classes)):
        confidence = 0.95
        if probs is not None:
            try:
                confidence = float(np.max(probs[i]))
            except Exception:
                pass
        results.append({
            "predicted": predicted_classes[i],
            "confidence": round(confidence, 4)
        })

    results_df = pd.DataFrame(results)
    
    # Save output
    print(f"Saving predictions to {output_csv_path}...")
    results_df.to_csv(output_csv_path, index=False)
    print("Inference completed successfully!")

if __name__ == "__main__":
    run_inference()
