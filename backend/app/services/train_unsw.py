from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


# ============================================================
# NETSHIELD AI - UNSW-NB15 RANDOM FOREST TUNING
# ============================================================

print("\n==============================================")
print("     NetShield AI - UNSW-NB15 Training")
print("==============================================\n")


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_DIR = BASE_DIR / "models"

DATASET = MODEL_DIR / "cleaned_unsw.csv"

MODEL_DIR.mkdir(exist_ok=True)


# ============================================================
# LOAD DATASET
# ============================================================

print("Loading cleaned UNSW-NB15 dataset...")

df = pd.read_csv(DATASET)

print("Dataset Loaded Successfully")
print("Dataset Shape :", df.shape)


# ============================================================
# ENCODE CATEGORICAL FEATURES
# ============================================================

print("\nEncoding categorical columns...")

categorical = [
    "proto",
    "service",
    "state"
]

df = pd.get_dummies(
    df,
    columns=categorical
)

print("Categorical Encoding Completed")


# ============================================================
# ENCODE TARGET
# ============================================================

print("\nEncoding attack labels...")

encoder = LabelEncoder()

df["attack_cat"] = encoder.fit_transform(
    df["attack_cat"]
)

joblib.dump(
    encoder,
    MODEL_DIR / "unsw_label_encoder.pkl"
)

print("Attack Label Encoder Saved Successfully")


# ============================================================
# DISPLAY CLASSES
# ============================================================

print("\nNumber of Classes :", len(encoder.classes_))

print("\nAttack Classes:")

for index, class_name in enumerate(encoder.classes_):
    print(index, ":", class_name)


# ============================================================
# FEATURES AND TARGET
# ============================================================

X = df.drop(
    ["id", "attack_cat", "label"],
    axis=1
)

y = df["attack_cat"]

print("\nNumber of Features :", X.shape[1])


# ============================================================
# TRAIN TEST SPLIT
# ============================================================

print("\nSplitting dataset into training and testing sets...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining Samples :", len(X_train))
print("Testing Samples  :", len(X_test))

print(
    "Training Percentage :",
    round(len(X_train) / len(df) * 100, 2),
    "%"
)

print(
    "Testing Percentage  :",
    round(len(X_test) / len(df) * 100, 2),
    "%"
)


# ============================================================
# TUNED RANDOM FOREST
# ============================================================

print("\n==============================================")
print("     Tuned Random Forest Configuration")
print("==============================================")

print("Number of Trees      : 200")
print("Maximum Depth        : 20")
print("Minimum Split        : 5")
print("Minimum Leaf         : 2")
print("Maximum Features     : sqrt")
print("Random State         : 42")
print("Parallel Jobs        : -1")


model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=42,
    n_jobs=-1
)


# ============================================================
# TRAIN MODEL
# ============================================================

print("\n==============================================")
print("Training Tuned Random Forest Model...")
print("==============================================\n")

model.fit(
    X_train,
    y_train
)

print("Random Forest Training Completed Successfully")


# ============================================================
# PREDICTIONS
# ============================================================

print("\nGenerating training predictions...")

train_prediction = model.predict(X_train)

print("Generating testing predictions...")

test_prediction = model.predict(X_test)


# ============================================================
# TRAINING PERFORMANCE
# ============================================================

train_accuracy = accuracy_score(
    y_train,
    train_prediction
)

train_precision = precision_score(
    y_train,
    train_prediction,
    average="weighted",
    zero_division=0
)

train_recall = recall_score(
    y_train,
    train_prediction,
    average="weighted",
    zero_division=0
)

train_f1 = f1_score(
    y_train,
    train_prediction,
    average="weighted",
    zero_division=0
)


# ============================================================
# TESTING PERFORMANCE
# ============================================================

test_accuracy = accuracy_score(
    y_test,
    test_prediction
)

test_precision = precision_score(
    y_test,
    test_prediction,
    average="weighted",
    zero_division=0
)

test_recall = recall_score(
    y_test,
    test_prediction,
    average="weighted",
    zero_division=0
)

test_f1 = f1_score(
    y_test,
    test_prediction,
    average="weighted",
    zero_division=0
)


# ============================================================
# DISPLAY TRAINING PERFORMANCE
# ============================================================

print("\n==============================================")
print("          TRAINING PERFORMANCE")
print("==============================================")

print(
    f"Training Accuracy  : {train_accuracy:.4f}"
)

print(
    f"Training Precision : {train_precision:.4f}"
)

print(
    f"Training Recall    : {train_recall:.4f}"
)

print(
    f"Training F1 Score  : {train_f1:.4f}"
)


# ============================================================
# DISPLAY TESTING PERFORMANCE
# ============================================================

print("\n==============================================")
print("           TESTING PERFORMANCE")
print("==============================================")

print(
    f"Testing Accuracy   : {test_accuracy:.4f}"
)

print(
    f"Testing Precision  : {test_precision:.4f}"
)

print(
    f"Testing Recall     : {test_recall:.4f}"
)

print(
    f"Testing F1 Score   : {test_f1:.4f}"
)


# ============================================================
# OVERFITTING CHECK
# ============================================================

accuracy_gap = (
    train_accuracy - test_accuracy
)

f1_gap = (
    train_f1 - test_f1
)


print("\n==============================================")
print("       GENERALIZATION / OVERFITTING CHECK")
print("==============================================")

print(
    f"Accuracy Gap       : {accuracy_gap:.4f}"
)

print(
    f"F1 Score Gap       : {f1_gap:.4f}"
)


# ============================================================
# RESULT INTERPRETATION
# ============================================================

if accuracy_gap <= 0.05 and f1_gap <= 0.05:

    result = "Good generalization"

elif accuracy_gap <= 0.08 and f1_gap <= 0.08:

    result = "Acceptable generalization"

else:

    result = "Possible overfitting"


print("Result             :", result)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n==============================================")
print("          CLASSIFICATION REPORT")
print("==============================================\n")

print(
    classification_report(
        y_test,
        test_prediction,
        target_names=encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

print("\nSaving Tuned Random Forest model...")

MODEL_PATH = MODEL_DIR / "model_unsw.pkl"

joblib.dump(
    model,
    MODEL_PATH
)

print("Model Saved Successfully")

print("Location :", MODEL_PATH)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("\n==============================================")
print("             FEATURE IMPORTANCE")
print("==============================================")

importance = pd.DataFrame({

    "Feature": X.columns,

    "Importance": model.feature_importances_

})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print("\nTop 20 Important Features:\n")

print(
    importance.head(20).to_string(
        index=False
    )
)


# ============================================================
# FEATURE IMPORTANCE GRAPH
# ============================================================

plt.figure(
    figsize=(10, 8)
)

top_features = importance.head(20)

plt.barh(
    top_features["Feature"],
    top_features["Importance"]
)

plt.gca().invert_yaxis()

plt.title(
    "UNSW-NB15 - Top 20 Feature Importance"
)

plt.tight_layout()

FEATURE_PATH = (
    MODEL_DIR /
    "feature_importance_unsw.png"
)

plt.savefig(
    FEATURE_PATH,
    dpi=150
)

plt.close()

print(
    "\nFeature Importance Saved :",
    FEATURE_PATH
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nGenerating confusion matrix...")

cm = confusion_matrix(
    y_test,
    test_prediction
)

fig, ax = plt.subplots(
    figsize=(10, 10)
)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=encoder.classes_
)

disp.plot(
    ax=ax,
    xticks_rotation=45
)

plt.title(
    "UNSW-NB15 Random Forest Confusion Matrix"
)

plt.tight_layout()

CM_PATH = (
    MODEL_DIR /
    "confusion_matrix_unsw.png"
)

plt.savefig(
    CM_PATH,
    dpi=150
)

plt.close()

print(
    "Confusion Matrix Saved :",
    CM_PATH
)


# ============================================================
# FINAL RESULTS
# ============================================================

print("\n==============================================")
print("          FINAL TESTING METRICS")
print("==============================================")

print(
    f"Accuracy       : {test_accuracy:.4f}"
)

print(
    f"Precision      : {test_precision:.4f}"
)

print(
    f"Recall         : {test_recall:.4f}"
)

print(
    f"F1 Score       : {test_f1:.4f}"
)

print(
    f"Accuracy Gap   : {accuracy_gap:.4f}"
)

print(
    f"F1 Score Gap   : {f1_gap:.4f}"
)


print("\n==============================================")
print("             FILES GENERATED")
print("==============================================")

print("✓ model_unsw.pkl")
print("✓ unsw_label_encoder.pkl")
print("✓ feature_importance_unsw.png")
print("✓ confusion_matrix_unsw.png")

print("\n==============================================")
print("       UNSW-NB15 TRAINING COMPLETED")
print("==============================================\n")