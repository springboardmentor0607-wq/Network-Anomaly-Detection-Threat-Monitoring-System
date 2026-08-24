# NetShield AI - ML Model Summary Report

**Generated On**: 2026-08-04  
**Artifact Directory**: `backend/reports/`  
**Primary Model Artifact**: `backend/models/random_forest.pkl`

---

## 1. Executive Summary

NetShield AI utilizes a **Random Forest Classifier** trained on unified network intrusion detection datasets (**CICIDS2017** and **UNSW-NB15**). The model provides real-time detection of malicious network traffic with high precision, high recall, and minimal false positives.

---

## 2. Model Overview & Specifications

| Attribute | Details |
| :--- | :--- |
| **Model Type** | `RandomForestClassifier` (Scikit-Learn) |
| **Hyperparameters** | `n_estimators=100`, `max_depth=20`, `random_state=42`, `n_jobs=-1` |
| **Scaling Technique** | `StandardScaler` (Z-score normalization) |
| **Feature Encoding** | `LabelEncoder` (Categoricals: `proto`, `state`, `service`) |
| **Imbalance Handling** | Stratified Train-Test Split + SMOTE / `class_weight='balanced'` |
| **Training Time** | **~21.4 seconds** (Multi-core parallel training) |

---

## 3. Dataset & Feature Statistics

| Metric | Value |
| :--- | :--- |
| **Total Samples** | **508,249** samples |
| **Training Set Size (80%)** | **406,599** samples |
| **Testing Set Size (20%)** | **101,650** samples |
| **Total Number of Features** | **49** numerical & encoded categorical features |
| **Source Datasets** | CICIDS2017 & UNSW-NB15 |

### Target Class Distribution

| Class Label | Binary Code | Sample Count | Percentage | Dataset Status |
| :--- | :---: | :---: | :---: | :---: |
| **Benign (Normal)** | `0` | 470,828 | 92.64% | Majority Class |
| **Attack (Malicious)** | `1` | 37,421 | 7.36% | Minority Class |
| **Total** | — | **508,249** | **100.00%** | **Imbalanced Ratio: 0.0795** |

---

## 4. Evaluation Performance Metrics

| Evaluation Metric | Score | Percentage |
| :--- | :---: | :---: |
| **Training Accuracy** | `0.9999` | **99.99%** |
| **Testing Accuracy** | `0.9995` | **99.95%** |
| **Precision** | `0.9946` | **99.46%** |
| **Recall (Detection Rate)** | `0.9988` | **99.88%** |
| **F1 Score** | `0.9967` | **99.67%** |
| **ROC-AUC** | `1.0000` | **100.00%** |
| **False Positive Rate (FPR)** | `0.0004` | **0.04%** |

---

## 5. 5-Fold Stratified Cross-Validation Summary

| Fold | Accuracy | Precision | Recall | F1 Score |
| :---: | :---: | :---: | :---: | :---: |
| **Fold 1** | 99.92% | 99.29% | 99.57% | 99.43% |
| **Fold 2** | 99.91% | 99.10% | 99.72% | 99.41% |
| **Fold 3** | 99.89% | 98.95% | 99.60% | 99.27% |
| **Fold 4** | 99.90% | 98.94% | 99.72% | 99.33% |
| **Fold 5** | 99.92% | 99.08% | 99.79% | 99.43% |
| **Mean Score** | **99.91%** | **99.07%** | **99.68%** | **99.38%** |

---

## 6. Confusion Matrix Summary (Testing Set)

- **True Negatives (TN)**: `470,624` (Correctly predicted Benign)
- **False Positives (FP)**: `204` (Benign misclassified as Attack)
- **False Negatives (FN)**: `44` (Attack misclassified as Benign)
- **True Positives (TP)**: `37,377` (Correctly predicted Attack)

---

## 7. Associated Model & Report Artifacts

- **Model Binary**: `backend/models/random_forest.pkl`
- **Scaler**: `backend/models/scaler.pkl`
- **Feature Columns**: `backend/models/feature_columns.pkl`
- **Label Encoder**: `backend/models/label_encoder.pkl`
- **Metrics JSON**: `backend/reports/metrics.json`
- **Cross-Validation JSON**: `backend/reports/cross_validation.json`
- **Top 20 Features CSV**: `backend/reports/feature_importance.csv`
- **Feature Importance Plot**: `backend/reports/feature_importance.png`
- **ROC Curve Plot**: `backend/reports/roc_curve.png`
- **Precision-Recall Curve Plot**: `backend/reports/precision_recall_curve.png`
- **Standard Confusion Matrix**: `backend/reports/confusion_matrix_standard.png`
- **Normalized Confusion Matrix**: `backend/reports/confusion_matrix_normalized.png`
