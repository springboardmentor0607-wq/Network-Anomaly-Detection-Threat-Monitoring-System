# NetShield 🛡️

NetShield is a comprehensive, AI-powered Network Intrusion Detection System (NIDS) and Security Information and Event Management (SIEM) platform. It is designed to provide real-time network monitoring, advanced anomaly detection using machine learning, and deep threat analysis.

## 🚀 Key Features

*   **Live Monitoring & Alerting:** Real-time stream of network traffic, connected devices, and active security alerts.
*   **AI-Driven Anomaly Detection:** Utilizes machine learning models trained on robust datasets (e.g., CIC-IDS-2017) to detect DDoS, Port Scans, Web Attacks, and Infiltration attempts with confidence scores.
*   **Threat Analysis & Intelligence:** Deep dives into incident timelines, MITRE ATT&CK mapping, CVE lookups, and malicious IP identification.
*   **Packet & Log Analysis:** Built-in capabilities to view and analyze PCAP files and centralized logs (Zeek, HTTP, Authentication).
*   **Detection Rules Management:** Manage custom signature rules, YARA rules, and Zeek scripts.
*   **Cinematic Dashboard:** A sleek, modern, dark-mode Next.js frontend featuring rich data visualizations.
*   **Role-Based Access Control (RBAC):** Secure user management separating Admin and Analyst roles.

## 🛠️ Technology Stack

**Frontend:**
*   **Framework:** Next.js (React 19)
*   **Styling:** Tailwind CSS v4, Radix UI for accessible components
*   **Icons & Charts:** Lucide React, Recharts

**Backend:**
*   **Framework:** FastAPI (Python)
*   **Database:** SQLAlchemy ORM (compatible with PostgreSQL, SQLite, etc.)
*   **Architecture:** Modular routing (Authentication, Network analysis)

**Machine Learning & Data:**
*   **Dataset:** CIC-IDS-2017 (MachineLearningCVE) for training threat detection models.

## 📂 Project Structure

```text
NetShield/
├── backend/                  # FastAPI backend application
│   ├── app/                  # Main application code (routes, models, schemas)
│   ├── scripts/              # Helper scripts
│   └── venv/                 # Python virtual environment
├── frontend/                 # Next.js frontend application
│   ├── src/                  # React components, pages, and styles
│   └── package.json          # Frontend dependencies
├── MachineLearningCVE/       # CIC-IDS-2017 datasets (DDoS, PortScan, etc.)
├── CSV Files/                # Additional data logs and processed datasets
└── refactor_dashboard.py     # Utility script for dashboard UI refactoring
```

## Getting Started

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Activate the virtual environment (or create one).
3. Install dependencies: `pip install -r requirements.txt` (ensure requirements are listed)
4. Run the FastAPI server: `uvicorn app.main:app --reload --port 8000`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Next.js development server: `npm run dev`
4. Access the dashboard at `http://localhost:3001`

---
*NetShield - Securing networks with the power of Artificial Intelligence.*
