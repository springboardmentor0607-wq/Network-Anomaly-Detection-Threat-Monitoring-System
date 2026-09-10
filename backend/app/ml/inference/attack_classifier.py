"""
Attack Classifier — Loads trained RandomForest model artifacts and performs
multi-class attack prediction on CICIDS2017-format network flow data.
"""
import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, Optional, List


class AttackClassifier:
    def __init__(self, dataset_name: str = "cicids2017"):
        self.dataset_name = dataset_name.lower()
        self.model = None
        self.label_encoder = None
        self.scaler = None
        self.proto_encoder = None
        self.feature_config: Optional[Dict] = None
        self.is_loaded = False
        self.load_artifacts()

    def _get_artifact_dir(self) -> str:
        # Support both development (run from backend/) and production paths
        candidates = [
            os.path.abspath(f"ml_artifacts/{self.dataset_name}"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml_artifacts", self.dataset_name),
        ]
        for d in candidates:
            if os.path.isdir(d):
                return d
        return candidates[0]

    def load_artifacts(self):
        dir_path = self._get_artifact_dir()
        model_path = os.path.join(dir_path, "attack_classifier.joblib")
        encoder_path = os.path.join(dir_path, "label_encoder.joblib")
        scaler_path = os.path.join(dir_path, "feature_scaler.joblib")
        proto_enc_path = os.path.join(dir_path, "proto_encoder.joblib")
        feature_config_path = os.path.join(dir_path, "feature_config.json")

        try:
            if all(os.path.exists(p) for p in [model_path, encoder_path, scaler_path, feature_config_path]):
                self.model = joblib.load(model_path)
                self.label_encoder = joblib.load(encoder_path)
                self.scaler = joblib.load(scaler_path)
                if os.path.exists(proto_enc_path):
                    self.proto_encoder = joblib.load(proto_enc_path)
                with open(feature_config_path) as f:
                    self.feature_config = json.load(f)
                self.is_loaded = True
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"AttackClassifier: Failed to load artifacts from {dir_path}: {e}")
            self.is_loaded = False

    def _prepare_features(self, df_flow: pd.DataFrame) -> np.ndarray:
        """Prepare features for inference matching the training feature set."""
        numeric_features = self.feature_config["numeric_features"]
        proto_categories = self.feature_config.get("proto_categories", [])

        # Build numeric feature vector with fallbacks
        num_data = {}
        for feat in numeric_features:
            if feat in df_flow.columns:
                num_data[feat] = float(df_flow[feat].iloc[0])
            else:
                # Derive from available columns
                num_data[feat] = self._derive_feature(feat, df_flow)

        num_arr = np.array([[num_data[f] for f in numeric_features]], dtype=float)

        # Build protocol one-hot vector
        if self.proto_encoder and proto_categories:
            protocol = str(df_flow.get("Protocol", ["TCP"]).iloc[0] if "Protocol" in df_flow.columns else "TCP")
            proto_arr = self.proto_encoder.transform([[protocol]])
        else:
            proto_arr = np.zeros((1, len(proto_categories)))

        X = np.hstack([num_arr, proto_arr])

        # Scale using fitted scaler
        X_scaled = self.scaler.transform(X)
        return X_scaled

    def _derive_feature(self, feature_name: str, df: pd.DataFrame) -> float:
        """Derive missing features from available network flow data."""
        packets = float(df.get("packets", pd.Series([1])).iloc[0]) if "packets" in df.columns else 1.0
        bytes_val = float(df.get("bytes", pd.Series([500])).iloc[0]) if "bytes" in df.columns else 500.0
        duration = float(df.get("duration", pd.Series([1])).iloc[0]) if "duration" in df.columns else 1.0
        dst_port = float(df.get("destination_port", pd.Series([80])).iloc[0]) if "destination_port" in df.columns else 80.0

        derivations = {
            "Destination Port": dst_port,
            "Flow Duration": duration * 1_000_000,
            "Total Fwd Packets": packets,
            "Total Backward Packets": packets * 0.8,
            "Total Length of Fwd Packets": bytes_val,
            "Total Length of Bwd Packets": bytes_val * 0.8,
            "Flow Bytes/s": bytes_val / max(duration, 0.001),
            "Flow Packets/s": packets / max(duration, 0.001),
            "Average Packet Size": bytes_val / max(packets, 1),
        }
        return derivations.get(feature_name, 0.0)

    def predict_attack(self, df_flow: pd.DataFrame) -> Tuple[str, float, Dict[str, float]]:
        """
        Predict attack class for a network flow.
        Returns: (predicted_class, confidence, class_probability_map)
        """
        if not self.is_loaded:
            # Fallback heuristic when model is not trained yet
            return self._heuristic_predict(df_flow)

        try:
            X = self._prepare_features(df_flow)
            pred_idx = self.model.predict(X)[0]
            predicted_class = str(self.label_encoder.inverse_transform([pred_idx])[0])
            probs = self.model.predict_proba(X)[0]
            confidence = float(np.max(probs))
            class_names = [str(c) for c in self.label_encoder.classes_]
            class_prob_map = {class_names[i]: round(float(probs[i]), 4) for i in range(len(class_names))}
            return predicted_class, round(confidence, 4), class_prob_map
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"AttackClassifier prediction error: {e}")
            return self._heuristic_predict(df_flow)

    def _heuristic_predict(self, df_flow: pd.DataFrame) -> Tuple[str, float, Dict[str, float]]:
        """Heuristic fallback when model artifacts are not available."""
        packets = float(df_flow.get("packets", pd.Series([1])).iloc[0]) if "packets" in df_flow.columns else 1.0
        if packets > 3000:
            return "DoS SYN Flood", 0.89, {"DoS SYN Flood": 0.89, "BENIGN": 0.11}
        elif packets > 500:
            return "Port Scan", 0.76, {"Port Scan": 0.76, "BENIGN": 0.24}
        else:
            return "BENIGN", 0.96, {"BENIGN": 0.96}

    def get_model_info(self) -> Dict[str, Any]:
        """Return model metadata."""
        if not self.is_loaded:
            return {"status": "not_loaded", "model": "RandomForest Attack Classifier"}
        dir_path = self._get_artifact_dir()
        meta_path = os.path.join(dir_path, "classifier_metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                return json.load(f)
        return {"status": "loaded", "model": "RandomForest Attack Classifier", "attack_classes": list(self.label_encoder.classes_)}
