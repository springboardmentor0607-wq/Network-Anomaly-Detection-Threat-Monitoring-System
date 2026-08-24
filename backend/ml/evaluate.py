import os
import json
import logging
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
    auc,
    average_precision_score,
    confusion_matrix,
    classification_report,
    ConfusionMatrixDisplay
)
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def find_artifact(filename):
    """Locate artifact file in backend/models, backend/ml or relative directories."""
    base_dir = Path(__file__).resolve().parent.parent
    possible_paths = [
        base_dir / "models" / filename,
        base_dir / "ml" / filename,
        Path("backend/models") / filename,
        Path("backend/ml") / filename,
        Path(filename)
    ]
    for p in possible_paths:
        if p.exists():
            return p
    raise FileNotFoundError(f"Could not find required artifact: {filename}")


def generate_threat_analysis_report(model, X, y, reports_dir):
    """
    Generate automated threat analysis report and save to backend/reports/threat_analysis.json.

    Includes:
    - Total predictions
    - Attack distribution
    - Risk score distribution
    - Average confidence
    - Critical attack count
    - Detection timeline
    - Most frequent attack
    - Summary of model performance
    """
    logger.info("Generating automated threat analysis report...")
    
    y_pred = model.predict(X)
    
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(X)
        confidences = np.max(probabilities, axis=1)
        attack_probs = probabilities[:, 1] if probabilities.shape[1] > 1 else probabilities[:, 0]
    else:
        confidences = np.ones(len(y_pred))
        attack_probs = y_pred.astype(float)
        
    total_predictions = int(len(y_pred))
    
    # 1. Attack Distribution & Most Frequent Attack
    unique, counts = np.unique(y_pred, return_counts=True)
    class_map = {0: "Benign", 1: "Attack"}
    
    attack_distribution = {}
    for val, cnt in zip(unique, counts):
        label_name = class_map.get(val, str(val))
        attack_distribution[label_name] = int(cnt)
        
    most_frequent_attack = max(attack_distribution.items(), key=lambda item: item[1])[0]
    
    # 2. Risk Score Distribution
    risk_scores = np.round(attack_probs * 100.0, 1)
    risk_dist = {
        "Critical (>95)": int(np.sum(risk_scores > 95.0)),
        "High (80-95)": int(np.sum((risk_scores >= 80.0) & (risk_scores <= 95.0))),
        "Medium (60-80)": int(np.sum((risk_scores >= 60.0) & (risk_scores < 80.0))),
        "Low (30-60)": int(np.sum((risk_scores >= 30.0) & (risk_scores < 60.0))),
        "Safe (<30)": int(np.sum(risk_scores < 30.0))
    }
    
    critical_attack_count = int(np.sum(risk_scores > 95.0))
    avg_confidence = round(float(np.mean(confidences)), 4)
    
    # 3. Detection Timeline (Sampled chunks)
    chunk_size = max(1, total_predictions // 10)
    timeline = []
    for i in range(0, total_predictions, chunk_size):
        chunk_scores = risk_scores[i:i + chunk_size]
        chunk_conf = confidences[i:i + chunk_size]
        timeline.append({
            "sample_index": i,
            "avg_risk_score": round(float(np.mean(chunk_scores)), 2),
            "avg_confidence": round(float(np.mean(chunk_conf)), 4),
            "threat_count": int(np.sum(chunk_scores >= 50.0))
        })
        
    # 4. Summary of Model Performance
    acc = float(accuracy_score(y, y_pred))
    prec = float(precision_score(y, y_pred, zero_division=0))
    rec = float(recall_score(y, y_pred, zero_division=0))
    f1 = float(f1_score(y, y_pred, zero_division=0))
    
    model_perf_summary = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "status": "Optimal",
        "evaluation_dataset_size": total_predictions
    }
    
    threat_analysis_data = {
        "total_predictions": total_predictions,
        "most_frequent_attack": most_frequent_attack,
        "critical_attack_count": critical_attack_count,
        "average_confidence": avg_confidence,
        "attack_distribution": attack_distribution,
        "risk_score_distribution": risk_dist,
        "detection_timeline": timeline,
        "summary_of_model_performance": model_perf_summary
    }
    
    json_path = reports_dir / "threat_analysis.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(threat_analysis_data, f, indent=4)
        
    logger.info(f"Saved automated threat analysis report to {json_path}")
    return threat_analysis_data


def generate_roc_and_pr_curves(model, X, y, reports_dir):
    """Generate and save ROC Curve and Precision-Recall Curve plots."""
    if not hasattr(model, "predict_proba"):
        logger.warning("Model does not support predict_proba, skipping ROC/PR curves.")
        return
        
    y_prob = model.predict_proba(X)[:, 1]
    
    # 1. ROC Curve plot
    fpr, tpr, _ = roc_curve(y, y_prob)
    roc_auc_val = auc(fpr, tpr)
    
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(fpr, tpr, color='#0284c7', lw=2.5, label=f'ROC Curve (AUC = {roc_auc_val:.4f})')
    ax.plot([0, 1], [0, 1], color='#94a3b8', lw=1.5, linestyle='--', label='Random Chance (AUC = 0.50)')
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate', fontsize=11)
    ax.set_ylabel('True Positive Rate (Recall)', fontsize=11)
    ax.set_title('NetShield AI - Receiver Operating Characteristic (ROC) Curve', fontsize=13)
    ax.legend(loc="lower right", fontsize=10)
    ax.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout()
    
    roc_png_path = reports_dir / "roc_curve.png"
    plt.savefig(roc_png_path, dpi=300)
    plt.close(fig)
    logger.info(f"Saved ROC Curve plot to {roc_png_path}")
    
    # 2. Precision-Recall Curve plot
    precision, recall, _ = precision_recall_curve(y, y_prob)
    pr_auc_val = average_precision_score(y, y_prob)
    
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(recall, precision, color='#10b981', lw=2.5, label=f'PR Curve (AP = {pr_auc_val:.4f})')
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('Recall', fontsize=11)
    ax.set_ylabel('Precision', fontsize=11)
    ax.set_title('NetShield AI - Precision-Recall Curve', fontsize=13)
    ax.legend(loc="lower left", fontsize=10)
    ax.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout()
    
    pr_png_path = reports_dir / "precision_recall_curve.png"
    plt.savefig(pr_png_path, dpi=300)
    plt.close(fig)
    logger.info(f"Saved Precision-Recall Curve plot to {pr_png_path}")


def generate_feature_importance(model, feature_columns, reports_dir, top_n=20):
    """Extract top N feature importances, save feature_importance.csv and plot feature_importance.png."""
    if not hasattr(model, "feature_importances_"):
        logger.warning("Model does not have feature_importances_ attribute.")
        return None
        
    importances = model.feature_importances_
    
    if len(feature_columns) != len(importances):
        logger.warning(f"Length mismatch: {len(feature_columns)} features vs {len(importances)} importances.")
        feature_columns = [f"feature_{i}" for i in range(len(importances))]
        
    feat_imp = pd.DataFrame({
        'feature': feature_columns,
        'importance': importances
    }).sort_values(by='importance', ascending=False).reset_index(drop=True)
    
    top_features = feat_imp.head(top_n).copy()
    top_features.index = top_features.index + 1
    top_features['rank'] = top_features.index
    
    # Save CSV report
    csv_path = reports_dir / "feature_importance.csv"
    top_features[['rank', 'feature', 'importance']].to_csv(csv_path, index=False)
    logger.info(f"Saved top {top_n} feature importances to {csv_path}")
    
    # Plot PNG chart
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.barh(top_features['feature'][::-1], top_features['importance'][::-1], color='#38bdf8', edgecolor='#0284c7')
    ax.set_xlabel("Feature Importance Score", fontsize=11)
    ax.set_ylabel("Feature Name", fontsize=11)
    ax.set_title(f"Top {top_n} Most Important Features (Random Forest Intrusion Detection)", fontsize=13)
    plt.tight_layout()
    
    png_path = reports_dir / "feature_importance.png"
    plt.savefig(png_path, dpi=300)
    plt.close(fig)
    logger.info(f"Saved feature importance plot to {png_path}")
    
    return top_features


def perform_cross_validation(model, X, y, reports_dir, n_splits=5):
    """Perform n-fold Stratified Cross Validation and save results to cross_validation.json."""
    logger.info(f"Performing {n_splits}-fold Stratified Cross Validation...")
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    scoring = {
        'accuracy': 'accuracy',
        'precision': 'precision',
        'recall': 'recall',
        'f1': 'f1'
    }
    
    cv_results = cross_validate(model, X, y, cv=skf, scoring=scoring, n_jobs=-1)
    
    acc_scores = [float(s) for s in cv_results['test_accuracy']]
    prec_scores = [float(s) for s in cv_results['test_precision']]
    rec_scores = [float(s) for s in cv_results['test_recall']]
    f1_scores = [float(s) for s in cv_results['test_f1']]
    
    mean_accuracy = float(np.mean(acc_scores))
    mean_precision = float(np.mean(prec_scores))
    mean_recall = float(np.mean(rec_scores))
    mean_f1_score = float(np.mean(f1_scores))
    
    cv_report = {
        "n_splits": n_splits,
        "mean_accuracy": round(mean_accuracy, 4),
        "mean_precision": round(mean_precision, 4),
        "mean_recall": round(mean_recall, 4),
        "mean_f1_score": round(mean_f1_score, 4),
        "std_accuracy": round(float(np.std(acc_scores)), 4),
        "std_precision": round(float(np.std(prec_scores)), 4),
        "std_recall": round(float(np.std(rec_scores)), 4),
        "std_f1_score": round(float(np.std(f1_scores)), 4),
        "per_fold_scores": {
            "accuracy": [round(s, 4) for s in acc_scores],
            "precision": [round(s, 4) for s in prec_scores],
            "recall": [round(s, 4) for s in rec_scores],
            "f1_score": [round(s, 4) for s in f1_scores]
        }
    }
    
    cv_json_path = reports_dir / "cross_validation.json"
    with open(cv_json_path, "w", encoding="utf-8") as f:
        json.dump(cv_report, f, indent=4)
    logger.info(f"Saved cross-validation results to {cv_json_path}")
    
    return cv_report


def evaluate_model():
    """Load model & dataset, compute metrics, plot confusion matrices, ROC/PR curves, feature importances, threat analysis report, run Stratified CV, and save reports."""
    model_path = find_artifact("random_forest.pkl")
    dataset_path = find_artifact("processed_dataset.csv")
    
    logger.info(f"Loading model from {model_path}...")
    model = joblib.load(model_path)
    
    logger.info(f"Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    
    drop_cols = [c for c in ['Label', 'Attack_Category'] if c in df.columns]
    X = df.drop(columns=drop_cols)
    y = df['Label']
    
    feature_columns = list(X.columns)
    try:
        feature_cols_path = find_artifact("feature_columns.pkl")
        loaded_cols = joblib.load(feature_cols_path)
        if len(loaded_cols) == X.shape[1]:
            feature_columns = loaded_cols
    except Exception:
        pass
    
    logger.info("Generating model predictions...")
    y_pred = model.predict(X)
    
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X)[:, 1]
        roc_auc = float(roc_auc_score(y, y_prob))
    else:
        roc_auc = float(roc_auc_score(y, y_pred))
        
    acc = float(accuracy_score(y, y_pred))
    prec = float(precision_score(y, y_pred, zero_division=0))
    rec = float(recall_score(y, y_pred, zero_division=0))
    f1 = float(f1_score(y, y_pred, zero_division=0))
    cm = confusion_matrix(y, y_pred)
    cls_report = classification_report(y, y_pred, digits=4)
    
    tn, fp, fn, tp = cm.ravel() if cm.shape == (2, 2) else (0, 0, 0, 0)
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    
    metrics = {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "detection_rate": rec,
        "false_positive_rate": fpr
    }
    
    logger.info("Evaluation Metrics Summary:")
    for metric_name, val in metrics.items():
        logger.info(f"  {metric_name.capitalize()}: {val:.4f}")
        
    base_backend_dir = Path(__file__).resolve().parent.parent
    reports_dir = base_backend_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Save metrics.json
    metrics_json_path = reports_dir / "metrics.json"
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4)
    logger.info(f"Saved evaluation metrics to {metrics_json_path}")
    
    # 2. Save classification_report.txt
    report_txt_path = reports_dir / "classification_report.txt"
    with open(report_txt_path, "w", encoding="utf-8") as f:
        f.write("=== NetShield AI - Binary Model Classification Report ===\n\n")
        f.write(cls_report)
    logger.info(f"Saved classification report to {report_txt_path}")
    
    # 3a. Save Standard Confusion Matrix (Counts)
    fig, ax = plt.subplots(figsize=(8, 6))
    disp_std = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Benign (0)", "Attack (1)"])
    disp_std.plot(cmap=plt.cm.Blues, values_format="d", ax=ax)
    ax.set_title("NetShield AI - Standard Confusion Matrix (Sample Counts)")
    plt.tight_layout()
    
    cm_png_path = reports_dir / "confusion_matrix.png"
    cm_std_png_path = reports_dir / "confusion_matrix_standard.png"
    plt.savefig(cm_png_path, dpi=300)
    plt.savefig(cm_std_png_path, dpi=300)
    plt.close(fig)
    logger.info(f"Saved standard confusion matrix plots to {cm_png_path} and {cm_std_png_path}")
    
    # 3b. Save Normalized Confusion Matrix (Proportions)
    cm_norm = confusion_matrix(y, y_pred, normalize='true')
    fig, ax = plt.subplots(figsize=(8, 6))
    disp_norm = ConfusionMatrixDisplay(confusion_matrix=cm_norm, display_labels=["Benign (0)", "Attack (1)"])
    disp_norm.plot(cmap=plt.cm.Blues, values_format=".4f", ax=ax)
    ax.set_title("NetShield AI - Normalized Confusion Matrix (True Label Proportions)")
    plt.tight_layout()
    
    cm_norm_png_path = reports_dir / "confusion_matrix_normalized.png"
    plt.savefig(cm_norm_png_path, dpi=300)
    plt.close(fig)
    logger.info(f"Saved normalized confusion matrix plot to {cm_norm_png_path}")
    
    # 4. Generate & Save ROC Curve + Precision-Recall Curve
    generate_roc_and_pr_curves(model, X, y, reports_dir)
    
    # 5. Generate Feature Importance (CSV + PNG)
    generate_feature_importance(model, feature_columns, reports_dir, top_n=20)
    
    # 6. Generate Automated Threat Analysis Report (backend/reports/threat_analysis.json)
    generate_threat_analysis_report(model, X, y, reports_dir)
    
    # 7. Perform 5-Fold Stratified Cross Validation
    cv_report = perform_cross_validation(model, X, y, reports_dir, n_splits=5)
    
    return metrics, cls_report, cm, cv_report


if __name__ == "__main__":
    evaluate_model()
