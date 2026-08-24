import os
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def find_processed_dataset():
    """Locate processed_dataset.csv in backend/models, backend/ml or relative directories."""
    base_dir = Path(__file__).resolve().parent.parent
    possible_paths = [
        base_dir / "models" / "processed_dataset.csv",
        base_dir / "ml" / "processed_dataset.csv",
        Path("backend/models/processed_dataset.csv"),
        Path("backend/ml/processed_dataset.csv"),
        Path("processed_dataset.csv")
    ]
    for p in possible_paths:
        if p.exists():
            return p
    raise FileNotFoundError("Could not find processed_dataset.csv. Please run preprocessing.py first.")


def print_class_distribution(y_series, name="Dataset"):
    """Print the count and percentage breakdown of class labels."""
    counts = y_series.value_counts(normalize=False)
    percentages = y_series.value_counts(normalize=True) * 100.0
    label_names = {0: "Benign (0)", 1: "Attack (1)"}
    
    print(f"\n--- {name} Class Distribution ---")
    for val in sorted(counts.keys()):
        c_name = label_names.get(val, str(val))
        print(f"  Class '{c_name}': {counts[val]} samples ({percentages[val]:.2f}%)")
    print("-" * (len(name) + 30))


def train_binary_model():
    """Load dataset, apply stratified train/test split, handle class imbalance, train RandomForest, and evaluate."""
    dataset_path = find_processed_dataset()
    logger.info(f"Loading processed dataset from {dataset_path}...")
    
    df = pd.read_csv(dataset_path)
    
    if 'Label' not in df.columns:
        raise KeyError("'Label' column not found in processed_dataset.csv")
        
    drop_cols = [c for c in ['Label', 'Attack_Category'] if c in df.columns]
    X = df.drop(columns=drop_cols)
    y = df['Label']
    
    logger.info(f"Dataset shape: {df.shape}. Performing stratified train-test split (test_size=0.2, random_state=42)...")
    
    # Stratified train-test split as required
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Print class distributions before SMOTE/balancing
    print_class_distribution(y_train, name="Training Set (Pre-Balancing)")
    print_class_distribution(y_test, name="Testing Set (Unmodified)")
    
    # Class imbalance detection on training set
    train_counts = y_train.value_counts()
    min_count = train_counts.min()
    max_count = train_counts.max()
    imbalance_ratio = min_count / max_count if max_count > 0 else 1.0
    
    is_imbalanced = imbalance_ratio < 0.40
    balancing_method = "None (Dataset is balanced)"
    class_weight = None

    if is_imbalanced:
        smote_applied = False
        if HAS_SMOTE and min_count >= 6:
            try:
                k_neighbors = min(5, min_count - 1)
                logger.info(f"Applying SMOTE to training set with k_neighbors={k_neighbors}...")
                smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
                X_train, y_train = smote.fit_resample(X_train, y_train)
                balancing_method = f"SMOTE over-sampling (k_neighbors={k_neighbors})"
                smote_applied = True
                print_class_distribution(y_train, name="Training Set (Post-SMOTE Balancing)")
            except Exception as e:
                logger.warning(f"SMOTE application failed: {e}. Falling back to class_weight='balanced'.")

        if not smote_applied:
            class_weight = "balanced"
            balancing_method = "RandomForest(class_weight='balanced')"

    logger.info(f"Imbalance check: ratio={imbalance_ratio:.4f}, is_imbalanced={is_imbalanced}")
    logger.info(f"Balancing method applied to training set: {balancing_method}")
    
    logger.info("Training RandomForestClassifier binary classification model...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight=class_weight,
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    
    y_train_pred = rf_model.predict(X_train)
    y_test_pred = rf_model.predict(X_test)
    
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    
    print(f"\nBinary Training Accuracy: {train_acc:.4f}")
    print(f"Binary Testing Accuracy:  {test_acc:.4f}")
    
    logger.info("\nClassification Report (Testing Set):")
    logger.info(f"\n{classification_report(y_test, y_test_pred)}")
    
    models_dir = Path(__file__).resolve().parent.parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    model_path = models_dir / "random_forest.pkl"
    
    logger.info(f"Saving trained RandomForest model to {model_path}...")
    joblib.dump(rf_model, model_path)
    logger.info("Binary model training and saving completed successfully!")
    
    return rf_model, train_acc, test_acc


if __name__ == "__main__":
    train_binary_model()
