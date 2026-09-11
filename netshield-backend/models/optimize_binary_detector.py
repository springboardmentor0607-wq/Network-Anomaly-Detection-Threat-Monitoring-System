import os
import sys
import json
import joblib
import shutil
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def p(msg=""):
    print(msg, flush=True)

def compute_engineered_features(df):
    df_out = df.copy()
    eps = 1e-9
    sbytes = pd.to_numeric(df_out["sbytes"], errors="coerce").fillna(0)
    dbytes = pd.to_numeric(df_out["dbytes"], errors="coerce").fillna(0)
    spkts = pd.to_numeric(df_out["spkts"], errors="coerce").fillna(0)
    dpkts = pd.to_numeric(df_out["dpkts"], errors="coerce").fillna(0)
    sloss = pd.to_numeric(df_out["sloss"], errors="coerce").fillna(0)
    dloss = pd.to_numeric(df_out["dloss"], errors="coerce").fillna(0)
    dur = pd.to_numeric(df_out["dur"], errors="coerce").fillna(0)

    df_out["total_bytes"] = sbytes + dbytes
    df_out["total_packets"] = spkts + dpkts
    df_out["bytes_per_packet"] = df_out["total_bytes"] / (df_out["total_packets"] + eps)
    df_out["packets_per_second"] = df_out["total_packets"] / (dur + eps)
    df_out["total_loss"] = sloss + dloss
    return df_out

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)

    p("======================================================================")
    p("  NETSHIELD AI - BINARY ANOMALY DETECTOR THRESHOLD OPTIMIZATION      ")
    p("======================================================================")

    # 1. Backup baseline
    src_saved_dir = os.path.join(base_dir, "saved_model")
    backup_dir = os.path.join(base_dir, "backups", "baseline_87_01")
    os.makedirs(backup_dir, exist_ok=True)
    if os.path.exists(src_saved_dir):
        for item in os.listdir(src_saved_dir):
            s = os.path.join(src_saved_dir, item)
            d = os.path.join(backup_dir, item)
            if os.path.isfile(s) and not os.path.exists(d):
                shutil.copy2(s, d)

    # 2. Load Datasets
    train_path = os.path.join(project_root, "dataset", "UNSW_NB15_training-set.csv")
    test_path = os.path.join(project_root, "dataset", "UNSW_NB15_testing-set.csv")

    if not os.path.exists(train_path):
        train_path = "dataset/UNSW_NB15_training-set.csv"
        test_path = "dataset/UNSW_NB15_testing-set.csv"

    df_train_raw = pd.read_csv(train_path)
    df_test_raw = pd.read_csv(test_path)

    p(f"Loaded Training Set: {len(df_train_raw)} records")
    p(f"Loaded Testing Set : {len(df_test_raw)} records (strictly held out until final evaluation)")

    # Clean NaNs and Infs
    for df in [df_train_raw, df_test_raw]:
        if "id" in df.columns:
            df.drop(columns=["id"], inplace=True)
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        df.fillna(0, inplace=True)

    y_train_all = df_train_raw["label"].values
    X_train_all_raw = df_train_raw.drop(columns=["label", "attack_cat"], errors="ignore").copy()

    y_test_final = df_test_raw["label"].values
    X_test_final_raw = df_test_raw.drop(columns=["label", "attack_cat"], errors="ignore").copy()

    # Stratified 80/20 train/validation split on UNSW_NB15_training-set.csv ONLY
    X_tr_raw, X_va_raw, y_tr, y_va = train_test_split(
        X_train_all_raw,
        y_train_all,
        test_size=0.20,
        random_state=42,
        stratify=y_train_all
    )

    cat_cols = ["proto", "service", "state"]

    def prepare_data(X_tr_in, X_va_in, X_te_in, engineered=False):
        if engineered:
            X_tr_df = compute_engineered_features(X_tr_in)
            X_va_df = compute_engineered_features(X_va_in)
            X_te_df = compute_engineered_features(X_te_in)
        else:
            X_tr_df = X_tr_in.copy()
            X_va_df = X_va_in.copy()
            X_te_df = X_te_in.copy()

        num_cols = [c for c in X_tr_df.columns if c not in cat_cols]

        ord_enc = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        X_tr_proc = X_tr_df.copy()
        X_va_proc = X_va_df.copy()
        X_te_proc = X_te_df.copy()

        X_tr_proc[cat_cols] = ord_enc.fit_transform(X_tr_df[cat_cols].astype(str))
        X_va_proc[cat_cols] = ord_enc.transform(X_va_df[cat_cols].astype(str))
        X_te_proc[cat_cols] = ord_enc.transform(X_te_df[cat_cols].astype(str))

        scaler = StandardScaler()
        X_tr_proc[num_cols] = scaler.fit_transform(X_tr_proc[num_cols])
        X_va_proc[num_cols] = scaler.transform(X_va_proc[num_cols])
        X_te_proc[num_cols] = scaler.transform(X_te_proc[num_cols])

        return X_tr_proc, X_va_proc, X_te_proc, list(X_tr_proc.columns), ord_enc, scaler

    p("Preparing Original (42 features) & Engineered (47 features) representations...")
    X_tr_orig, X_va_orig, X_te_orig, cols_orig, ord_orig, scaler_orig = prepare_data(X_tr_raw, X_va_raw, X_test_final_raw, engineered=False)
    X_tr_eng, X_va_eng, X_te_eng, cols_eng, ord_eng, scaler_eng = prepare_data(X_tr_raw, X_va_raw, X_test_final_raw, engineered=True)

    # Specified Configurations A, B, C, D
    configs = {
        "Config A": {
            "n_estimators": 500, "max_depth": None, "max_features": "sqrt", "class_weight": None, "n_jobs": -1, "random_state": 42
        },
        "Config B": {
            "n_estimators": 800, "max_depth": None, "max_features": "sqrt", "class_weight": None, "n_jobs": -1, "random_state": 42
        },
        "Config C": {
            "n_estimators": 1000, "max_depth": 50, "max_features": 0.7, "class_weight": None, "n_jobs": -1, "random_state": 42
        },
        "Config D": {
            "n_estimators": 800, "max_depth": None, "max_features": "sqrt", "class_weight": "balanced", "n_jobs": -1, "random_state": 42
        }
    }

    thresholds_to_test = np.round(np.arange(0.20, 0.81, 0.02), 2)

    best_overall_val_acc = 0.0
    best_config_name = None
    best_feature_set = None
    best_params = None
    best_threshold = 0.50
    best_val_model = None

    p("\n[STEP 3 & 4: EVALUATING CONFIGURATIONS & THRESHOLDS ON VALIDATION FOLD ONLY]")

    for cfg_name, params in configs.items():
        p(f"\n--- Testing {cfg_name}: {params} ---")
        
        # Test on Original Features
        rf_orig = RandomForestClassifier(**params)
        rf_orig.fit(X_tr_orig, y_tr)
        val_probs_orig = rf_orig.predict_proba(X_va_orig)[:, 1]

        best_th_orig = 0.50
        best_acc_orig = 0.0
        for th in thresholds_to_test:
            preds_th = (val_probs_orig >= th).astype(int)
            acc_th = accuracy_score(y_va, preds_th)
            if acc_th > best_acc_orig:
                best_acc_orig = acc_th
                best_th_orig = th

        p(f"  Original Features -> Best Val Threshold: {best_th_orig:.2f} | Val Accuracy: {best_acc_orig*100:.2f}%")

        if best_acc_orig > best_overall_val_acc:
            best_overall_val_acc = best_acc_orig
            best_config_name = cfg_name
            best_feature_set = "Original"
            best_params = params
            best_threshold = best_th_orig
            best_val_model = rf_orig

        # Test on Engineered Features
        rf_eng = RandomForestClassifier(**params)
        rf_eng.fit(X_tr_eng, y_tr)
        val_probs_eng = rf_eng.predict_proba(X_va_eng)[:, 1]

        best_th_eng = 0.50
        best_acc_eng = 0.0
        for th in thresholds_to_test:
            preds_th = (val_probs_eng >= th).astype(int)
            acc_th = accuracy_score(y_va, preds_th)
            if acc_th > best_acc_eng:
                best_acc_eng = acc_th
                best_th_eng = th

        p(f"  Engineered Features -> Best Val Threshold: {best_th_eng:.2f} | Val Accuracy: {best_acc_eng*100:.2f}%")

        if best_acc_eng > best_overall_val_acc:
            best_overall_val_acc = best_acc_eng
            best_config_name = cfg_name
            best_feature_set = "Engineered"
            best_params = params
            best_threshold = best_th_eng
            best_val_model = rf_eng

    p(f"\n==========================================================")
    p(f" SELECTED BEST VALIDATED CONFIGURATION:")
    p(f" Model           : {best_config_name} ({best_params})")
    p(f" Feature Set     : {best_feature_set}")
    p(f" Locked Threshold: {best_threshold:.2f}")
    p(f" Best Val Acc    : {best_overall_val_acc*100:.2f}%")
    p(f"==========================================================")

    # ------------------------------------------------------------------------
    # STEP 5: FINAL RETRAINING ON COMPLETE TRAINING DATASET & SINGLE TEST EVAL
    # ------------------------------------------------------------------------
    p("\n[STEP 5: RETRAINING SELECTED MODEL ON COMPLETE UNSW_NB15_training-set.csv]")
    use_eng = (best_feature_set == "Engineered")

    if use_eng:
        X_train_full_df = compute_engineered_features(X_train_all_raw)
        X_test_full_df = compute_engineered_features(X_test_final_raw)
    else:
        X_train_full_df = X_train_all_raw.copy()
        X_test_full_df = X_test_final_raw.copy()

    num_cols_final = [c for c in X_train_full_df.columns if c not in cat_cols]

    final_ord = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    X_train_full_proc = X_train_full_df.copy()
    X_test_full_proc = X_test_full_df.copy()

    X_train_full_proc[cat_cols] = final_ord.fit_transform(X_train_full_df[cat_cols].astype(str))
    X_test_full_proc[cat_cols] = final_ord.transform(X_test_full_df[cat_cols].astype(str))

    final_scaler = StandardScaler()
    X_train_full_proc[num_cols_final] = final_scaler.fit_transform(X_train_full_proc[num_cols_final])
    X_test_full_proc[num_cols_final] = final_scaler.transform(X_test_full_proc[num_cols_final])

    final_feature_names = list(X_train_full_proc.columns)

    p(f"Fitting {best_config_name} on {len(df_train_raw)} training samples...")
    final_model = RandomForestClassifier(**best_params)
    final_model.fit(X_train_full_proc, y_train_all)

    p("Evaluating ONCE against held-out UNSW_NB15_testing-set.csv (82,332 samples) using locked threshold...")
    test_probas = final_model.predict_proba(X_test_full_proc)[:, 1]
    final_test_preds = (test_probas >= best_threshold).astype(int)

    test_acc = accuracy_score(y_test_final, final_test_preds)
    test_prec = precision_score(y_test_final, final_test_preds, zero_division=0)
    test_rec = recall_score(y_test_final, final_test_preds, zero_division=0)
    test_f1 = f1_score(y_test_final, final_test_preds, zero_division=0)
    test_auc = roc_auc_score(y_test_final, test_probas)
    cm = confusion_matrix(y_test_final, final_test_preds)
    clf_rep = classification_report(y_test_final, final_test_preds, target_names=["Normal", "Attack"], output_dict=True)

    is_95 = "YES" if test_acc >= 0.95 else "NO"
    is_97 = "YES" if test_acc >= 0.97 else "NO"

    # ------------------------------------------------------------------------
    # STEP 7: SAVE VERIFIED MODEL & DASHBOARD ARTIFACTS
    # ------------------------------------------------------------------------
    test_acc_percent = test_acc * 100.0
    p(f"\n[STEP 7: ARTIFACT PRESERVATION - FINAL TEST ACCURACY: {test_acc_percent:.2f}%]")
    
    if test_acc_percent >= 87.01:
        p("Saving verified binary model artifacts to saved_model/...")
        os.makedirs(src_saved_dir, exist_ok=True)
        joblib.dump(final_model, os.path.join(src_saved_dir, "netshield_model.pkl"))
        joblib.dump(final_model, os.path.join(src_saved_dir, "trained_model.pkl"))
        joblib.dump(final_scaler, os.path.join(src_saved_dir, "scaler.pkl"))
        joblib.dump(final_ord, os.path.join(src_saved_dir, "label_encoder.pkl"))
        joblib.dump(final_ord, os.path.join(src_saved_dir, "label_encoders.pkl"))
        joblib.dump(final_feature_names, os.path.join(src_saved_dir, "feature_names.pkl"))

        feature_importances = []
        if hasattr(final_model, "feature_importances_"):
            imp = final_model.feature_importances_
            sorted_idx = np.argsort(imp)[::-1]
            for idx in sorted_idx[:15]:
                f_name = final_feature_names[idx]
                f_val = float(imp[idx])
                if not np.isnan(f_val):
                    feature_importances.append({
                        "feature": f_name,
                        "importance": round(f_val, 6),
                        "percentage": f"{f_val*100:.2f}%"
                    })

        metrics_dict = {
            "framework": "Scikit-learn",
            "algorithm": f"Random Forest Classifier ({best_config_name})",
            "model_architecture": "NetShield AI High-Performance Binary Detector",
            "n_estimators": best_params["n_estimators"],
            "max_depth": best_params["max_depth"],
            "criterion": best_params.get("criterion", "gini"),
            "training_accuracy": round(float(accuracy_score(y_train_all, final_model.predict(X_train_full_proc)) * 100), 2),
            "validation_accuracy": round(float(best_overall_val_acc * 100), 2),
            "testing_accuracy": round(float(test_acc_percent), 2),
            "test_accuracy": round(float(test_acc_percent), 2),
            "precision": round(float(test_prec * 100), 2),
            "recall": round(float(test_rec * 100), 2),
            "f1_score": round(float(test_f1 * 100), 2),
            "roc_auc": round(float(test_auc), 4),
            "decision_threshold": float(best_threshold),
            "training_samples": int(len(df_train_raw)),
            "testing_samples": int(len(df_test_raw)),
            "num_features": len(final_feature_names),
            "num_classes": 2,
            "classes": ["Normal", "Attack"],
            "class_names": ["Normal", "Attack"],
            "confusion_matrix": cm.tolist(),
            "feature_importances": feature_importances,
            "top_features": feature_importances,
            "last_trained_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        joblib.dump(metrics_dict, os.path.join(src_saved_dir, "metrics.pkl"))

        with open(os.path.join(src_saved_dir, "model_metrics.json"), "w") as f:
            json.dump(metrics_dict, f, indent=2)

        with open(os.path.join(src_saved_dir, "confusion_matrix.json"), "w") as f:
            json.dump(cm.tolist(), f, indent=2)

        with open(os.path.join(src_saved_dir, "classification_report.json"), "w") as f:
            json.dump(clf_rep, f, indent=2)

        feat_meta = {
            "num_features": len(final_feature_names),
            "feature_names": final_feature_names,
            "top_features": feature_importances,
            "threshold": float(best_threshold)
        }
        with open(os.path.join(src_saved_dir, "feature_metadata.json"), "w") as f:
            json.dump(feat_meta, f, indent=2)
        p("Dashboard metrics files written successfully!")

    # ------------------------------------------------------------------------
    # FINAL OUTPUT (STRICT FORMAT MATCHING PROMPT)
    # ------------------------------------------------------------------------
    p("\n" + "="*50)
    p("FINAL OUTPUT")
    p("="*50)
    p("MODEL:")
    p("Random Forest")
    p("")
    p("FEATURE COUNT:")
    p(f"{len(final_feature_names)}")
    p("")
    p("BEST PARAMETERS:")
    p(f"{best_config_name}: {best_params}")
    p("")
    p("BEST VALIDATION ACCURACY:")
    p(f"{best_overall_val_acc * 100:.2f}%")
    p("")
    p("SELECTED THRESHOLD:")
    p(f"{best_threshold:.2f}")
    p("")
    p("FINAL UNSEEN TEST ACCURACY:")
    p(f"{test_acc_percent:.2f}%")
    p("")
    p("PRECISION:")
    p(f"{test_prec * 100:.2f}%")
    p("")
    p("RECALL:")
    p(f"{test_rec * 100:.2f}%")
    p("")
    p("F1:")
    p(f"{test_f1 * 100:.2f}%")
    p("")
    p("ROC-AUC:")
    p(f"{test_auc * 100:.2f}%")
    p("")
    p("95%+:")
    p(f"{is_95}")
    p("")
    p("97%+:")
    p(f"{is_97}")
    p("")
    p("CONFUSION MATRIX:")
    p(f"Normal / Attack:\n{cm}")

if __name__ == "__main__":
    main()
