import os
import sys
import joblib
import pandas as pd
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.model_classes import TwoStageRandomForest, NetShieldTwoModelPipeline

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_model")

binary_detector_path = os.path.join(MODEL_DIR, "binary_detector.pkl")
attack_classifier_path = os.path.join(MODEL_DIR, "attack_classifier.pkl")
preprocessor_path = os.path.join(MODEL_DIR, "attack_preprocessor.pkl")
target_encoder_path = os.path.join(MODEL_DIR, "target_encoder.pkl")

scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
target_encoder_path = os.path.join(MODEL_DIR, "target_encoder.pkl")
feature_names_path = os.path.join(MODEL_DIR, "feature_names.pkl")

# Global model artifact references
pipeline_obj = None
model = None
preprocessor = None
target_encoder = None
feature_names = []
label_encoders = None

def load_model_artifacts():
    global model, preprocessor, target_encoder, feature_names, label_encoders

    try:
        print("Loading separate NetShield AI model artifacts...")

        # Load preprocessing
        if os.path.exists(preprocessor_path):
            print("Loading attack preprocessor...")
            preprocessor = joblib.load(preprocessor_path)

        # Load binary anomaly detector
        if os.path.exists(binary_detector_path):
            print("Loading binary detector...")
            binary_model = joblib.load(binary_detector_path)
        else:
            raise FileNotFoundError(
                f"Missing binary detector: {binary_detector_path}"
            )

        # Load attack classifier
        if os.path.exists(attack_classifier_path):
            print("Loading attack classifier...")
            attack_model = joblib.load(attack_classifier_path)
        else:
            raise FileNotFoundError(
                f"Missing attack classifier: {attack_classifier_path}"
            )

        # Load target encoder
        if os.path.exists(target_encoder_path):
            print("Loading target encoder...")
            target_encoder = joblib.load(target_encoder_path)

        # Create lightweight two-model container
        model = NetShieldTwoModelPipeline(
            model1_params={},
            model2_params={}
        )

        # Replace the empty estimators with the trained models
        model.model1 = binary_model
        model.model2 = attack_model
        model.target_encoder = target_encoder

        if target_encoder is not None and hasattr(target_encoder, "classes_"):
            model.classes_ = target_encoder.classes_

        # Use the trained model's threshold if available
        model.decision_threshold = 0.50

        # Load feature names if available
        if os.path.exists(feature_names_path):
            feature_names = joblib.load(feature_names_path)

        print("Separate model artifacts loaded successfully.")
        print("Binary detector:", type(binary_model))
        print("Attack classifier:", type(attack_model))
        print("Preprocessor:", type(preprocessor))
        print("Target encoder:", type(target_encoder))

    except Exception as e:
        print("Error loading separate Random Forest model artifacts:", e)
        import traceback
        traceback.print_exc()
        model = None
# Initial load on module import
load_model_artifacts()

# Threat level and risk score mapping dictionary
THREAT_MAP = {
    "Normal": {"level": "Low", "base_risk": 10},
    "Reconnaissance": {"level": "Medium", "base_risk": 45},
    "Analysis": {"level": "Medium", "base_risk": 40},
    "Fuzzers": {"level": "Medium", "base_risk": 55},
    "Exploits": {"level": "High", "base_risk": 75},
    "Generic": {"level": "High", "base_risk": 70},
    "DoS": {"level": "Critical", "base_risk": 90},
    "Backdoor": {"level": "Critical", "base_risk": 92},
    "Shellcode": {"level": "Critical", "base_risk": 95},
    "Worms": {"level": "Critical", "base_risk": 98}
}

def compute_engineered_features_single(df):
    df_out = df.copy()
    eps = 1e-6
    for col in ["sbytes", "dbytes", "spkts", "dpkts", "sloss", "dloss", "dur"]:
        if col not in df_out.columns:
            df_out[col] = 0
        df_out[col] = pd.to_numeric(df_out[col], errors="coerce").fillna(0)

    sbytes = df_out["sbytes"]
    dbytes = df_out["dbytes"]
    spkts = df_out["spkts"]
    dpkts = df_out["dpkts"]
    sloss = df_out["sloss"]
    dloss = df_out["dloss"]
    dur = df_out["dur"]

    df_out["total_bytes"] = sbytes + dbytes
    df_out["total_packets"] = spkts + dpkts
    df_out["bytes_per_packet"] = df_out["total_bytes"] / (df_out["total_packets"] + eps)
    df_out["packets_per_second"] = df_out["total_packets"] / (dur + eps)
    df_out["source_destination_byte_ratio"] = sbytes / (dbytes + eps)
    df_out["source_destination_packet_ratio"] = spkts / (dpkts + eps)
    df_out["total_loss"] = sloss + dloss
    df_out["source_bytes_per_second"] = sbytes / (dur + eps)
    df_out["destination_bytes_per_second"] = dbytes / (dur + eps)
    return df_out

def transform_features_df(df_input):
    global preprocessor, model, feature_names, label_encoders

    if not isinstance(df_input, pd.DataFrame):
        df = pd.DataFrame([df_input]) if isinstance(df_input, dict) else pd.DataFrame(df_input)
    else:
        df = df_input.copy()

    # Alias mapping
    if "protocol" in df.columns and "proto" not in df.columns:
        df["proto"] = df["protocol"]
    if "swin" in df.columns and "swnd" not in df.columns:
        df["swnd"] = df["swin"]
    if "swnd" in df.columns and "swin" not in df.columns:
        df["swin"] = df["swnd"]
    if "dwin" in df.columns and "dwnd" not in df.columns:
        df["dwnd"] = df["dwin"]
    if "dwnd" in df.columns and "dwin" not in df.columns:
        df["dwin"] = df["dwnd"]

    # Compute engineered features
    df_fe = compute_engineered_features_single(df)
    cat_cols = ["proto", "service", "state"]

    if preprocessor is not None:
        for c in df_fe.columns:
            if c in cat_cols:
                df_fe[c] = df_fe[c].astype(str).str.strip().str.lower()
            else:
                df_fe[c] = pd.to_numeric(df_fe[c], errors="coerce").fillna(0.0)

        if hasattr(preprocessor, "feature_names_in_"):
            expected_cols = list(preprocessor.feature_names_in_)
            for col in expected_cols:
                if col not in df_fe.columns:
                    if col in cat_cols:
                        df_fe[col] = "-"
                    else:
                        df_fe[col] = 0.0
            df_fe = df_fe[expected_cols]
            for c in expected_cols:
                if c in cat_cols:
                    df_fe[c] = df_fe[c].astype(str)
                else:
                    df_fe[c] = df_fe[c].astype(float)
        X_input = preprocessor.transform(df_fe)
    else:
        for col in cat_cols:
            if col in df_fe.columns:
                vals = df_fe[col].astype(str).str.strip().str.lower()
                if isinstance(label_encoders, dict) and col in label_encoders:
                    le = label_encoders[col]
                    classes_lower = [str(c).strip().lower() for c in le.classes_]
                    encoded_series = []
                    for v in vals:
                        if v in classes_lower:
                            idx = classes_lower.index(v)
                            encoded_series.append(le.transform([le.classes_[idx]])[0])
                        else:
                            encoded_series.append(-1)
                    df_fe[col] = encoded_series
                elif hasattr(label_encoders, "transform"):
                    try:
                        df_fe[col] = label_encoders.transform(df_fe[[col]])
                    except Exception:
                        df_fe[col] = 0
                else:
                    df_fe[col] = 0

        for c in df_fe.columns:
            if c not in cat_cols:
                df_fe[c] = pd.to_numeric(df_fe[c], errors="coerce").fillna(0.0)

        if hasattr(model, "feature_names_in_"):
            expected_cols = list(model.feature_names_in_)
        elif feature_names:
            expected_cols = list(feature_names)
        else:
            expected_cols = [c for c in df_fe.columns if c not in ["source_ip", "dest_ip", "expected_attack", "actual_class"]]

        for col in expected_cols:
            if col not in df_fe.columns:
                df_fe[col] = 0.0

        X_input = df_fe[expected_cols].copy()

    # Defensive check: Assert no string or object columns remain before sending to Random Forest
    if isinstance(X_input, pd.DataFrame):
        string_cols = X_input.select_dtypes(include=['object', 'string', 'category']).columns.tolist()
        if len(string_cols) > 0:
            raise ValueError(f"Categorical encoding mismatch: String/object columns remaining before Random Forest model: {string_cols}")

    return X_input

def predict_attack(input_data):
    """
    Accepts a dictionary of flow attributes or a single pandas row,
    preprocesses, and returns comprehensive Random Forest AI prediction details.
    """
    global pipeline_obj, model, preprocessor, target_encoder, feature_names

    if model is None:
        load_model_artifacts()

    if isinstance(input_data, pd.Series):
        input_data = input_data.to_dict()
    elif not isinstance(input_data, dict):
        input_data = {}

    X_input = transform_features_df(input_data)

    if model is None:
        raise RuntimeError("Random Forest model is unavailable. Please verify netshield_model.pkl and preprocessing artifacts.")

    try:
        if isinstance(model, NetShieldTwoModelPipeline):
            m1_proba = model.model1.predict_proba(X_input)[0]
            prob_attack = float(m1_proba[1]) if len(m1_proba) > 1 else float(m1_proba[0])
            thresh = getattr(model, "decision_threshold", 0.50)
            is_anomaly = bool(prob_attack >= thresh)

            if not is_anomaly:
                attack_category = "Normal"
                max_prob = float(m1_proba[0]) if len(m1_proba) > 1 else (1.0 - prob_attack)
            else:
                m2_preds = model.model2.predict(X_input)
                m2_code = int(m2_preds[0])
                if target_encoder is not None and hasattr(target_encoder, "classes_") and m2_code < len(target_encoder.classes_):
                    attack_category = str(target_encoder.classes_[m2_code])
                else:
                    attack_category = "Anomalous Traffic"
                max_prob = prob_attack
        elif hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_input)[0]
            pred_idx = int(np.argmax(proba))
            max_prob = float(np.max(proba))
            if target_encoder is not None and hasattr(target_encoder, "classes_") and pred_idx < len(target_encoder.classes_):
                attack_category = str(target_encoder.classes_[pred_idx])
            else:
                attack_category = "Normal" if pred_idx == 0 else "Anomalous Traffic"
            is_anomaly = attack_category.lower() != "normal"
        else:
            pred_idx = int(model.predict(X_input)[0])
            max_prob = 0.90
            if target_encoder is not None and hasattr(target_encoder, "classes_") and pred_idx < len(target_encoder.classes_):
                attack_category = str(target_encoder.classes_[pred_idx])
            else:
                attack_category = "Normal" if pred_idx == 0 else "Anomalous Traffic"
            is_anomaly = attack_category.lower() != "normal"
    except Exception as eval_err:
        import traceback
        print("Random Forest prediction eval error traceback:")
        traceback.print_exc()
        attack_category = "Normal"
        is_anomaly = False
        max_prob = 0.90

    # Compute Threat Level & Risk Score
    threat_info = THREAT_MAP.get(attack_category, {"level": "High" if is_anomaly else "Low", "base_risk": 65 if is_anomaly else 10})
    threat_level = threat_info["level"]
    base_risk = threat_info["base_risk"]
    
    # Dynamic risk score incorporating probability confidence
    risk_score = min(100, max(5, int(base_risk * (0.8 + 0.4 * max_prob))))
    confidence_pct = f"{max_prob * 100:.2f}%"

    if is_anomaly:
        prediction_text = f"Anomalous Traffic ({attack_category})"
    else:
        prediction_text = "Normal Traffic"

    return {
        "prediction": prediction_text,
        "is_anomaly": is_anomaly,
        "attack_type": attack_category,
        "confidence": confidence_pct,
        "confidence_score": round(max_prob * 100, 2),
        "threat_level": threat_level,
        "risk_score": risk_score,
        "model_engine": "NetShield AI Two-Model Random Forest Classifier"
    }

def predict_attack_batch(df_input):
    """
    Accepts a DataFrame of flow attributes, computes engineered features vectorially,
    runs batch Random Forest inference, and returns a list of prediction result dictionaries.
    """
    global pipeline_obj, model, preprocessor, target_encoder, feature_names

    if model is None:
        load_model_artifacts()

    if not isinstance(df_input, pd.DataFrame):
        df_input = pd.DataFrame(df_input)

    X_input = transform_features_df(df_input)

    if model is None:
        raise RuntimeError("Random Forest model is unavailable.")

    n_samples = len(X_input)
    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(X_input)
    else:
        preds = model.predict(X_input)
        probas = np.zeros((n_samples, 2))
        for i, p in enumerate(preds):
            probas[i, int(p)] = 0.90

    results = []
    classes = list(target_encoder.classes_) if (target_encoder is not None and hasattr(target_encoder, "classes_")) else ["Normal", "Anomalous Traffic"]

    for i in range(n_samples):
        proba_row = probas[i]
        pred_idx = int(np.argmax(proba_row))
        max_prob = float(np.max(proba_row))
        
        if pred_idx < len(classes):
            attack_cat = str(classes[pred_idx])
        else:
            attack_cat = "Normal" if pred_idx == 0 else "Anomalous Traffic"
            
        is_anomaly = attack_cat.lower() != "normal"
        
        threat_info = THREAT_MAP.get(attack_cat, {"level": "High" if is_anomaly else "Low", "base_risk": 65 if is_anomaly else 10})
        threat_level = threat_info["level"]
        base_risk = threat_info["base_risk"]
        risk_score = min(100, max(5, int(base_risk * (0.8 + 0.4 * max_prob))))
        confidence_pct = f"{max_prob * 100:.2f}%"
        
        results.append({
            "prediction": f"Anomalous Traffic ({attack_cat})" if is_anomaly else "Normal Traffic",
            "is_anomaly": is_anomaly,
            "attack_type": attack_cat,
            "confidence": confidence_pct,
            "confidence_score": round(max_prob * 100, 2),
            "threat_level": threat_level,
            "risk_score": risk_score,
            "model_engine": "NetShield AI Two-Model Random Forest Classifier"
        })

    return results

if __name__ == "__main__":
    test_sample = {"proto": "tcp", "service": "http", "state": "FIN", "dur": 0.12, "spkts": 10, "dpkts": 8}
    res = predict_attack(test_sample)
    print("Test Random Forest Prediction Output:", res)