import os
import sys
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_curve,
    auc
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocess import load_and_preprocess_data

def train_model():
    print("==================================================")
    print("   NETSHIELD AI - RANDOM FOREST MODEL TRAINING    ")
    print("==================================================")

    # 1. Load preprocessed data (UNSW-NB15 + CICIDS2017)
    data = load_and_preprocess_data()

    X_train = data["X_train"]
    X_val = data["X_val"]
    X_test = data["X_test"]

    y_cat_train = data["y_cat_train"]
    y_cat_val = data["y_cat_val"]
    y_cat_test = data["y_cat_test"]

    scaler = data["scaler"]
    feature_encoders = data["feature_encoders"]
    target_encoder = data["target_encoder"]
    feature_names = data["feature_names"]

    num_classes = len(target_encoder.classes_)
    num_features = X_train.shape[1]

    print(f"Features: {num_features}, Target Classes: {num_classes}")
    print(f"Training Samples: {X_train.shape[0]}, Validation Samples: {X_val.shape[0]}, Testing Samples: {X_test.shape[0]}")

    # 2. Build and Train Random Forest Classifier with Hyperparameter Tuning & Validation Evaluation
    param_grid = [
        {"n_estimators": 200, "max_depth": 30, "min_samples_split": 2, "min_samples_leaf": 1, "max_features": "sqrt", "class_weight": "balanced"},
        {"n_estimators": 250, "max_depth": 35, "min_samples_split": 2, "min_samples_leaf": 1, "max_features": "sqrt", "class_weight": "balanced_subsample"},
        {"n_estimators": 200, "max_depth": 25, "min_samples_split": 4, "min_samples_leaf": 1, "max_features": "log2", "class_weight": "balanced"},
        {"n_estimators": 150, "max_depth": 30, "min_samples_split": 2, "min_samples_leaf": 1, "max_features": "sqrt", "class_weight": None}
    ]

    print("\nExecuting Hyperparameter Search & Validation Evaluation...")
    best_val_acc = 0.0
    best_params = None
    best_model = None

    for idx, params in enumerate(param_grid):
        print(f"\nEvaluating Candidate Model Configuration #{idx + 1}: {params}")
        candidate_rf = RandomForestClassifier(
            n_estimators=params["n_estimators"],
            max_depth=params["max_depth"],
            min_samples_split=params["min_samples_split"],
            min_samples_leaf=params["min_samples_leaf"],
            max_features=params["max_features"],
            class_weight=params["class_weight"],
            random_state=42,
            bootstrap=True,
            criterion="gini",
            n_jobs=-1
        )
        candidate_rf.fit(X_train, y_cat_train)
        val_pred = candidate_rf.predict(X_val)
        val_acc_candidate = accuracy_score(y_cat_val, val_pred)
        print(f"Candidate #{idx + 1} Validation Accuracy: {val_acc_candidate * 100:.2f}%")

        if val_acc_candidate > best_val_acc:
            best_val_acc = val_acc_candidate
            best_params = params
            best_model = candidate_rf

    print(f"\n==================================================")
    print(f" SELECTED BEST HYPERPARAMETERS ON VALIDATION SET  ")
    print(f" Best Parameters: {best_params}")
    print(f" Best Validation Accuracy: {best_val_acc * 100:.2f}%")
    print(f"==================================================")

    rf_model = best_model
    n_trees = best_params["n_estimators"]
    max_depth = best_params["max_depth"]
    min_samples_split = best_params["min_samples_split"]
    random_state = 42
    bootstrap = True
    criterion = "gini"

    # 3. Evaluate Model Performance
    print("\nEvaluating Random Forest Model on Test Dataset...")
    y_train_pred = rf_model.predict(X_train)
    y_val_pred = rf_model.predict(X_val)
    y_test_pred = rf_model.predict(X_test)
    y_test_pred_proba = rf_model.predict_proba(X_test)

    train_acc = accuracy_score(y_cat_train, y_train_pred)
    val_acc = accuracy_score(y_cat_val, y_val_pred)
    test_acc_actual = accuracy_score(y_cat_test, y_test_pred)

    precision = precision_score(y_cat_test, y_test_pred, average="weighted", zero_division=0)
    recall = recall_score(y_cat_test, y_test_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_cat_test, y_test_pred, average="weighted", zero_division=0)

    cm = confusion_matrix(y_cat_test, y_test_pred)
    clf_report = classification_report(
        y_cat_test,
        y_test_pred,
        target_names=target_encoder.classes_,
        zero_division=0
    )

    # Extract Feature Importance
    feature_importances = []
    if hasattr(rf_model, "feature_importances_"):
        importances = rf_model.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices[:15]:  # Top 15 features
            feature_importances.append({
                "feature": feature_names[idx] if idx < len(feature_names) else f"feature_{idx}",
                "importance": round(float(importances[idx]), 4)
            })

    # Compute ROC Curve data (Macro-average ROC)
    fpr = {}
    tpr = {}
    roc_auc = {}
    for i in range(num_classes):
        y_binary_test = (y_cat_test == i).astype(int)
        if i < y_test_pred_proba.shape[1]:
            probs = y_test_pred_proba[:, i]
        else:
            probs = np.zeros_like(y_binary_test)
        fpr[i], tpr[i], _ = roc_curve(y_binary_test, probs)
        roc_auc[i] = auc(fpr[i], tpr[i])

    # Macro ROC AUC
    all_fpr = np.unique(np.concatenate([fpr[i] for i in range(num_classes)]))
    mean_tpr = np.zeros_like(all_fpr)
    for i in range(num_classes):
        mean_tpr += np.interp(all_fpr, fpr[i], tpr[i])
    mean_tpr /= num_classes
    macro_auc = float(auc(all_fpr, mean_tpr))

    print("\n--------------------------------------------------")
    print("     RANDOM FOREST MODEL PERFORMANCE METRICS      ")
    print("--------------------------------------------------")
    print(f"Train Accuracy: {train_acc * 100:.2f}%")
    print(f"Val Accuracy  : {val_acc * 100:.2f}%")
    print(f"Test Accuracy : {test_acc_actual * 100:.2f}%")
    print(f"Precision     : {precision * 100:.2f}%")
    print(f"Recall        : {recall * 100:.2f}%")
    print(f"F1 Score      : {f1 * 100:.2f}%")
    print(f"Macro ROC AUC : {macro_auc:.4f}")
    print("\nConfusion Matrix:\n", cm)
    print("\nClassification Report:\n", clf_report)

    # Model directory
    saved_model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_model")
    os.makedirs(saved_model_dir, exist_ok=True)

    rf_model_path_1 = os.path.join(saved_model_dir, "netshield_model.pkl")
    rf_model_path_2 = os.path.join(saved_model_dir, "trained_model.pkl")

    # Save model files
    joblib.dump(rf_model, rf_model_path_1)
    joblib.dump(rf_model, rf_model_path_2)

    # Calculate model file size
    model_size_mb = f"{os.path.getsize(rf_model_path_1) / (1024 * 1024):.2f} MB"
    model_size_kb = f"{os.path.getsize(rf_model_path_1) / 1024:.2f}"

    # Package metrics dictionary for metrics.pkl
    metrics_dict = {
        "framework": "Scikit-learn",
        "algorithm": "Random Forest Classifier",
        "model_architecture": "Random Forest Classifier",
        "n_estimators": n_trees,
        "number_of_trees": n_trees,
        "max_depth": max_depth,
        "min_samples_split": min_samples_split,
        "random_state": random_state,
        "bootstrap": bootstrap,
        "criterion": criterion,
        "training_accuracy": round(float(train_acc * 100), 2),
        "validation_accuracy": round(float(val_acc * 100), 2),
        "testing_accuracy": round(float(test_acc_actual * 100), 2),
        "test_accuracy": round(float(test_acc_actual * 100), 2),
        "precision": round(float(precision * 100), 2),
        "recall": round(float(recall * 100), 2),
        "f1_score": round(float(f1 * 100), 2),
        "confusion_matrix": cm.tolist(),
        "classification_report": clf_report,
        "classes": list(target_encoder.classes_),
        "class_names": list(target_encoder.classes_),
        "num_features": num_features,
        "num_classes": num_classes,
        "training_samples": int(X_train.shape[0]),
        "testing_samples": int(X_test.shape[0]),
        "feature_importances": feature_importances,
        "roc_curve": {
            "fpr": all_fpr.tolist()[:100],
            "tpr": mean_tpr.tolist()[:100],
            "auc": round(macro_auc, 4)
        },
        "model_name": "netshield_model.pkl",
        "model_size": model_size_mb,
        "model_size_kb": model_size_kb,
        "model_version": "2.0 (Random Forest)",
        "last_trained_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # Save all required artifacts into saved_model directory
    metrics_path = os.path.join(saved_model_dir, "metrics.pkl")
    scaler_path = os.path.join(saved_model_dir, "scaler.pkl")
    encoders_path = os.path.join(saved_model_dir, "label_encoder.pkl")
    target_encoder_path = os.path.join(saved_model_dir, "target_encoder.pkl")
    feature_names_path = os.path.join(saved_model_dir, "feature_names.pkl")

    joblib.dump(metrics_dict, metrics_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(feature_encoders, encoders_path)
    joblib.dump(target_encoder, target_encoder_path)
    joblib.dump(feature_names, feature_names_path)

    # Clean up legacy .keras model if present
    keras_path = os.path.join(saved_model_dir, "netshield_model.keras")
    if os.path.exists(keras_path):
        try:
            os.remove(keras_path)
            print("Removed legacy file:", keras_path)
        except Exception as e:
            print("Notice: could not remove .keras file:", e)

    print("\n==================================================")
    print("Random Forest Classifier successfully saved to:")
    print(" - netshield_model.pkl")
    print(" - trained_model.pkl")
    print("Preprocessing artifacts and metrics saved to:", saved_model_dir)
    print("==================================================")

if __name__ == "__main__":
    train_model()