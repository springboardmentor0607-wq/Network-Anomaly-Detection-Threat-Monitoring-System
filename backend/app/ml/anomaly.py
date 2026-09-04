import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest
from .preprocessor import DataPreprocessor

class AnomalyDetector:
    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.model = IsolationForest(contamination=self.contamination, random_state=42, n_jobs=-1)
        self.is_fitted = False

    def fit(self, X: np.ndarray):
        self.model.fit(X)
        self.is_fitted = True
        model_dir = Path(__file__).resolve().parents[2] / "saved_models"
        model_dir.mkdir(exist_ok=True)
        joblib.dump(self.model, model_dir / "isolation_forest.joblib")

    def score(self, X_sample: np.ndarray) -> float:
        # Decision function: lower values mean more anomalous
        raw_score = self.model.decision_function(X_sample)[0]
        # Invert and normalize to 0.0 - 1.0 (Higher = more anomalous)
        norm_score = 1.0 / (1.0 + np.exp(raw_score * 4.0))
        return float(np.clip(norm_score, 0.01, 0.99))

    def evaluate_risk(self, predicted_class: str, confidence: float, anomaly_score: float):
        # Base risk by predicted category
        class_weights = {
            'NORMAL': 5.0,
            'PROBE': 65.0,
            'DOS': 90.0,
            'R2L': 85.0,
            'U2R': 95.0
        }
        base = class_weights.get(predicted_class, 10.0)
        risk_score = round(float(np.clip((base * confidence) + (anomaly_score * 20.0), 0.0, 100.0)), 2)

        if risk_score >= 90.0 or predicted_class in ['DOS', 'U2R']:
            severity = "Critical"
            action = "Block IP & Drop Traffic"
        elif risk_score >= 70.0 or predicted_class in ['PROBE', 'R2L']:
            severity = "High"
            action = "Quarantine & Alert SOC"
        elif risk_score >= 40.0:
            severity = "Medium"
            action = "Rate Limit & Deep Inspect"
        else:
            severity = "Low"
            action = "Allow Traffic"

        return risk_score, severity, action

    @staticmethod
    def load(filepath: str | None = None):
        filepath = filepath or str(Path(__file__).resolve().parents[2] / "saved_models" / "isolation_forest.joblib")
        if os.path.exists(filepath):
            instance = AnomalyDetector()
            instance.model = joblib.load(filepath)
            instance.is_fitted = True
            return instance
        return None