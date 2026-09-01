import os
import pandas as pd
from app.ml.features.schema import CICIDS2017_FEATURE_SCHEMA, UNSWNB15_FEATURE_SCHEMA
from app.ml.training.anomaly_training import AnomalyModelTrainer
from app.ml.training.classifier_training import ClassifierModelTrainer

def train_cicids2017():
    sample_path = os.path.abspath("data/samples/cicids2017/sample.csv")
    if not os.path.exists(sample_path):
        print(f"Sample file not found at {sample_path}")
        return

    df = pd.read_csv(sample_path)
    trainer_anom = AnomalyModelTrainer(schema=CICIDS2017_FEATURE_SCHEMA)
    metrics_anom, m_p, p_p = trainer_anom.train_and_evaluate(df, test_size=0.2)
    print("CICIDS2017 Anomaly Model Trained Successfully:")
    print("Metrics:", metrics_anom)

    trainer_cls = ClassifierModelTrainer(schema=CICIDS2017_FEATURE_SCHEMA)
    metrics_cls, cm_p, ce_p, cmeta_p = trainer_cls.train_and_evaluate(df, test_size=0.2)
    print("\nCICIDS2017 Classifier Model Trained Successfully:")
    print("Metrics:", metrics_cls)

def train_unsw_nb15():
    sample_path = os.path.abspath("data/samples/unsw_nb15/sample.csv")
    if not os.path.exists(sample_path):
        print(f"Sample file not found at {sample_path}")
        return

    df = pd.read_csv(sample_path)
    trainer_anom = AnomalyModelTrainer(schema=UNSWNB15_FEATURE_SCHEMA)
    metrics_anom, m_p, p_p = trainer_anom.train_and_evaluate(df, test_size=0.2)
    print("\nUNSW-NB15 Anomaly Model Trained Successfully:")
    print("Metrics:", metrics_anom)

    trainer_cls = ClassifierModelTrainer(schema=UNSWNB15_FEATURE_SCHEMA)
    metrics_cls, cm_p, ce_p, cmeta_p = trainer_cls.train_and_evaluate(df, test_size=0.2)
    print("\nUNSW-NB15 Classifier Model Trained Successfully:")
    print("Metrics:", metrics_cls)

if __name__ == "__main__":
    train_cicids2017()
    train_unsw_nb15()
