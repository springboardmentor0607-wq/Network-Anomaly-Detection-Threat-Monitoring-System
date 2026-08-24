# NetShield AI

An autonomous, real-time threat intelligence and network traffic analysis engine powered by advanced ML models.

## Project Structure

The project is structured as a monorepo containing distinct frontend and backend directories:

```
NetShield AI/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # Route implementations / endpoints
│   │   ├── auth/             # Authentication & JWT helper functions
│   │   ├── database/         # MongoDB Client & Connection lifecycle
│   │   ├── models/           # ODM / Pydantic models for DB storage
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Core business logic / ML models
│   │   ├── routers/          # Endpoint router registry
│   │   ├── utils/            # Helper modules
│   │   ├── config.py         # Settings & environment variables
│   │   └── main.py           # Application entry point
│   ├── .env.example          # Environment variables template
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React Application (Vite + Tailwind CSS v4)
    ├── src/
    │   ├── assets/           # Static images and icons
    │   ├── components/       # Reusable components
    │   ├── pages/            # Page layouts (Home, Dashboard)
    │   ├── router/           # React Router declarations
    │   ├── services/         # Axios wrapper config (api.js)
    │   ├── App.jsx           # App layout wrapper
    │   ├── index.css         # Tailwind directives stylesheet
    │   └── main.jsx          # Entry mount configuration
    ├── .env.example          # Environment variables template
    └── vite.config.js        # Vite + Tailwind compiler settings
```

---

## Backend Setup

### Prerequisites
- Python 3.10+
- MongoDB instance (running locally or in the cloud)

### Getting Started
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables template and configure variables:
   ```bash
   cp .env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be available at `http://localhost:8000`. You can inspect the interactive API documentation at `http://localhost:8000/api/v1/docs`.

---

## API Endpoints Overview

### Live PyShark Network Monitoring (`/api/v1/network/live-capture/*`)
- `POST /api/v1/network/live-capture/start` — Start live packet capture using PyShark (with automatic TShark/Wireshark detection and synthetic stream fallback).
- `POST /api/v1/network/live-capture/stop` — Stop live packet capture.
- `GET /api/v1/network/live-capture/status` — Get live capture status, active interface, packet count, and threats detected.

### Threat Intelligence Analytics (`/api/v1/threat-intelligence/analytics`)
- `GET /api/v1/threat-intelligence/analytics` — Compute threat intelligence analytics (attack distribution, threat trend over time, binned risk score distribution, most common attacks, detection timeline, and KPI summaries).

### Incident Management Module (`/api/v1/incidents`)
- `GET /api/v1/incidents` — List security incidents with optional filtering (`status`, `priority`, `assigned_analyst`) and pagination (`limit`, `skip`).
- `GET /api/v1/incidents/{id}` — Retrieve a specific incident document by `incident_id` or MongoDB `_id`.
- `POST /api/v1/incidents` — Create a new incident manually.
- `POST /api/v1/incidents/from-alert/{alert_id}` — Promote an existing alert into a full security incident record.
- `PATCH /api/v1/incidents/{id}` — Update incident assigned analyst, status (`New`, `In Progress`, `Under Investigation`, `Resolved`, `Closed`), or priority (`Critical`, `High`, `Medium`, `Low`).
- `POST /api/v1/incidents/{id}/notes` — Append a timestamped investigation note to an incident.
- `DELETE /api/v1/incidents/{id}` — Delete an incident document from MongoDB.

### Alert Management Module (`/api/v1/alerts`)
- `GET /api/v1/alerts` — List all security alerts with optional filtering (`status`, `severity`, `attack_type`) and pagination (`limit`, `skip`).
- `GET /api/v1/alerts/{id}` — Retrieve a specific alert document by `alert_id` or MongoDB `_id`.
- `POST /api/v1/alerts` — Manually create a new security alert document.
- `PATCH /api/v1/alerts/{id}/acknowledge` — Update alert status to `Acknowledged` and assign user.
- `PATCH /api/v1/alerts/{id}/resolve` — Update alert status to `Resolved`.
- `DELETE /api/v1/alerts/{id}` — Delete an alert document from MongoDB.

### Real-Time WebSocket Notifications (`/api/v1/ws/alerts`)
- `WS /api/v1/ws/alerts` — Persistent WebSocket connection for live threat alert broadcasting. Pushes `{ "type": "NEW_ALERT", "data": { ... } }` events to connected frontend clients whenever a new alert is generated.

*Note: Alerts are automatically created whenever the AI threat detection pipeline (`/api/v1/network/predict`) detects malicious network traffic. All alert and incident lifecycle events are logged in the central audit logging system.*

---

## Frontend Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Getting Started
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.
