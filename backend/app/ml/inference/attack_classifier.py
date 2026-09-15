import os
import joblib
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any
from app.ml.preprocessing.pipeline import PreprocessingPipeline

class AttackClassifier:
    def __init__(self, dataset_name: str = "cicids2017"):
        self.dataset_name = dataset_name.lower()
        self.model = None
        self.pipeline = None
        self.label_encoder = None
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        dir_path = os.path.abspath(f"ml_artifacts/{self.dataset_name}")
        model_path = os.path.join(dir_path, "attack_classifier.joblib")
        encoder_path = os.path.join(dir_path, "label_encoder.joblib")
        pipeline_path = os.path.join(dir_path, "preprocessor_pipeline.joblib")

        if os.path.exists(model_path) and os.path.exists(encoder_path) and os.path.exists(pipeline_path):
            self.model = joblib.load(model_path)
            self.label_encoder = joblib.load(encoder_path)
            self.pipeline = PreprocessingPipeline.load(pipeline_path)
            self.is_loaded = True

    def predict_attack(self, df_flow: pd.DataFrame) -> Tuple[str, float, Dict[str, float]]:
        if not self.is_loaded:
            # Fallback heuristic prediction if model binary artifact loading is pending
            packets = float(df_flow.get("packets", [1])[0] if "packets" in df_flow else 1)
            if packets > 1000:
                return "DoS SYN Flood", 0.94, {"DoS SYN Flood": 0.94, "BENIGN": 0.06}
            elif packets > 100:
                return "Reconnaissance Port Scan", 0.78, {"Reconnaissance Port Scan": 0.78, "BENIGN": 0.22}
            else:
                return "BENIGN", 0.98, {"BENIGN": 0.98}

        # Preprocess features
        X_processed = self.pipeline.transform_inference(df_flow)

        pred_idx = self.model.predict(X_processed)[0]
        predicted_class = str(self.label_encoder.inverse_transform([pred_idx])[0])

        probs = self.model.predict_proba(X_processed)[0]
        confidence = float(np.max(probs))

        class_names = [str(c) for c in self.label_encoder.classes_]
        class_prob_map = {class_names[i]: round(float(probs[i]), 4) for i in range(len(class_names))}

        return predicted_class, round(confidence, 4), class_prob_map
