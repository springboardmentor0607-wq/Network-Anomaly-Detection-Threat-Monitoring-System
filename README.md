# NetShield AI: Network Anomaly Detection & Threat Monitoring System

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![AI: Random Forest](https://img.shields.io/badge/AI_Engine-Random_Forest-brightgreen.svg)]()

> **NetShield AI** is an enterprise-grade, AI-powered network anomaly detection and threat monitoring system designed for Security Operations Centers (SOCs). It leverages high-performance machine learning models (Random Forest, 78 features) to monitor network flows, classify malicious incursions (DDoS, FTP-Patator, SSH-Patator), calculate real-time risk scores (0–100), and orchestrate automated incident responses.

---

## 📑 Table of Contents
1. [Objective & Scope](#-objective--scope)
2. [System Architecture & 7-Stage Pipeline](#-system-architecture--7-stage-pipeline)
3. [Core Modules](#-core-modules)
4. [Milestones Summary (Weeks 1 - 8)](#-milestones-summary)
5. [Evaluation Criteria & Metrics](#-evaluation-criteria--metrics)
6. [Tech Stack](#-tech-stack)
7. [Getting Started & Running](#-getting-started--running)

---

## 🎯 Objective & Scope
The platform provides centralized, end-to-end network security monitoring:
- **Continuous Traffic Telemetry**: Analyzes PCAP flow extracts and real-time network streams.
- **Intrusion Prediction**: Classifies multi-class traffic using 78 statistical network flow features.
- **Threat Intelligence**: Dynamic aggregation of attacker IPs, target destination endpoints, and risk distributions.
- **SOC Alert & Incident Management**: Automated alert generation, analyst assignment, and incident resolution tracking.

---

## 🏛️ System Architecture & 7-Stage Pipeline

```
 [ Traffic Collection ] ──► [ Preprocessing ] ──► [ Feature Extraction (78 Features) ]
                                                            │
                                                            ▼
 [ Alert & Response ] ◄── [ Risk Scoring (0-100) ] ◄── [ AI Intrusion Prediction ]
```

1. **Traffic Collection**: Wireshark PCAP captures, CICFlowMeter CSV datasets, network interfaces.
2. **Traffic Preprocessing**: Missing value imputation, standard scaling, label encoding.
3. **Feature Extraction**: 78 statistical features (Flow duration, packet rates, byte rates, TCP flags, window sizes).
4. **AI/ML Model Training & Inference**: Random Forest (Production Model), Decision Trees, SVM, Logistic Regression with dynamic evaluation.
5. **Intrusion Prediction**: Multi-class classification (`BENIGN`, `DDoS`, `FTP-Patator`, `SSH-Patator`).
6. **Risk Scoring Engine**: 0–100 severity index mapped to 4 threat tiers (Low, Medium, High, Critical).
7. **SOC Alert & Response**: Automatic alert dispatch, incident escalation, and notifications.

---

## 🧩 Core Modules

| Module | Description | Key Features |
| :--- | :--- | :--- |
| **1. User Management** | Access Control & Auditing | JWT Authentication, RBAC (Admin, Analyst, Auditor), Audit Logs |
| **2. Network Monitoring** | Real-time Traffic Diagnostics | Throughput Curves (KB/s), Protocol Donut, Port Inspector, Interface Stats |
| **3. Anomaly Detection** | Behavioral Flow Analysis | 78-feature vector analysis, packet length variance, flow duration heuristics |
| **4. Intrusion Prediction** | Machine Learning Classifier | Real-time prediction, confidence scoring (%), risk score calculation |
| **5. Alert Management** | Incident Management System | Prioritized SOC alerts, incident escalation, assign analyst, resolve tracking |
| **6. Analytics Dashboard** | Visual Intelligence Suite | Executive KPIs, 7-day Weekly Security Trends, Attack Visualizations |
| **7. AI Detection** | Dataset Ingestion & Training | Model benchmarks comparison, Wireshark CSV upload, dataset history archive |

---

## 🗓️ Milestones Summary

- **Milestone 1 (Week 1 & 2)**: Core setup, authentication, database schema, network monitoring workflows, traffic dashboard.
- **Milestone 2 (Week 3 & 4)**: Random Forest model training, 78-feature extraction, multi-model evaluation, risk scoring.
- **Milestone 3 (Week 5 & 6)**: Alert management, incident response workflows, threat intelligence reporting, attack visualization.
- **Milestone 4 (Week 7 & 8)**: Testing suite, Docker containerization, cloud deployment configurations, documentation.

---

## 📊 Performance Metrics Architecture

- **Model Evaluation Source**: Dynamically loaded at runtime from `backend/models/all_models_evaluation.pkl`
- **Dynamic Evaluation**: `Accuracy`, `Precision`, `Recall`, and `F1-Score` reflect actual cross-validated benchmarks
- **Threat Detection Rate**: Real-time volumetric classification
- **API Response Latency**: `< 120ms`

---

## 💻 Tech Stack

- **Backend**: Python 3.11+, Flask REST API, PyJWT, MySQL Connector
- **Frontend**: React.js 18, Recharts, React Icons, Axios, CSS3
- **Database**: MySQL 8.0
- **Machine Learning**: Scikit-learn, XGBoost, Pandas, NumPy, Joblib
- **Traffic Capture**: Wireshark, CICFlowMeter, Zeek
- **DevOps**: Docker, Docker Compose, Nginx

---

## 🚀 Getting Started & Running

### Option A: Using Docker Compose (Recommended)
```powershell
docker-compose up --build
```
- Web Application: `http://localhost:3000`
- REST API: `http://localhost:5000`

### Option B: Local PowerShell Setup

1. **Start Backend**:
   ```powershell
   cd backend
   python app.py
   ```
2. **Start Frontend**:
   ```powershell
   cd frontend
   npm.cmd start
   ```

### Default Credentials:
- **Administrator**: `admin@netshield.ai` / `Admin@123`
- **Security Analyst**: `analyst@netshield.ai` / `Analyst@123`
