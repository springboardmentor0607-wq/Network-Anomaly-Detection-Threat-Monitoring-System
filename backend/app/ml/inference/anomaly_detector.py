import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from app.ml.preprocessing.pipeline import PreprocessingPipeline
from app.ml.features.schema import CICIDS2017_FEATURE_SCHEMA, FeatureSchema

class AnomalyDetector:
    def __init__(self, dataset_name: str = "cicids2017"):
        self.dataset_name = dataset_name.lower()
        self.model = None
        self.pipeline = None
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        dir_path = os.path.abspath(f"ml_artifacts/{self.dataset_name}")
        model_path = os.path.join(dir_path, "isolation_forest.joblib")
        pipeline_path = os.path.join(dir_path, "preprocessor_pipeline.joblib")

        if os.path.exists(model_path) and os.path.exists(pipeline_path):
            self.model = joblib.load(model_path)
            self.pipeline = PreprocessingPipeline.load(pipeline_path)
            self.is_loaded = True

    def predict_flow(self, df_flow: pd.DataFrame) -> Tuple[float, bool, Dict[str, Any]]:
        if not self.is_loaded:
            # Fallback heuristic calculation if model binary artifact isn't pre-trained yet
            packets = float(df_flow.get("packets", [1])[0] if "packets" in df_flow else 1)
            bytes_val = float(df_flow.get("bytes", [100])[0] if "bytes" in df_flow else 100)
            score = min(1.0, (packets * 0.001) + (bytes_val * 0.00001))
            is_anomaly = score >= 0.65
            return round(score, 4), is_anomaly, {"heuristic_reason": "Pre-trained model binary loading pending"}

        # Transform features using preprocessor
        X_processed = self.pipeline.transform_inference(df_flow)

        raw_pred = self.model.predict(X_processed)[0]
        is_anomaly = bool(raw_pred == -1)

        raw_score = float(self.model.score_samples(X_processed)[0])
        # Map raw score sample to 0.0..1.0 score
        anomaly_score = float(np.clip(1.0 - (raw_score + 0.5), 0.0, 1.0))

        # Top feature deviations
        feature_vals = X_processed.iloc[0].to_dict()
        top_features = dict(sorted(feature_vals.items(), key=lambda item: abs(item[1]), reverse=True)[:3])

        return round(anomaly_score, 4), is_anomaly, top_features
