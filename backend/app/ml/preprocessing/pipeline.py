import os
import joblib
import pandas as pd
import numpy as np
from typing import Tuple, List, Optional
from sklearn.model_selection import train_test_split
from app.ml.features.schema import FeatureSchema
from app.ml.features.extractor import FeatureExtractor
from app.ml.preprocessing.cleaner import DataCleaner
from app.ml.preprocessing.encoder import CategoricalEncoder
from app.ml.preprocessing.scaler import NumericScaler

RANDOM_STATE = 42

class PreprocessingPipeline:
    def __init__(self, schema: FeatureSchema):
        self.schema = schema
        self.encoder = CategoricalEncoder(schema.categorical_features)
        self.scaler = NumericScaler(schema.numeric_features)
        self.is_fitted = False
        self.feature_columns: List[str] = []

    def fit_transform_training(
        self, df: pd.DataFrame, test_size: float = 0.2
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        # 1. Feature Extraction
        df_extracted = FeatureExtractor.extract_derived_features(df)

        # 2. Cleaning
        df_clean = DataCleaner.clean_dataframe(df_extracted, self.schema.numeric_features)

        # Separate Features & Target
        if self.schema.target_column not in df_clean.columns:
            raise ValueError(f"Target column '{self.schema.target_column}' not found in dataframe")

        X_raw = df_clean[self.schema.numeric_features + self.schema.categorical_features]
        y_raw = df_clean[self.schema.target_column]

        # 3. Train/Test Split BEFORE fitting preprocessors (Zero ML Data Leakage)
        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            X_raw, y_raw, test_size=test_size, random_state=RANDOM_STATE
        )

        # 4. Fit Encoders & Scalers strictly on Training Split
        self.encoder.fit(X_train_raw)
        self.scaler.fit(X_train_raw)
        self.is_fitted = True

        # 5. Transform Train Split
        X_train_num = self.scaler.transform(X_train_raw)
        X_train_cat = self.encoder.transform(X_train_raw)
        X_train_processed = pd.concat([X_train_num, X_train_cat], axis=1)
        self.feature_columns = list(X_train_processed.columns)

        # 6. Transform Test Split using pre-fitted parameters
        X_test_num = self.scaler.transform(X_test_raw)
        X_test_cat = self.encoder.transform(X_test_raw)
        X_test_processed = pd.concat([X_test_num, X_test_cat], axis=1)

        return X_train_processed, X_test_processed, y_train, y_test

    def transform_inference(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_fitted:
            raise ValueError("PreprocessingPipeline must be fitted or loaded before calling transform_inference()")

        df_extracted = FeatureExtractor.extract_derived_features(df)
        df_clean = DataCleaner.clean_dataframe(df_extracted, self.schema.numeric_features)

        num_df = self.scaler.transform(df_clean)
        cat_df = self.encoder.transform(df_clean)

        processed = pd.concat([num_df, cat_df], axis=1)
        return processed[self.feature_columns]

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)

    @staticmethod
    def load(filepath: str) -> 'PreprocessingPipeline':
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Pipeline artifact not found at {filepath}")
        return joblib.load(filepath)
