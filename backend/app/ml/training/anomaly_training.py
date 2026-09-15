import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.ensemble import IsolationForest
from app.ml.features.schema import CICIDS2017_FEATURE_SCHEMA, FeatureSchema
from app.ml.preprocessing.pipeline import PreprocessingPipeline, RANDOM_STATE
from app.ml.evaluation.metrics import ModelEvaluator

class AnomalyModelTrainer:
    def __init__(self, schema: FeatureSchema = CICIDS2017_FEATURE_SCHEMA):
        self.schema = schema
        self.pipeline = PreprocessingPipeline(schema)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=RANDOM_STATE,
            n_jobs=-1
        )

    def train_and_evaluate(
        self, df: pd.DataFrame, test_size: float = 0.2
    ) -> Tuple[Dict[str, Any], str, str]:
        # 1. Fit & Transform Training Split
        X_train, X_test, y_train, y_test = self.pipeline.fit_transform_training(df, test_size=test_size)

        # 2. Fit IsolationForest on Normal / Benign Training Flows
        # Convert y to binary int (1 for anomalous, 0 for benign)
        y_train_binary = np.where(y_train.astype(str).str.upper() != "BENIGN", 1, 0)
        y_test_binary = np.where(y_test.astype(str).str.upper() != "BENIGN", 1, 0)

        # Fit model on training features
        self.model.fit(X_train)

        # Predict anomaly decision (-1 for anomaly, 1 for normal)
        raw_preds = self.model.predict(X_test)
        y_pred = np.where(raw_preds == -1, 1, 0)

        # Compute raw decision score and convert to 0-1 anomaly score
        scores_raw = self.model.score_samples(X_test)
        # Normalize score samples (-1.0..0.0) to range (0.0..1.0)
        scores_norm = np.clip(1.0 - (scores_raw + 0.5), 0.0, 1.0)

        # 3. Evaluate Metrics
        metrics = ModelEvaluator.evaluate_binary_classification(y_test_binary, y_pred, scores_norm)
        metrics["model_name"] = "Isolation Forest Anomaly Baseline"
        metrics["version"] = "1.0.0"
        metrics["algorithm"] = "IsolationForest"
        metrics["dataset"] = self.schema.dataset_name

        # 4. Save Artifacts
        output_dir = os.path.abspath(f"ml_artifacts/{self.schema.dataset_name.lower()}")
        os.makedirs(output_dir, exist_ok=True)

        model_path = os.path.join(output_dir, "isolation_forest.joblib")
        pipeline_path = os.path.join(output_dir, "preprocessor_pipeline.joblib")
        metadata_path = os.path.join(output_dir, "metadata.json")

        joblib.dump(self.model, model_path)
        self.pipeline.save(pipeline_path)

        with open(metadata_path, "w") as f:
            json.dump(metrics, f, indent=2)

        return metrics, model_path, pipeline_path
