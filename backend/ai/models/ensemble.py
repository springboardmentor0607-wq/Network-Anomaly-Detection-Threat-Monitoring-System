import joblib
from typing import List
import numpy as np
from pathlib import Path
from backend.ai.models.base_model import BaseModel

class EnsembleModel(BaseModel):
    """Simple majority‑vote ensemble for binary classification.

    Expects a list of already‑trained BaseModel instances.
    """
    def __init__(self, models: List[BaseModel]):
        super().__init__("Ensemble")
        self.models = models
        self.is_trained = False

    def train(self, X_train, y_train=None):
        # Individual models are already trained; just mark as trained.
        self.is_trained = True
        return self

    def predict(self, X):
        # Majority vote across model predictions (binary 0/1).
        preds = [model.predict(X) for model in self.models]
        stacked = np.vstack(preds)
        majority = (stacked.sum(axis=0) >= (len(self.models) / 2)).astype(int)
        return majority

    def predict_proba(self, X):
        # Average predicted probabilities across models.
        probas = [model.predict_proba(X) for model in self.models]
        avg_proba = np.mean(probas, axis=0)
        return avg_proba

    def save(self, path: Path):
        joblib.dump(self, path)
        return path
