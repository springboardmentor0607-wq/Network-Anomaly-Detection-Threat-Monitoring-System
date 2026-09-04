import os
import json
import joblib
import numpy as np
import pandas as pd
import logging
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score, precision_recall_fscore_support
from sklearn.preprocessing import label_binarize
from .preprocessor import DataPreprocessor, COLUMNS, ATTACK_MAP, SELECTED_FEATURES, CLASSES
from .anomaly import AnomalyDetector

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATASET_DIR = BACKEND_DIR / "dataset"
logger = logging.getLogger(__name__)


def find_dataset_file(stem: str):
    exact_paths = [DATASET_DIR / f"{stem}{suffix}" for suffix in (".txt", ".csv")]
    logger.info(
        "Dataset diagnostic: cwd=%s backend_dir=%s dataset_dir=%s csv_path=%s csv_exists=%s txt_path=%s txt_exists=%s",
        Path.cwd(), BACKEND_DIR, DATASET_DIR, exact_paths[1], exact_paths[1].exists(), exact_paths[0], exact_paths[0].exists()
    )
    for path in exact_paths:
        if path.is_file():
            return path

    # Accept an accidental whitespace-only filename difference without accepting another dataset.
    for path in DATASET_DIR.iterdir():
        if path.is_file() and path.suffix.lower() in {".txt", ".csv"} and path.stem.replace(" ", "") == stem:
            logger.info("Dataset diagnostic: using whitespace-normalized match %s", path)
            return path
    return None

def train_model_pipeline(algorithm: str = "Random Forest Classifier", dataset_name: str = "NSL-KDD", test_size: float = 0.2, random_state: int = 42):
    if dataset_name != "NSL-KDD":
        raise ValueError("Unsupported dataset. Only NSL-KDD is available.")

    train_path = find_dataset_file("KDDTrain+")
    test_path = find_dataset_file("KDDTest+")
    
    if train_path:
        train_df = pd.read_csv(train_path, names=COLUMNS)
        train_df['attack_category'] = train_df['label'].apply(lambda x: ATTACK_MAP.get(str(x).strip().lower(), 'NORMAL'))
    else:
        raise ValueError(f"Training dataset not found. Add a real file at {DATASET_DIR / 'KDDTrain+.txt'} or KDDTrain+.csv.")

    if test_path:
        test_df = pd.read_csv(test_path, names=COLUMNS)
        test_df['attack_category'] = test_df['label'].apply(lambda x: ATTACK_MAP.get(str(x).strip().lower(), 'NORMAL'))
    else:
        raise ValueError(f"Evaluation dataset not found. Add a real file at {DATASET_DIR / 'KDDTest+.txt'} or KDDTest+.csv.")

    if train_df.empty or test_df.empty:
        raise ValueError("Training and evaluation datasets must contain usable records.")
    if "label" not in train_df.columns or "label" not in test_df.columns:
        raise ValueError("NSL-KDD datasets must include the label column.")

    preprocessor = DataPreprocessor()
    X_train = preprocessor.fit_transform(train_df)
    y_train = train_df['attack_category'].values

    X_test_scaled_df = test_df.copy()
    for col in preprocessor.categorical_cols:
        le = preprocessor.encoders[col]
        X_test_scaled_df[col] = X_test_scaled_df[col].astype(str).str.lower().apply(
            lambda x: le.transform([x])[0] if x in le.classes_ else 0
        )
    X_test_scaled_df[preprocessor.numeric_cols] = preprocessor.scaler.transform(X_test_scaled_df[preprocessor.numeric_cols])
    X_test = X_test_scaled_df[SELECTED_FEATURES].values
    y_test = test_df['attack_category'].values

    if algorithm == "Logistic Regression":
        clf = LogisticRegression(max_iter=1000, random_state=random_state)
    elif algorithm == "Decision Tree":
        clf = DecisionTreeClassifier(max_depth=15, random_state=random_state)
    else:
        clf = RandomForestClassifier(n_estimators=100, max_depth=20, random_state=random_state, n_jobs=-1)

    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test) if hasattr(clf, "predict_proba") else None

    acc = float(accuracy_score(y_test, y_pred))
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_test, y_pred, average='macro', zero_division=0)
    
    # Classification Report
    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred, labels=CLASSES)
    
    # ROC-AUC calculation
    y_test_bin = label_binarize(y_test, classes=CLASSES)
    roc_auc_val = None
    roc_curves = {}
    if y_proba is not None:
        try:
            roc_auc_val = float(roc_auc_score(y_test_bin, y_proba, multi_class='ovr', average='macro'))
            for idx, c in enumerate(CLASSES):
                roc_curves[c] = round(float(roc_auc_score(y_test_bin[:, idx], y_proba[:, idx])), 4)
        except Exception:
            roc_auc_val = None
            roc_curves = {}

    model_dir = BACKEND_DIR / "saved_models"
    model_dir.mkdir(exist_ok=True)
    joblib.dump(clf, model_dir / "classifier.joblib")
    preprocessor.save(str(model_dir / "preprocessor.joblib"))
    AnomalyDetector().fit(X_train)

    metrics_payload = {
        "accuracy": round(acc, 4),
        "precision": round(float(p_macro), 4),
        "recall": round(float(r_macro), 4),
        "f1_score": round(float(f1_macro), 4),
        "roc_auc": round(float(roc_auc_val), 4) if roc_auc_val is not None else None,
        "confusion_matrix": cm.tolist(),
        "classes": CLASSES,
        "classification_report": report_dict,
        "roc_curves": roc_curves,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "test_size": test_size,
        "random_state": random_state
    }

    with open(model_dir / "metrics.json", "w") as f:
        json.dump(metrics_payload, f, indent=4)

    return metrics_payload