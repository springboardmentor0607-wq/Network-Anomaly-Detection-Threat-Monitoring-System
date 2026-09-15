# System Architecture & Technical Design Document
## NetShield AI: Network Anomaly Detection & Threat Monitoring System

---

### 1. Architectural Overview

**NetShield AI** is constructed following a multi-tier, component-based, modern SOC platform architecture. The system prioritizes strict separation of concerns, defensive security controls, fast asynchronous API processing, clean dataset adaptation pipelines, and responsive data visualization.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION TIER                             │
│                                                                         │
│   React 18 Single Page Application (Vite + TypeScript + Tailwind CSS)   │
│   • Dashboard Views  • Live Monitor Stream  • Alert Queue  • Analytics  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTPS / REST / SSE Stream
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             APPLICATION TIER                            │
│                                                                         │
│   FastAPI Gateway & Web Server (Python 3.11+)                           │
│   ┌───────────────────────┐ ┌───────────────────────┐                   │
│   │ Authentication & RBAC │ │ Traffic Ingestion API │                   │
│   └───────────────────────┘ └───────────────────────┘                   │
│   ┌───────────────────────┐ ┌───────────────────────┐                   │
│   │ Alert & Incident Engine│ │ Analytics & Audit API │                  │
│   └───────────────────────┘ └───────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI / ML INFERENCE PIPELINE                       │
│                                                                         │
│   ┌───────────────────────┐ ┌───────────────────────┐                   │
│   │ Dataset Adapters      │ │ Preprocessing Pipeline│                   │
│   │ (CICIDS2017 / UNSW)   │ │ (Encoder, Scaler)     │                   │
│   └───────────────────────┘ └───────────────────────┘                   │
│   ┌───────────────────────┐ ┌───────────────────────┐                   │
│   │ Isolation Forest      │ │ XGBoost Classifier    │                   │
│   │ (Anomaly Detector)    │ │ (Attack Classifier)   │                   │
│   └───────────────────────┘ └───────────────────────┘                   │
│   ┌─────────────────────────────────────────────────┐                   │
│   │ Explainable Risk Engine (0-100 Score Calculator)│                   │
│   └─────────────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA STORAGE TIER                             │
│                                                                         │
│   ┌───────────────────────┐ ┌───────────────────────┐                   │
│   │ PostgreSQL Database   │ │ Local Model Registry  │                   │
│   │ (Structured Records)  │ │ (.joblib Artifacts)   │                   │
│   └───────────────────────┘ └───────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Component Responsibilities

#### 2.1 Presentation Tier (Frontend)
- **Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts / Chart.js.
- **Responsibilities:**
  - Render dark-themed SOC interface widgets and layout shells.
  - Manage client authentication state and JWT session persistence (`AuthContext`).
  - Render dynamic charting controls for traffic trends, risk severity distributions, and protocol distributions.
  - Stream live monitoring telemetry over Server-Sent Events (SSE) with interactive controls (play/pause/clear).
  - Enforce visual RBAC constraints (hiding unauthorized actions while relying on backend verification).

#### 2.2 Application Tier (Backend API)
- **Tech Stack:** FastAPI, Pydantic v2, PyJWT, Passlib, Uvicorn.
- **Responsibilities:**
  - Route incoming HTTP REST requests (`/api/v1/*`).
  - Perform payload authentication, rate limiting, and RBAC authorization verification.
  - Delegate data processing tasks to specific service modules (`TrafficService`, `DetectionService`, `AlertService`, `IncidentService`).
  - Emit real-time telemetry events via streaming endpoints (`StreamManager`).
  - Handle global exception responses and construct immutable audit logs for state-modifying actions.

#### 2.3 AI/ML Engine & Data Pipeline
- **Tech Stack:** Pandas, NumPy, Scikit-learn, XGBoost, Joblib.
- **Responsibilities:**
  - **Dataset Adapters (`CICIDS2017Adapter`, `UNSWNB15Adapter`):** Parse raw CSV records from Canadian Institute for Cybersecurity (2017) and University of New South Wales (NB15) datasets into standard `NormalizedFlow` representations.
  - **Preprocessing:** Clean missing/inf values, encode categorical variables (`protocol`, `state`), scale numerical features without data leakage.
  - **Anomaly Detection Service:** Execute Isolation Forest / One-Class SVM models to detect statistical deviations and calculate anomaly scores ($0.0 - 1.0$).
  - **Attack Classification Service:** Execute XGBoost multi-class models to categorize threat types (`DoS`, `PortScan`, `Brute Force`, `Web Attack`, `Exploits`, `Benign`) with prediction probability.
  - **Risk Scoring Service:** Compute explainable composite risk scores ($0 - 100$) using weighted inputs.

#### 2.4 Data Storage Tier
- **Tech Stack:** PostgreSQL 15, SQLAlchemy 2.0 ORM, Alembic Migrations.
- **Responsibilities:**
  - Persist relational user profiles, roles, teams, flow telemetry, anomaly predictions, alert queues, incident cases, model metadata, and audit logs.
  - Enforce foreign keys, unique constraints, and optimized index structures for fast timestamp and IP lookup queries.

---

### 3. Data Flow Architecture

```
[ Ingest CSV / Simulated Stream ]
               │
               ▼
   [ Dataset Adapter Stage ]
   (Normalizes features: src_ip, dst_ip, proto, duration, pkts, bytes)
               │
               ▼
 [ Preprocessing & Scaling Pipeline ]
 (Applies pre-fitted Scaler & Encoder from ml_artifacts/)
               │
               ▼
    [ Dual ML Inference Pipeline ]
   ├──> Isolation Forest ──> Anomaly Score (0.00 - 1.00)
   └──> XGBoost Classifier ─> Attack Class + Confidence
               │
               ▼
     [ Risk Scoring Engine ]
   Risk Score = 0.35*(Anomaly*100) + 0.45*(Severity*Conf) + 0.20*(AssetVal)
               │
               ▼
     [ Evaluator Threshold ]
   Is Risk Score >= 60 OR Anomaly Score >= 0.75?
         ├── YES ──> Create Alert (NEW, Severity=HIGH/CRITICAL) ──> Notify SOC Dashboard
         └── NO  ──> Store Traffic Flow (Normal) ─────────────────> Telemetry Analytics
```

---

### 4. Database ERD & Schema Overview

```
USERS
  id: UUID (PK)
  email: String (UNIQUE)
  password_hash: String
  role_id: UUID (FK)
  team_id: UUID (FK, NULLABLE)
  is_active: Boolean

ROLES
  id: UUID (PK)
  name: String (ADMIN, SOC_MANAGER, SECURITY_ANALYST, VIEWER)
  description: String

TRAFFIC_FLOWS
  id: UUID (PK)
  timestamp: DateTime (INDEX)
  src_ip: String (INDEX)
  dst_ip: String (INDEX)
  src_port: Integer
  dst_port: Integer
  protocol: String
  packets: Integer
  bytes: BigInteger
  duration: Float
  anomaly_score: Float
  risk_score: Integer (INDEX)
  status: String (benign / anomalous)

ALERTS
  id: UUID (PK)
  alert_id: String (UNIQUE)
  flow_id: UUID (FK)
  severity: String (LOW, MEDIUM, HIGH, CRITICAL)
  status: String (NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, FALSE_POSITIVE)
  type: String
  risk_score: Integer
  assigned_to: UUID (FK, NULLABLE)
  created_at: DateTime

INCIDENTS
  id: UUID (PK)
  incident_id: String (UNIQUE)
  title: String
  description: Text
  severity: String
  status: String (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
  owner_id: UUID (FK)
  created_at: DateTime

AUDIT_LOGS
  id: UUID (PK)
  timestamp: DateTime (INDEX)
  user_id: UUID (FK, NULLABLE)
  action: String
  resource: String
  details: JSONB
```

---

### 5. Security & Isolation Architecture

1. **RBAC Control Matrix:**
   - FastAPI dependency `require_role(["ADMIN", "SOC_MANAGER"])` wraps all restricted backend endpoints.
2. **Defensive Isolation:**
   - No shell execution, system command spawning, or network scanning tools exist in backend code.
3. **Data Protection:**
   - Environment variables isolate database passwords, JWT secret keys, and CORS origins (`.env`).
   - Immutable audit logs record all user management, alert triage, and model modification actions.
