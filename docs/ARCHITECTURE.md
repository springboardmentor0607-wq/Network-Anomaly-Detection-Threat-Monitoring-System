# NetShield — System Architecture

> **Technical Design Document**  
> Version 1.0 — Milestone 4

---

## 1. System Overview

NetShield is a three-tier web application with an embedded ML inference engine:

```
┌──────────────────────────────────────────────────────────────────┐
│                       USER BROWSER                               │
│                   (Next.js Dashboard)                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP/WebSocket
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                              │
│            FastAPI (Python 3.11) — Port 8000                     │
│                                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │  /auth    │ │ /network  │ │   /ml     │ │  /live (WS)   │   │
│  │  /users   │ │ /database │ │ /reports  │ │               │   │
│  └───────────┘ └───────────┘ └─────┬─────┘ └───────────────┘   │
│                                    │                             │
│                         ┌──────────▼──────────┐                 │
│                         │    ML Engine         │                 │
│                         │  Isolation Forest    │                 │
│                         │  XGBoost Classifier  │                 │
│                         │  CICIDS2017 Models   │                 │
│                         │  UNSW-NB15 Models    │                 │
│                         └─────────────────────┘                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
           ┌─────────────────┴─────────────────┐
           ▼                                   ▼
┌──────────────────────┐           ┌──────────────────────┐
│    MongoDB           │           │   SQLite / PostgreSQL │
│  (netshield_logs)    │           │   (netshield.db)      │
│  Port 27017          │           │                       │
│  • network_traffic   │           │  • users              │
│  • alerts            │           │  • sessions           │
│  • live captures     │           │  • roles              │
└──────────────────────┘           └──────────────────────┘
```

---

## 2. Component Descriptions

### 2.1 Frontend (Next.js 16)

**Location:** `frontend/`  
**Port:** 3001

The frontend is a single-page application with 4 main pages and 14 dashboard views:

| Page | Route | Views |
|------|-------|-------|
| Login | `/login-cinematic` | Authentication form |
| Register | `/register-cinematic` | User registration |
| Main Dashboard | `/dashboard-cinematic` | 14 switchable views |
| Cinematic Intro | `/cinematic` | Animated landing |

**Dashboard Views:**
- Live Traffic Monitor
- Model Performance
- Anomaly Detection
- Attack Visualization
- Alert Management
- Security Reports
- Log Management
- Detection Rules
- Database Management
- User Management
- Role Management
- Notifications
- Analyst Dashboard

**Key Frontend Components:**
```
src/components/
├── dashboards/          # 14 feature dashboards
├── CinematicSidebar.tsx # Navigation sidebar
├── LightRays.tsx        # Background animation
├── ProcessedTelemetryTable.tsx
├── DashboardStatsCharts.tsx
└── AdvancedTrafficChart.tsx
```

### 2.2 Backend (FastAPI)

**Location:** `backend/app/`  
**Port:** 8000

**Route Modules:**

| Module | Prefix | Responsibility |
|--------|--------|----------------|
| `auth.py` | `/api/auth` | JWT login/register |
| `network.py` | `/api/network` | Traffic data, dashboard stats |
| `ml.py` | `/api/ml` | Predictions, ML reports |
| `live_traffic.py` | `/api/live` | WebSocket live monitoring |
| `database.py` | `/api/database` | DB management operations |
| `users.py` | `/api/users` | User profile management |
| `reports.py` | `/api/reports` | Report file serving |

### 2.3 ML Engine

**Location:** `backend/app/core/ml_service.py`

The `MLService` class manages both ML models as a singleton:

```python
class MLService:
    models = {
        "CICIDS2017": { iso_forest, xgb_model, scaler, label_encoder, feature_names },
        "UNSW-NB15":  { iso_forest, xgb_model, scaler, label_encoder, feature_names, cat_encoders }
    }

    def predict(features_dict, dataset) -> {
        is_anomaly: bool,
        threat_class: str,
        confidence: float,    # [0.0, 1.0]
        risk_score: int,      # [0, 100]
        status: str
    }
```

### 2.4 Databases

| Database | Engine | Purpose |
|----------|--------|---------|
| **MongoDB** | MongoDB 7.0 | Network traffic flows, alerts, captures |
| **SQLite** | SQLAlchemy | User accounts, RBAC, sessions |

**MongoDB Collections:**
- `network_traffic` — All ingested/captured flow records
- Fields: `Source IP`, `Destination IP`, `Protocol`, `Label`, `Dataset`, `Timestamp`, `ml_risk_category`, `ml_confidence`

---

## 3. Data Flow

### 3.1 Offline Traffic Analysis (Dataset Mode)
```
CSV Files (CIC-IDS-2017)
       ↓ load_all_datasets.py
MongoDB (network_traffic)
       ↓ score_database.py (ML scoring)
MongoDB (ml_risk_category, ml_confidence added)
       ↓ FastAPI /api/network/*
Next.js Dashboard (charts, tables, alerts)
```

### 3.2 Live Traffic Monitoring
```
Network Interface (Wireshark/tshark/pyshark)
       ↓ PacketCapture thread
Feature Extraction
       ↓ MLService.predict()
MongoDB (Live Capture collection)
       ↓ WebSocket /api/live/stream
Next.js Dashboard (real-time updates)
```

### 3.3 ML Prediction Flow
```
HTTP POST /api/ml/predict
  { "features": {...78 features...}, "dataset": "CICIDS2017" }
       ↓
MLService.predict()
  1. DataFrame construction
  2. Missing feature zero-fill
  3. MinMaxScaler transform
  4. IsolationForest.predict() → is_anomaly
  5. XGBClassifier.predict() → threat_class
  6. XGBClassifier.predict_proba() → confidence
  7. compute_risk_score() → risk_score (0-100)
       ↓
HTTP Response:
  { is_anomaly, threat_class, confidence, risk_score, status }
```

---

## 4. Security Architecture

### 4.1 Authentication
- JWT tokens (HS256 algorithm)
- 30-minute token expiration
- Passlib bcrypt password hashing

### 4.2 Authorization (RBAC)
| Role | Permissions |
|------|-------------|
| **Admin** | Full access: user management, DB ops, all dashboards |
| **Analyst** | Read-only: traffic data, alerts, reports |

### 4.3 CORS Configuration
Currently configured with `allow_origins=["*"]` for development.  
**Production**: Restrict to specific frontend domain.

---

## 5. Deployment Architecture

### Local Development
```
localhost:3001 (Next.js) ──► localhost:8000 (FastAPI) ──► localhost:27017 (MongoDB)
```

### Docker Compose
```
netshield_net (bridge network)
│
├── netshield_frontend  (port 3001)
├── netshield_backend   (port 8000)  ── depends_on: mongodb
└── netshield_mongodb   (port 27017) ── volume: mongo_data
```

### Cloud Deployment (AWS/Azure)
```
Internet ──► Load Balancer ──► EC2/Container Instance
                                ├── Frontend Container (port 3001)
                                ├── Backend Container  (port 8000)
                                └── MongoDB Atlas / DocumentDB
```

---

## 6. Performance Characteristics

| Metric | Value |
|--------|-------|
| ML Inference Latency | < 50 ms/prediction |
| API Response Time | < 100 ms (cached queries) |
| MongoDB Query Time | < 200 ms (indexed collections) |
| WebSocket Throughput | 10,000+ flows/sec |
| Dashboard Refresh | 5-second polling interval |
| Docker Build Time | ~3 minutes (first build) |
| Container Memory | Backend ~512 MB, Frontend ~256 MB |
