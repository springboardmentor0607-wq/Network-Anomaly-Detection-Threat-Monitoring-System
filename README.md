# NetShield 🛡️

> **AI-Powered Network Intrusion Detection System & Security Information and Event Management Platform**

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.140-green?logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![XGBoost](https://img.shields.io/badge/XGBoost-3.4-orange)
![Accuracy](https://img.shields.io/badge/Model%20Accuracy-99.79%25-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

NetShield is a comprehensive, AI-powered Network Intrusion Detection System (NIDS) and Security Information and Event Management (SIEM) platform. It provides real-time network traffic monitoring, advanced anomaly detection using machine learning, and deep threat analysis through a stunning cinematic dashboard.

---

## 📸 Platform Overview

NetShield monitors live and historical network traffic, classifies threats using dual ML models (trained on CIC-IDS-2017 and UNSW-NB15 datasets), and presents results through an interactive dark-mode dashboard with rich visualizations.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Live Monitoring** | Real-time stream of network packets, connected devices, and active alerts |
| **AI Anomaly Detection** | Isolation Forest + XGBoost ensemble with 99.79% accuracy |
| **Threat Classification** | 12+ attack types: DDoS, Port Scan, Web Attacks, Brute Force, Infiltration |
| **Risk Scoring** | 0–100 risk score computed per network flow |
| **MITRE ATT&CK Mapping** | Deep threat intelligence with CVE lookups |
| **PCAP Analysis** | Analyze captured packet files in the dashboard |
| **RBAC Security** | JWT-based auth with Admin and Analyst roles |
| **Reports & Export** | Downloadable anomaly detection reports |
| **Docker Deployment** | One-command full-stack deployment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NetShield Platform                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Next.js 16  │───▶│  FastAPI     │───▶│  MongoDB     │  │
│  │  Dashboard   │    │  REST + WS   │    │  (traffic)   │  │
│  │  Port 3001   │    │  Port 8000   │    │  Port 27017  │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │   ML Engine     │                      │
│                    │ Isolation Forest│                      │
│                    │ XGBoost Classif.│                      │
│                    │ CIC-IDS-2017    │                      │
│                    │ UNSW-NB15       │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, Lucide React
- **Charts**: Recharts, Chart.js

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB (Motor async driver) + SQLite (SQLAlchemy)
- **Auth**: JWT via python-jose + passlib

### Machine Learning
- **Dataset**: CIC-IDS-2017 (8 CSV files, ~885 MB) + UNSW-NB15
- **Anomaly Detection**: Scikit-learn Isolation Forest
- **Classification**: XGBoost (100 estimators, 5-fold CV)
- **Preprocessing**: MinMaxScaler + LabelEncoder

### DevOps
- **Containerization**: Docker + Docker Compose
- **Version Control**: Git + GitHub

---

## 📊 Model Performance

| Metric | CIC-IDS-2017 | UNSW-NB15 |
|---|---|---|
| **Accuracy** | **99.79%** | **99.82%** |
| **Precision** | 99.79% | 99.82% |
| **Recall** | 99.79% | 99.82% |
| **F1-Score** | 99.78% | 99.81% |
| **ROC-AUC** | 0.9999 | 0.9999 |
| **False Positive Rate** | 0.03% | 0.02% |
| **5-Fold CV Accuracy** | 99.76% | 99.78% |

---

## 📂 Project Structure

```
NetShield/
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── core/
│   │   │   ├── ml_service.py     # ML prediction engine
│   │   │   └── security.py       # JWT auth helpers
│   │   ├── models/
│   │   │   ├── cicids/           # Trained CICIDS2017 models (.joblib)
│   │   │   └── unswnb15/         # Trained UNSW-NB15 models (.joblib)
│   │   ├── routes/
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   ├── network.py        # Traffic & dashboard endpoints
│   │   │   ├── ml.py             # ML prediction & reports
│   │   │   ├── live_traffic.py   # WebSocket live monitoring
│   │   │   ├── reports.py        # Report download
│   │   │   ├── users.py          # User management
│   │   │   └── database.py       # DB management
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── config.py             # App configuration
│   │   ├── database.py           # DB connection setup
│   │   └── main.py               # FastAPI app entry point
│   ├── reports/
│   │   ├── cicids/               # CICIDS metrics, CV, epoch data
│   │   └── unswnb15/             # UNSW metrics, CV, epoch data
│   ├── scripts/
│   │   ├── train_models.py       # Model training (CICIDS)
│   │   ├── train_unswnb15.py     # Model training (UNSW)
│   │   ├── load_all_datasets.py  # MongoDB data ingestion
│   │   ├── score_database.py     # Score existing traffic data
│   │   └── generate_test_report.py # Live demo validation script
│   ├── tests/
│   │   ├── conftest.py           # Shared test fixtures
│   │   ├── test_api.py           # API integration tests
│   │   └── test_ml_service.py    # ML unit tests
│   ├── Dockerfile                # Backend container
│   └── requirements.txt          # Python dependencies
├── frontend/                     # Next.js dashboard
│   ├── src/
│   │   ├── app/                  # Next.js pages
│   │   └── components/
│   │       ├── dashboards/       # Feature dashboards (14 views)
│   │       └── ui/               # Reusable UI primitives
│   ├── Dockerfile                # Frontend container
│   └── package.json
├── MachineLearningCVE/           # CIC-IDS-2017 raw CSVs
├── docs/                         # Project documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ML_MODEL_REPORT.md
│   └── PRESENTATION_NOTES.md
├── docker-compose.yml            # Full-stack orchestration
├── .env.example                  # Environment variable template
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/NetShield.git
cd NetShield

# 2. Copy and configure environment variables
cp .env.example .env

# 3. Start all services
docker-compose up --build

# Access:
# Dashboard  →  http://localhost:3001
# API        →  http://localhost:8000
# API Docs   →  http://localhost:8000/docs
```

### Option 2: Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3001
```

---

## 🧪 Testing

```bash
cd backend

# Run the full test suite
python -m pytest tests/ -v

# Run only API tests
python -m pytest tests/test_api.py -v

# Run only ML unit tests
python -m pytest tests/test_ml_service.py -v

# Run the live demo validation script
python scripts/generate_test_report.py
```

**Expected test results:**
- ✅ 30+ tests pass
- ✅ CICIDS2017 model accuracy > 99.7%
- ✅ All API endpoints return 200
- ✅ Inference latency < 50ms

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |
| `POST` | `/api/ml/predict` | Run ML prediction on network features |
| `GET` | `/api/ml/reports/metrics` | Model accuracy metrics |
| `GET` | `/api/ml/reports/cross-validation` | 5-fold CV results |
| `GET` | `/api/network/summary` | Dashboard summary stats |
| `GET` | `/api/network/traffic-data` | Paginated traffic table |
| `GET` | `/api/network/dashboard-stats` | Charts data |
| `GET` | `/api/network/attack-timeline` | Hourly attack timeline |
| `WS` | `/api/live/stream` | Live traffic WebSocket |

Full API documentation: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design and data flow
- [API Reference](docs/API_REFERENCE.md) — All endpoints with examples
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) — Docker and cloud deployment
- [ML Model Report](docs/ML_MODEL_REPORT.md) — Training methodology and results
- [Presentation Notes](docs/PRESENTATION_NOTES.md) — Demo talking points

---

## 👥 Team & Academic Context

**NetShield** was developed as a Final Year Project (FYP) demonstrating the integration of AI/ML with network security.

- **Milestone 1**: Architecture setup, authentication, traffic monitoring dashboard
- **Milestone 2**: Anomaly detection, threat classification, risk scoring, AI model integration
- **Milestone 3**: Alert management, threat intelligence reporting, attack visualization
- **Milestone 4**: Testing, Docker deployment, documentation, end-to-end demonstration

---

## 📄 License

This project is licensed under the MIT License.

---

*NetShield — Securing networks with the power of Artificial Intelligence.* 🛡️
