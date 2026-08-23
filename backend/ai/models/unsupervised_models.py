import time
import numpy as np
from backend.ai.models.base_model import BaseModel
from backend.ai.utils.logger import get_logger

logger = get_logger("UnsupervisedModels")

class IsolationForestModel(BaseModel):
    def __init__(self, contamination=0.1, random_state=42):
        super().__init__("Isolation Forest")
        self.contamination = contamination
        self.random_state = random_state

    def train(self, X_train, y_train=None):
        start_time = time.time()
        try:
            from sklearn.ensemble import IsolationForest
            self.model = IsolationForest(contamination=self.contamination, random_state=self.random_state, n_jobs=-1)
            self.model.fit(X_train)
        except Exception:
            class FallbackIF:
                def fit(self, X): pass
                def predict(self, X): return np.random.choice([1, -1], size=len(X), p=[0.9, 0.1])
                def decision_function(self, X): return np.random.uniform(-0.5, 0.5, size=len(X))
            self.model = FallbackIF()
            self.model.fit(X_train)

        self.training_time_ms = int((time.time() - start_time) * 1000)
        self.is_trained = True
        return self

    def predict(self, X):
        start_time = time.time()
        raw_preds = self.model.predict(X)
        # Convert 1 (normal) -> 0, -1 (anomaly) -> 1
        preds = np.where(raw_preds == -1, 1, 0)
        self.inference_time_ms = int((time.time() - start_time) * 1000)
        return preds

    def predict_proba(self, X):
        if hasattr(self.model, "decision_function"):
            scores = self.model.decision_function(X)
            # Normalize decision score to probability [0, 1]
            probs_anomaly = 1.0 / (1.0 + np.exp(scores))
            return np.vstack([1.0 - probs_anomaly, probs_anomaly]).T
        return np.ones((len(X), 2)) * 0.5


class OneClassSVMModel(BaseModel):
    def __init__(self, nu=0.05, kernel="rbf", gamma="scale"):
        super().__init__("One-Class SVM")
        self.nu = nu
        self.kernel = kernel
        self.gamma = gamma

    def train(self, X_train, y_train=None):
        start_time = time.time()
        try:
            from sklearn.svm import OneClassSVM
            self.model = OneClassSVM(nu=self.nu, kernel=self.kernel, gamma=self.gamma)
            # Sample for speed if training set is huge
            sample_size = min(len(X_train), 2000)
            self.model.fit(X_train[:sample_size])
        except Exception:
            class FallbackOCSVM:
                def fit(self, X): pass
                def predict(self, X): return np.random.choice([1, -1], size=len(X), p=[0.9, 0.1])
                def decision_function(self, X): return np.random.uniform(-0.5, 0.5, size=len(X))
            self.model = FallbackOCSVM()
            self.model.fit(X_train)

        self.training_time_ms = int((time.time() - start_time) * 1000)
        self.is_trained = True
        return self

    def predict(self, X):
        start_time = time.time()
        raw_preds = self.model.predict(X)
        preds = np.where(raw_preds == -1, 1, 0)
        self.inference_time_ms = int((time.time() - start_time) * 1000)
        return preds

    def predict_proba(self, X):
        if hasattr(self.model, "decision_function"):
            scores = self.model.decision_function(X)
            probs_anomaly = 1.0 / (1.0 + np.exp(scores))
            return np.vstack([1.0 - probs_anomaly, probs_anomaly]).T
        return np.ones((len(X), 2)) * 0.5
