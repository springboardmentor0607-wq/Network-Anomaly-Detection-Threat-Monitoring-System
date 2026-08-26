import numpy as np
from pathlib import Path
from scipy.sparse import load_npz, save_npz
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectFromModel
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

MODEL_PATH = MODEL_DIR / "unsw_feature_selected.joblib"
SELECTOR_PATH = MODEL_DIR / "unsw_feature_selector.joblib"


# ============================================================
# LOAD DATA
# ============================================================

print("Loading processed training data...")
X_train = load_npz(X_TRAIN_PATH)

print("Loading processed testing data...")
X_test = load_npz(X_TEST_PATH)

y_train = np.load(Y_TRAIN_PATH)
y_test = np.load(Y_TEST_PATH)

print("\n===== ORIGINAL DATA =====")
print("Training features:", X_train.shape)
print("Testing features:", X_test.shape)


# ============================================================
# FEATURE SELECTION
# ============================================================

print("\n===== FEATURE SELECTION =====")
print("Finding important features...")

selector_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=18,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

selector_model.fit(X_train, y_train)

selector = SelectFromModel(
    selector_model,
    threshold="median",
    prefit=True
)

X_train_selected = selector.transform(X_train)
X_test_selected = selector.transform(X_test)

print("Feature selection completed.")

print("Original feature count:", X_train.shape[1])
print("Selected feature count:", X_train_selected.shape[1])


# ============================================================
# TRAIN FINAL MODEL
# ============================================================

print("\n===== FEATURE-SELECTED RANDOM FOREST =====")

model = RandomForestClassifier(
    n_estimators=250,
    max_depth=25,
    min_samples_split=4,
    min_samples_leaf=1,
    max_features="sqrt",
    class_weight="balanced",
    bootstrap=True,
    random_state=42,
    n_jobs=-1
)

print("Training model...")
print("This may take some time...")

model.fit(X_train_selected, y_train)

print("Model training completed!")


# ============================================================
# PREDICTIONS
# ============================================================

print("\nGenerating predictions...")

y_pred = model.predict(X_test_selected)


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
# SAVE
# ============================================================

print("\nSaving model and feature selector...")

joblib.dump(model, MODEL_PATH)
joblib.dump(selector, SELECTOR_PATH)

print("\n===== COMPLETE =====")
print("Model saved to:")
print(MODEL_PATH)

print("\nFeature selector saved to:")
print(SELECTOR_PATH)