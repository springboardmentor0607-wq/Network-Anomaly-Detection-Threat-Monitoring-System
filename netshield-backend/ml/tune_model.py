import numpy as np
from pathlib import Path
from scipy.sparse import load_npz
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)
import joblib


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

PROCESSED_DIR = BASE_DIR / "datasets" / "processed"

X_TRAIN_PATH = PROCESSED_DIR / "X_train.npz"
X_TEST_PATH = PROCESSED_DIR / "X_test.npz"
Y_TRAIN_PATH = PROCESSED_DIR / "y_train.npy"
Y_TEST_PATH = PROCESSED_DIR / "y_test.npy"

MODEL_DIR = BASE_DIR / "ml" / "models" / "unsw"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "unsw_random_forest_v3.joblib"


# ============================================================
# LOAD DATA
# ============================================================

print("Loading processed training data...")
X_train = load_npz(X_TRAIN_PATH)

print("Loading processed testing data...")
X_test = load_npz(X_TEST_PATH)

y_train = np.load(Y_TRAIN_PATH)
y_test = np.load(Y_TEST_PATH)

print("\n===== PROCESSED DATA =====")
print("Training features:", X_train.shape)
print("Testing features:", X_test.shape)
print("Training labels:", y_train.shape)
print("Testing labels:", y_test.shape)


# ============================================================
# RANDOM FOREST V3
# ============================================================

print("\n===== RANDOM FOREST V3 =====")
print("Creating optimized Random Forest model...")

model = RandomForestClassifier(
    n_estimators=250,
    max_depth=25,
    min_samples_split=4,
    min_samples_leaf=2,
    max_features="sqrt",
    class_weight="balanced",
    bootstrap=True,
    random_state=42,
    n_jobs=-1
)


# ============================================================
# TRAIN
# ============================================================

print("\nTraining Random Forest v3...")
print("This may take some time...")

model.fit(X_train, y_train)

print("Model training completed!")


# ============================================================
# PREDICTIONS
# ============================================================

print("\nGenerating predictions...")

y_pred = model.predict(X_test)


# ============================================================
# PERFORMANCE
# ============================================================

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n===== MODEL PERFORMANCE =====")

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
        target_names=["Normal", "Attack"]
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(y_test, y_pred)

print("\n===== CONFUSION MATRIX =====")
print(cm)

print("\nConfusion Matrix:")
print("                 Predicted")
print("              Normal    Attack")
print(
    f"Actual Normal  {cm[0][0]:8d}  {cm[0][1]:8d}"
)
print(
    f"Actual Attack  {cm[1][0]:8d}  {cm[1][1]:8d}"
)


# ============================================================
# SAVE MODEL
# ============================================================

print("\nSaving Random Forest v3...")

joblib.dump(model, MODEL_PATH)

print("\n===== COMPLETE =====")
print("Model saved to:")
print(MODEL_PATH)