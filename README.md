# NetShield AI: Network Anomaly Detection & Threat Monitoring System

NetShield AI is an AI-powered enterprise network anomaly detection and threat monitoring system (SOC platform). It continuously ingests network flow telemetry, extracts deep statistical features, executes ML anomaly detection and attack classification models, calculates explainable 0–100 risk scores, and manages security incidents via a modern dark-themed SOC dashboard.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts / Chart.js
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PyJWT
- **Database:** PostgreSQL 15 (with SQLite support for isolated local testing)
- **AI / ML:** Scikit-Learn (Isolation Forest), XGBoost (Attack Classification), Pandas, NumPy
- **Datasets:** CIC-IDS-2017 & UNSW-NB15
- **DevOps:** Docker, Docker Compose

---

## 🚀 Quick Start (Local Setup)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
API Docs (Swagger UI): `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Application will be accessible at: `http://localhost:5173`

---

## 🐳 Docker Deployment
```bash
docker compose up --build
```

---

## 📚 Documentation
For complete technical details, inspect the `docs/` folder:
- [Product Requirements Document (PRD)](docs/prd.md)
- [Software Requirements Specification (SRS)](docs/srs.md)
- [System Architecture Specification](docs/architecture.md)
- [UI/UX & Design System Specifications](docs/ui-ux-design-system.md)
