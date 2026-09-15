import os
import numpy as np
import pandas as pd
import pytest
from app.ml.features.schema import CICIDS2017_FEATURE_SCHEMA
from app.ml.features.extractor import FeatureExtractor
from app.ml.preprocessing.cleaner import DataCleaner
from app.ml.preprocessing.pipeline import PreprocessingPipeline

def test_data_cleaner():
    raw_data = {
        "Destination Port": [80, 443, np.nan, -10],
        "Flow Duration": [1000, np.inf, 2000, -500],
        "Total Fwd Packets": [10, 5, 2, 1],
        "Total Backward Packets": [2, 1, 0, 0],
        "Total Length of Fwd Packets": [500, 200, 100, 50],
        "Total Length of Bwd Packets": [200, 100, 0, 0],
        "Protocol": [6, 17, 6, 6],
        "Label": ["BENIGN", "BENIGN", "DoS", "BENIGN"]
    }
    df = pd.DataFrame(raw_data)
    cleaned_df = DataCleaner.clean_dataframe(df, CICIDS2017_FEATURE_SCHEMA.numeric_features)

    # Assert zero NaNs or Infs remaining
    assert cleaned_df["Destination Port"].isnull().sum() == 0
    assert cleaned_df["Flow Duration"].isnull().sum() == 0
    assert (cleaned_df["Flow Duration"] < 0).sum() == 0  # Clipped lower bound

def test_feature_extractor():
    raw_data = {
        "Destination Port": [80],
        "Flow Duration": [1000000],  # 1 second
        "Total Fwd Packets": [10],
        "Total Backward Packets": [10],
        "Total Length of Fwd Packets": [500],
        "Total Length of Bwd Packets": [500],
        "Protocol": [6],
        "Label": ["BENIGN"]
    }
    df = pd.DataFrame(raw_data)
    extracted = FeatureExtractor.extract_derived_features(df)

    assert "Flow Bytes/s" in extracted.columns
    assert "Flow Packets/s" in extracted.columns
    assert "Average Packet Size" in extracted.columns
    assert extracted["Average Packet Size"].iloc[0] == pytest.approx(50.0)

def test_zero_data_leakage_and_serialization(tmp_path):
    # Generate mock dataframe
    n_samples = 100
    df = pd.DataFrame({
        "Destination Port": np.random.choice([80, 443, 8080], n_samples),
        "Flow Duration": np.random.uniform(1000, 5000000, n_samples),
        "Total Fwd Packets": np.random.randint(1, 100, n_samples),
        "Total Backward Packets": np.random.randint(0, 50, n_samples),
        "Total Length of Fwd Packets": np.random.randint(100, 10000, n_samples),
        "Total Length of Bwd Packets": np.random.randint(0, 5000, n_samples),
        "Protocol": np.random.choice([6, 17], n_samples),
        "Label": np.random.choice(["BENIGN", "DoS SYN Flood"], n_samples)
    })

    pipeline = PreprocessingPipeline(CICIDS2017_FEATURE_SCHEMA)
    X_train, X_test, y_train, y_test = pipeline.fit_transform_training(df, test_size=0.2)

    assert len(X_train) == 80
    assert len(X_test) == 20
    assert len(y_train) == 80
    assert len(y_test) == 20
    assert pipeline.is_fitted

    # Test artifact save & load
    artifact_path = os.path.join(tmp_path, "preprocessor.joblib")
    pipeline.save(artifact_path)
    assert os.path.exists(artifact_path)

    loaded_pipeline = PreprocessingPipeline.load(artifact_path)
    assert loaded_pipeline.is_fitted

    # Test inference transformation
    sample_inference_df = df.iloc[:5].drop(columns=["Label"])
    processed_inference = loaded_pipeline.transform_inference(sample_inference_df)
    assert processed_inference.shape[0] == 5
    assert list(processed_inference.columns) == loaded_pipeline.feature_columns
