import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from app.ml.features.schema import CICIDS2017_FEATURE_SCHEMA, FeatureSchema
from app.ml.preprocessing.pipeline import PreprocessingPipeline, RANDOM_STATE
from app.ml.evaluation.metrics import ModelEvaluator

class ClassifierModelTrainer:
    def __init__(self, schema: FeatureSchema = CICIDS2017_FEATURE_SCHEMA):
        self.schema = schema
        self.pipeline = PreprocessingPipeline(schema)
        self.label_encoder = LabelEncoder()
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=RANDOM_STATE,
            n_jobs=-1
        )

    def train_and_evaluate(
        self, df: pd.DataFrame, test_size: float = 0.2
    ) -> Tuple[Dict[str, Any], str, str, str]:
        # 1. Fit & Transform Training Split
        X_train, X_test, y_train_raw, y_test_raw = self.pipeline.fit_transform_training(df, test_size=test_size)

        # 2. Encode Multiclass Target Labels
        y_train_encoded = self.label_encoder.fit_transform(y_train_raw.astype(str).str.strip())
        y_test_encoded = self.label_encoder.transform(y_test_raw.astype(str).str.strip())

        # 3. Train Multiclass Classifier
        self.model.fit(X_train, y_train_encoded)

        # 4. Predictions & Probabilities
        y_pred_encoded = self.model.predict(X_test)
        y_probs = self.model.predict_proba(X_test)
        max_probs = np.max(y_probs, axis=1)

        # Evaluate binary/multiclass metrics
        y_test_binary = np.where(y_test_encoded != 0, 1, 0)
        y_pred_binary = np.where(y_pred_encoded != 0, 1, 0)
        metrics = ModelEvaluator.evaluate_binary_classification(y_test_binary, y_pred_binary, max_probs)

        classes_list = [str(c) for c in self.label_encoder.classes_]
        metrics["model_name"] = "Multi-Class Attack Classifier Baseline"
        metrics["version"] = "1.0.0"
        metrics["algorithm"] = "RandomForest"
        metrics["dataset"] = self.schema.dataset_name
        metrics["attack_classes"] = classes_list

        # 5. Save Artifacts
        output_dir = os.path.abspath(f"ml_artifacts/{self.schema.dataset_name.lower()}")
        os.makedirs(output_dir, exist_ok=True)

        model_path = os.path.join(output_dir, "attack_classifier.joblib")
        encoder_path = os.path.join(output_dir, "label_encoder.joblib")
        metadata_path = os.path.join(output_dir, "classifier_metadata.json")

        joblib.dump(self.model, model_path)
        joblib.dump(self.label_encoder, encoder_path)

        with open(metadata_path, "w") as f:
            json.dump(metrics, f, indent=2)

        return metrics, model_path, encoder_path, metadata_path
