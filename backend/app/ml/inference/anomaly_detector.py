"""
Anomaly Detector — Loads trained Isolation Forest model artifacts and detects
anomalous network flows using the trained model or heuristic fallback.
"""
import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional


class AnomalyDetector:
    def __init__(self, dataset_name: str = "cicids2017"):
        self.dataset_name = dataset_name.lower()
        self.model = None
        self.scaler = None
        self.proto_encoder = None
        self.feature_config: Optional[Dict] = None
        self.is_loaded = False
        self.load_artifacts()

    def _get_artifact_dir(self) -> str:
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
        model_path = os.path.join(dir_path, "isolation_forest.joblib")
        scaler_path = os.path.join(dir_path, "feature_scaler.joblib")
        proto_enc_path = os.path.join(dir_path, "proto_encoder.joblib")
        feature_config_path = os.path.join(dir_path, "feature_config.json")

        try:
            if all(os.path.exists(p) for p in [model_path, scaler_path, feature_config_path]):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                if os.path.exists(proto_enc_path):
                    self.proto_encoder = joblib.load(proto_enc_path)
                with open(feature_config_path) as f:
                    self.feature_config = json.load(f)
                self.is_loaded = True
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"AnomalyDetector: Failed to load artifacts: {e}")
            self.is_loaded = False

    def _prepare_features(self, df_flow: pd.DataFrame) -> np.ndarray:
        numeric_features = self.feature_config["numeric_features"]
        proto_categories = self.feature_config.get("proto_categories", [])
        packets = float(df_flow.get("packets", pd.Series([1])).iloc[0]) if "packets" in df_flow.columns else 1.0
        bytes_val = float(df_flow.get("bytes", pd.Series([500])).iloc[0]) if "bytes" in df_flow.columns else 500.0
        duration = float(df_flow.get("duration", pd.Series([1])).iloc[0]) if "duration" in df_flow.columns else 1.0
        dst_port = float(df_flow.get("destination_port", pd.Series([80])).iloc[0]) if "destination_port" in df_flow.columns else 80.0

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

        num_arr = np.array([[derivations.get(f, 0.0) for f in numeric_features]], dtype=float)

        if self.proto_encoder and proto_categories:
            protocol = str(df_flow.get("Protocol", pd.Series(["TCP"])).iloc[0] if "Protocol" in df_flow.columns else "TCP")
            proto_arr = self.proto_encoder.transform([[protocol]])
        else:
            proto_arr = np.zeros((1, len(proto_categories)))

        X = np.hstack([num_arr, proto_arr])
        return self.scaler.transform(X)

    def predict_flow(self, df_flow: pd.DataFrame) -> Tuple[float, bool, Dict[str, Any]]:
        """
        Detect whether a network flow is anomalous.
        Returns: (anomaly_score 0.0-1.0, is_anomaly, contributing_features_dict)
        """
        if not self.is_loaded:
            return self._heuristic_detect(df_flow)

        try:
            X = self._prepare_features(df_flow)
            raw_pred = self.model.predict(X)[0]
            is_anomaly = bool(raw_pred == -1)
            raw_score = float(self.model.score_samples(X)[0])
            # Map raw IsolationForest score to [0, 1] where higher = more anomalous
            anomaly_score = float(np.clip(1.0 - (raw_score + 0.5), 0.0, 1.0))
            top_features = {"anomaly_score_raw": round(raw_score, 4)}
            return round(anomaly_score, 4), is_anomaly, top_features
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"AnomalyDetector prediction error: {e}")
            return self._heuristic_detect(df_flow)

    def _heuristic_detect(self, df_flow: pd.DataFrame) -> Tuple[float, bool, Dict[str, Any]]:
        """Heuristic fallback when model artifacts are not available."""
        packets = float(df_flow.get("packets", pd.Series([1])).iloc[0]) if "packets" in df_flow.columns else 1.0
        bytes_val = float(df_flow.get("bytes", pd.Series([500])).iloc[0]) if "bytes" in df_flow.columns else 500.0
        score = min(1.0, (packets * 0.0003) + (bytes_val * 0.000005))
        is_anomaly = score >= 0.6
        return round(score, 4), is_anomaly, {"mode": "heuristic", "reason": "model_not_loaded"}

    def get_model_info(self) -> Dict[str, Any]:
        if not self.is_loaded:
            return {"status": "not_loaded", "model": "Isolation Forest"}
        dir_path = self._get_artifact_dir()
        meta_path = os.path.join(dir_path, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                return json.load(f)
        return {"status": "loaded", "model": "Isolation Forest"}
