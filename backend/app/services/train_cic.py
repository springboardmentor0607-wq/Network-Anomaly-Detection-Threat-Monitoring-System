from pathlib import Path

import joblib
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
)


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_DIR = BASE_DIR / "models"

DATASET = MODEL_DIR / "cleaned_cic.csv"

MODEL_DIR.mkdir(exist_ok=True)


# ============================================================
# LOAD DATASET
# ============================================================

print("\n============================================================")
print("        NetShield AI - CICIDS2017 MODEL TRAINING")
print("============================================================")

print("\nLoading cleaned CICIDS2017 dataset...")

df = pd.read_csv(DATASET)

print("Dataset Loaded Successfully")
print(f"Dataset Shape : {df.shape}")


# ============================================================
# CLEAN LABEL COLUMN
# ============================================================

print("\nCleaning attack labels...")

df["Label"] = (
    df["Label"]
    .astype(str)
    .str.replace("�", "-", regex=False)
    .str.strip()
)

print("\nAttack Classes:")
print(df["Label"].value_counts())


# ============================================================
# FEATURES AND TARGET
# ============================================================

X = df.drop("Label", axis=1)

y = df["Label"]

print("\nNumber of Features :", X.shape[1])
print("Number of Classes  :", y.nunique())


# ============================================================
# LABEL ENCODING
# ============================================================

print("\nEncoding attack labels...")

encoder = LabelEncoder()

y = encoder.fit_transform(y)

joblib.dump(
    encoder,
    MODEL_DIR / "label_encoder.pkl"
)

print("Label Encoder Saved Successfully")


# ============================================================
# TRAIN / TEST SPLIT
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
    "Training Percentage : "
    f"{len(X_train) / len(X) * 100:.2f}%"
)

print(
    "Testing Percentage  : "
    f"{len(X_test) / len(X) * 100:.2f}%"
)


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

print("\n============================================================")
print("Training Random Forest Model...")
print("============================================================")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)

print("\nRandom Forest Training Completed Successfully")


# ============================================================
# TRAINING PREDICTIONS
# ============================================================

print("\nGenerating training predictions...")

train_predictions = model.predict(X_train)


# ============================================================
# TESTING PREDICTIONS
# ============================================================

print("Generating testing predictions...")

test_predictions = model.predict(X_test)


# ============================================================
# TRAINING PERFORMANCE
# ============================================================

training_accuracy = accuracy_score(
    y_train,
    train_predictions
)

training_precision = precision_score(
    y_train,
    train_predictions,
    average="weighted",
    zero_division=0
)

training_recall = recall_score(
    y_train,
    train_predictions,
    average="weighted",
    zero_division=0
)

training_f1 = f1_score(
    y_train,
    train_predictions,
    average="weighted",
    zero_division=0
)


# ============================================================
# TESTING PERFORMANCE
# ============================================================

testing_accuracy = accuracy_score(
    y_test,
    test_predictions
)

testing_precision = precision_score(
    y_test,
    test_predictions,
    average="weighted",
    zero_division=0
)

testing_recall = recall_score(
    y_test,
    test_predictions,
    average="weighted",
    zero_division=0
)

testing_f1 = f1_score(
    y_test,
    test_predictions,
    average="weighted",
    zero_division=0
)


# ============================================================
# OVERFITTING / GENERALIZATION CHECK
# ============================================================

accuracy_gap = abs(
    training_accuracy - testing_accuracy
)

f1_gap = abs(
    training_f1 - testing_f1
)


# ============================================================
# DISPLAY MODEL PERFORMANCE
# ============================================================

print("\n============================================================")
print("                 MODEL PERFORMANCE")
print("============================================================")

print("\nTRAINING PERFORMANCE")
print("--------------------------------")

print(
    f"Training Accuracy  : "
    f"{training_accuracy:.4f}"
)

print(
    f"Training Precision : "
    f"{training_precision:.4f}"
)

print(
    f"Training Recall    : "
    f"{training_recall:.4f}"
)

print(
    f"Training F1 Score  : "
    f"{training_f1:.4f}"
)


print("\nTESTING PERFORMANCE")
print("--------------------------------")

print(
    f"Testing Accuracy   : "
    f"{testing_accuracy:.4f}"
)

print(
    f"Testing Precision  : "
    f"{testing_precision:.4f}"
)

print(
    f"Testing Recall     : "
    f"{testing_recall:.4f}"
)

print(
    f"Testing F1 Score   : "
    f"{testing_f1:.4f}"
)


# ============================================================
# GENERALIZATION GAP
# ============================================================

print("\nGENERALIZATION / OVERFITTING CHECK")
print("--------------------------------")

print(
    f"Accuracy Gap       : "
    f"{accuracy_gap:.4f}"
)

print(
    f"F1 Score Gap       : "
    f"{f1_gap:.4f}"
)

if accuracy_gap < 0.02:

    print(
        "Result             : "
        "Good generalization"
    )

elif accuracy_gap < 0.05:

    print(
        "Result             : "
        "Small performance gap"
    )

else:

    print(
        "Result             : "
        "Possible overfitting - investigate further"
    )


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n============================================================")
print("              CLASSIFICATION REPORT")
print("============================================================")

print(
    classification_report(
        y_test,
        test_predictions,
        target_names=encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

print("\nSaving Random Forest model...")

joblib.dump(
    model,
    MODEL_DIR / "model_cic.pkl"
)

print("Model Saved Successfully")
print(
    f"Location : {MODEL_DIR / 'model_cic.pkl'}"
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("\n============================================================")
print("                FEATURE IMPORTANCE")
print("============================================================")

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
    importance.head(20).to_string(index=False)
)


# ============================================================
# FEATURE IMPORTANCE GRAPH
# ============================================================

plt.figure(figsize=(12, 8))

top_features = importance.head(20).sort_values(
    by="Importance"
)

plt.barh(
    top_features["Feature"],
    top_features["Importance"]
)

plt.title(
    "CICIDS2017 - Top 20 Feature Importance"
)

plt.xlabel("Importance")

plt.ylabel("Network Feature")

plt.tight_layout()

feature_path = MODEL_DIR / "feature_importance.png"

plt.savefig(
    feature_path,
    dpi=150
)

plt.close()

print(
    f"\nFeature Importance Saved : {feature_path}"
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nGenerating confusion matrix...")

cm = confusion_matrix(
    y_test,
    test_predictions
)

fig, ax = plt.subplots(
    figsize=(12, 10)
)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=encoder.classes_
)

disp.plot(
    ax=ax,
    xticks_rotation=90
)

plt.title(
    "CICIDS2017 - Random Forest Confusion Matrix"
)

plt.tight_layout()

confusion_path = MODEL_DIR / "confusion_matrix.png"

plt.savefig(
    confusion_path,
    dpi=150
)

plt.close()

print(
    f"Confusion Matrix Saved : {confusion_path}"
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n============================================================")
print("           CICIDS2017 MODEL TRAINING COMPLETED")
print("============================================================")

print("\nFinal Testing Metrics:")

print(
    f"Accuracy  : {testing_accuracy:.4f}"
)

print(
    f"Precision : {testing_precision:.4f}"
)

print(
    f"Recall    : {testing_recall:.4f}"
)

print(
    f"F1 Score  : {testing_f1:.4f}"
)

print(
    f"Accuracy Gap : {accuracy_gap:.4f}"
)

print("\nFiles Generated:")

print("✓ model_cic.pkl")
print("✓ label_encoder.pkl")
print("✓ feature_importance.png")
print("✓ confusion_matrix.png")

print("\n============================================================")
print("                  TRAINING FINISHED")
print("============================================================\n")