import numpy as np
import pandas as pd

class FeatureSelector:
    def __init__(self):
        self.scaler = None
        self.label_encoder = None
        self.selected_features = []

    def fit_transform(self, X_train, y_train):
        """
        Fits feature scaler and handles categorical variables.
        """
        try:
            from sklearn.preprocessing import StandardScaler, LabelEncoder
            self.scaler = StandardScaler()
            self.label_encoder = LabelEncoder()

            X_scaled = self.scaler.fit_transform(X_train)
            y_encoded = self.label_encoder.fit_transform(y_train)

            self.selected_features = list(X_train.columns) if isinstance(X_train, pd.DataFrame) else [f"feature_{i}" for i in range(X_train.shape[1])]
            return X_scaled, y_encoded
        except Exception:
            # Fallback scaling
            X_scaled = (X_train - X_train.mean()) / (X_train.std() + 1e-8)
            return X_scaled.values if isinstance(X_scaled, pd.DataFrame) else X_scaled, y_train.values

    def transform(self, X_test):
        """
        Transforms test or prediction features using fitted scaler.
        """
        if self.scaler is not None:
            try:
                return self.scaler.transform(X_test)
            except Exception:
                pass
        return X_test.values if isinstance(X_test, pd.DataFrame) else X_test
