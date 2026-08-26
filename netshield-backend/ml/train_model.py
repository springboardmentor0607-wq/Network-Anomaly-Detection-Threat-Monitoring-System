import numpy as np
from pathlib import Path
from scipy import sparse
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
import joblib


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

PROCESSED_DIR = BASE_DIR / "datasets" / "processed"

MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD PROCESSED DATA
# ============================================================

print("Loading processed training data...")

X_train = sparse.load_npz(
    PROCESSED_DIR / "X_train.npz"
)

y_train = np.load(
    PROCESSED_DIR / "y_train.npy"
)

print("Loading processed testing data...")

X_test = sparse.load_npz(
    PROCESSED_DIR / "X_test.npz"
)

y_test = np.load(
    PROCESSED_DIR / "y_test.npy"
)


print("\n===== PROCESSED DATA =====")

print("Training features:", X_train.shape)
print("Testing features:", X_test.shape)

print("Training labels:", y_train.shape)
print("Testing labels:", y_test.shape)


# ============================================================
# IMPROVED RANDOM FOREST
# ============================================================

print("\nCreating improved Random Forest model...")

model = RandomForestClassifier(
    n_estimators=250,
    max_depth=30,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features="sqrt",
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)


# ============================================================
# TRAIN MODEL
# ============================================================

print("\n===== MODEL TRAINING =====")

print("Training improved Random Forest...")
print("This may take some time...")

model.fit(
    X_train,
    y_train
)

print("Model training completed!")


# ============================================================
# PREDICTIONS
# ============================================================

print("\nGenerating predictions...")

y_pred = model.predict(X_test)


# ============================================================
# EVALUATION
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)


print("\n========================================")
print("     IMPROVED RANDOM FOREST RESULTS")
print("========================================")

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n===== CLASSIFICATION REPORT =====")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "Normal",
            "Attack"
        ],
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n===== CONFUSION MATRIX =====")

cm = confusion_matrix(
    y_test,
    y_pred
)

print(cm)

print("\nConfusion Matrix:")
print("                 Predicted")
print("              Normal  Attack")

print(
    f"Actual Normal   {cm[0][0]:6d}  {cm[0][1]:6d}"
)

print(
    f"Actual Attack   {cm[1][0]:6d}  {cm[1][1]:6d}"
)


# ============================================================
# SAVE IMPROVED MODEL
# ============================================================

MODEL_PATH = (
    MODEL_DIR / "unsw_random_forest_improved.joblib"
)

print("\nSaving improved model...")

joblib.dump(
    model,
    MODEL_PATH
)


# ============================================================
# COMPLETE
# ============================================================

print("\n========================================")
print("       IMPROVED TRAINING COMPLETE")
print("========================================")

print("Improved model saved to:")

print(MODEL_PATH)