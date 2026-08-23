from abc import ABC, abstractmethod
import time
import joblib

class BaseModel(ABC):
    def __init__(self, model_name):
        self.model_name = model_name
        self.model = None
        self.is_trained = False
        self.training_time_ms = 0
        self.inference_time_ms = 0

    @abstractmethod
    def train(self, X_train, y_train):
        pass

    @abstractmethod
    def predict(self, X):
        pass

    @abstractmethod
    def predict_proba(self, X):
        pass

    def save(self, filepath):
        if self.model is not None:
            joblib.dump(self.model, filepath)
            return True
        return False

    def load(self, filepath):
        self.model = joblib.load(filepath)
        self.is_trained = True
        return self
