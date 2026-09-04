# 🛡️ NetShield AI

## Network Anomaly Detection & Threat Monitoring System

NetShield AI is an AI-powered network security monitoring platform designed to detect, classify, analyze, and manage suspicious network activities in real time.

The system combines **Machine Learning, Network Intrusion Detection, Real-Time Monitoring, Security Analytics, Incident Investigation, and Automated Security Reporting** into a single security operations dashboard.

> **Milestone 4 — Testing, Deployment & Documentation**

---

## 📌 Project Overview

Modern networks generate a large amount of traffic, making it difficult for security teams to manually identify suspicious activities.

NetShield AI addresses this challenge by using a **Random Forest machine learning model** trained on the **NSL-KDD dataset** to identify network traffic patterns and classify potential threats.

The platform provides:

* 🔐 User authentication
* 📡 Real-time network monitoring
* 🚨 Threat detection and alert management
* 🤖 AI-based threat prediction
* 📈 Security analytics
* ◷ Threat timeline
* 🔍 Incident investigation
* 📄 Automated security reports
* 🐳 Docker-based deployment
* 🗄️ MongoDB data storage

---

# ✨ Key Features

## 🔐 User Authentication

Users can securely register and log in to the NetShield AI platform.

## 📡 Live Network Monitoring

Provides continuous monitoring of network activity and displays:

* Network events
* Detected threats
* Risk scores
* Severity levels
* Incoming and outgoing traffic
* Suspicious connections
* Monitoring status

## 🚨 Threat Alerts

Security analysts can review detected security events and manage incidents through different workflow states:

```text
New → Acknowledged → Investigating → Resolved
```

## 📈 Security Analytics

Provides security intelligence through:

* Threat activity metrics
* Risk analysis
* Threat distribution
* Attack velocity
* Source IP concentration
* AI model performance
* Attack pattern analysis
* Severity distribution
* Active threats
* Recent security events

## 🤖 AI Predictions

The AI prediction module uses the trained Random Forest model to classify network traffic and provide:

* Threat type
* Prediction
* Severity
* Confidence
* Risk score

Supported threat categories include:

* Normal Traffic
* DoS Attack
* Probe
* R2L

## ◷ Threat Timeline

Displays security events in chronological order to help analysts understand the progression of network incidents.

## 🔍 Incident Investigation

Security analysts can investigate individual alerts and view:

* Incident evidence
* Network telemetry
* Connection details
* Source and destination information
* Protocol
* Ports
* Packet size
* Duration
* Investigation notes
* Incident workflow status

## 📄 Automated Security Reports

NetShield AI can generate PDF security reports containing information about investigated security incidents.

---

# 🏗️ System Architecture

```text
                    ┌───────────────────────┐
                    │      NETSHIELD AI     │
                    │  Network Security     │
                    │      Platform         │
                    └───────────┬───────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
        ┌────────▼────────┐          ┌─────────▼────────┐
        │ React Frontend  │          │ FastAPI Backend  │
        │ + Nginx         │          │ + Python         │
        │ Port 3000       │          │ Port 8000        │
        └────────┬────────┘          └─────────┬────────┘
                 │                             │
                 │                             │
                 │                    ┌────────▼────────┐
                 │                    │ Random Forest   │
                 │                    │ AI Engine       │
                 │                    └────────┬────────┘
                 │                             │
                 └──────────────┬──────────────┘
                                │
                       ┌────────▼────────┐
                       │    MongoDB 8    │
                       │    Port 27017   │
                       └─────────────────┘
```

---

# 🔄 Application Workflow

```text
User Login / Registration
          │
          ▼
     Security Dashboard
          │
          ▼
 Live Network Monitoring
          │
          ▼
   Network Event Detection
          │
          ▼
    Random Forest Model
          │
          ▼
 Threat Classification
          │
          ▼
     Risk Assessment
          │
          ▼
      Threat Alert
          │
          ▼
 Incident Investigation
          │
          ▼
 Investigation Resolution
          │
          ▼
   PDF Security Report
```

---

# 🧠 Artificial Intelligence & Machine Learning

## Machine Learning Model

NetShield AI uses a **Random Forest Classifier** for network anomaly detection and threat classification.

The model is trained using the **NSL-KDD network intrusion detection dataset**.

### Machine Learning Pipeline

```text
NSL-KDD Dataset
       │
       ▼
Data Preprocessing
       │
       ▼
Feature Encoding
       │
       ▼
Feature Scaling
       │
       ▼
Random Forest Training
       │
       ▼
Threat Prediction
       │
       ▼
Severity & Risk Assessment
```

### Input Features

The NSL-KDD dataset contains network traffic features related to:

* Connection duration
* Protocol
* Service
* Network flags
* Source bytes
* Destination bytes
* Connection statistics
* Host-based traffic information
* Other network behavior characteristics

### Threat Categories

| Category       | Description                        |
| -------------- | ---------------------------------- |
| Normal Traffic | Legitimate network activity        |
| DoS Attack     | Denial-of-Service related activity |
| Probe          | Network scanning or reconnaissance |
| R2L            | Remote-to-Local attack             |

### Prediction Output

Each prediction can contain:

```text
Threat Type
Prediction
Severity
AI Confidence
Risk Score
```

---

# 🛠️ Technology Stack

## Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* React Router
* Recharts
* Nginx

## Backend

* Python
* FastAPI
* Uvicorn
* PyMongo

## Database

* MongoDB 8

## Artificial Intelligence

* Scikit-learn
* Random Forest
* NSL-KDD Dataset
* NumPy
* Pandas
* Joblib

## Reporting

* ReportLab
* PDF generation

## Deployment

* Docker
* Docker Compose
* Nginx

## Future Cloud Deployment

* AWS
* Azure

Cloud deployment can be added depending on available free-tier or academic resources.

---

# 📂 Project Structure

```text
NetShield AI/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── classifier.py
│   │   │   ├── detector.py
│   │   │   ├── evaluate_model.py
│   │   │   ├── preprocessing.py
│   │   │   ├── risk_score.py
│   │   │   ├── report_generator.py
│   │   │   ├── train_model.py
│   │   │   └── model files
│   │   │
│   │   ├── routes/
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── data/
│   ├── dataset/
│   ├── reports/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── LiveNetwork.js
│   │   │   ├── ThreatAlerts.js
│   │   │   ├── Analytics.js
│   │   │   ├── Predictions.js
│   │   │   ├── ThreatTimeline.js
│   │   │   └── Investigation.js
│   │   │
│   │   └── App.js
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── screenshots/
│   ├── login.png
│   ├── register.png
│   ├── dashboard_overview.png
│   ├── dashboard_details.png
│   ├── livenetwork_overview.png
│   ├── livenetwork_charts.png
│   ├── livenetwork_events.png
│   ├── livenetwork_monitoring.png
│   ├── threatalerts_overview.png
│   ├── threatalerts_table.png
│   ├── analytics_overview.png
│   ├── analytics_activity.png
│   ├── analytics_ai_performance.png
│   ├── analytics_patterns.png
│   ├── analytics_threats.png
│   ├── analytics_events.png
│   ├── predictions_overview.png
│   ├── predictions_distribution.png
│   ├── predictions_decisions.png
│   ├── timeline_overview.png
│   ├── timeline_events.png
│   ├── investigation_overview.png
│   ├── investigation_info.png
│   ├── investigation_management.png
│   └── investigation_details.png
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 🐳 Docker Deployment

NetShield AI is containerized using Docker Compose.

The application consists of three main services:

| Service  | Technology       |  Port |
| -------- | ---------------- | ----: |
| Frontend | React + Nginx    |  3000 |
| Backend  | FastAPI + Python |  8000 |
| Database | MongoDB 8        | 27017 |

---

## Prerequisites

Install:

* Docker Desktop
* Git
* Node.js (for local frontend development)
* Python (for local backend development)

Docker Desktop should be running before starting the containers.

---

## Start the Application

From the project root:

```bash
docker compose up -d
```

---

## Check Running Containers

```bash
docker compose ps
```

Expected services:

```text
netshield-frontend
netshield-backend
netshield-mongodb
```

---

## Access the Application

### Frontend

```text
http://localhost:3000
```

### Backend

```text
http://localhost:8000
```

### FastAPI Swagger Documentation

```text
http://localhost:8000/docs
```

---

## Stop the Application

```bash
docker compose down
```

---

## Rebuild the Application

After making code changes:

```bash
docker compose build
docker compose up -d
```

---

## View Backend Logs

```bash
docker compose logs backend
```

## View Frontend Logs

```bash
docker compose logs frontend
```

## View MongoDB Logs

```bash
docker compose logs mongodb
```

---

# 🔌 API Endpoints

## Authentication

| Method | Endpoint    | Purpose             |
| ------ | ----------- | ------------------- |
| POST   | `/register` | Register a new user |
| POST   | `/login`    | Authenticate a user |

## Alerts

| Method | Endpoint                         | Purpose                   |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/alerts/`                       | Retrieve alerts           |
| GET    | `/alerts/{alert_id}`             | Retrieve a specific alert |
| PATCH  | `/alerts/{alert_id}/workflow`    | Update workflow           |
| PATCH  | `/alerts/{alert_id}/acknowledge` | Acknowledge alert         |
| POST   | `/alerts/{alert_id}/notes`       | Add investigation notes   |
| GET    | `/alerts/report/{alert_id}`      | Generate alert report     |

## Monitoring

| Method | Endpoint                             | Purpose                     |
| ------ | ------------------------------------ | --------------------------- |
| GET    | `/monitoring/live-alerts`            | Retrieve live alerts        |
| GET    | `/monitoring/status`                 | Retrieve monitoring status  |
| GET    | `/monitoring/investigate/{alert_id}` | Investigate an alert        |
| GET    | `/monitoring/report/{alert_id}`      | Generate security report    |
| POST   | `/monitoring/generate`               | Generate monitoring traffic |

## AI Predictions

| Method | Endpoint        | Purpose                 |
| ------ | --------------- | ----------------------- |
| GET    | `/predictions/` | Retrieve AI predictions |

## Analytics

| Method | Endpoint      | Purpose                     |
| ------ | ------------- | --------------------------- |
| GET    | `/analytics/` | Retrieve security analytics |

## Threat Timeline

| Method | Endpoint     | Purpose                  |
| ------ | ------------ | ------------------------ |
| GET    | `/timeline/` | Retrieve threat timeline |

## API Documentation

FastAPI automatically provides interactive API documentation:

```text
http://localhost:8000/docs
```

---

# 🧪 Testing & Validation

Milestone 4 included functional, API, database, performance, and Docker deployment testing.

## Functional Testing

| Module                  | Result   |
| ----------------------- | -------- |
| User Registration       | ✅ Passed |
| User Login              | ✅ Passed |
| Dashboard               | ✅ Passed |
| Live Network Monitoring | ✅ Passed |
| Threat Alerts           | ✅ Passed |
| Security Analytics      | ✅ Passed |
| AI Predictions          | ✅ Passed |
| Threat Timeline         | ✅ Passed |
| Incident Investigation  | ✅ Passed |
| Sidebar Navigation      | ✅ Passed |
| Docker Deployment       | ✅ Passed |

---

# 🔌 API Testing

The following APIs were tested successfully:

| Endpoint                  | HTTP Status |
| ------------------------- | ----------: |
| `/`                       |         200 |
| `/monitoring/live-alerts` |         200 |
| `/predictions/`           |         200 |
| `/timeline/`              |         200 |

---

# 🗄️ Database Testing

MongoDB connectivity was verified successfully.

```text
MongoDB Ping Result:
{ ok: 1 }
```

The database contained:

```text
1,438 alert records
```

---

# ⚡ Performance Testing

## Frontend Response

```text
81.17 ms
```

## Initial Backend Response

```text
656.86 ms
```

## Live Monitoring API

```text
142.23 ms
```

## Repeated Backend Requests

10 repeated requests were tested.

```text
Average: 64.3 ms
Fastest: 31.58 ms
Slowest: 228.02 ms
```

These results indicate that the application remained responsive during local testing.

---

# 📊 Docker Resource Usage

The deployed containers were monitored using Docker statistics.

| Container |   CPU |   Memory |
| --------- | ----: | -------: |
| Frontend  | 0.00% |  9.01 MB |
| Backend   | 0.49% | 302.1 MB |
| MongoDB   | 1.78% | 164.9 MB |

Total observed memory usage was approximately:

```text
476 MB
```

---

# 📸 Application Screenshots

The following screenshots demonstrate the main modules and functionality of the NetShield AI platform.

---

## 🔐 Authentication

### Login

The login page provides authenticated access to the NetShield AI security platform.

![Login](screenshots/login.png)

### User Registration

The registration page allows new users to create an account.

![User Registration](screenshots/register.png)

---

## 📊 Security Dashboard

The main dashboard provides an overview of network security activity, detected threats, risk levels, and system status.

![Dashboard Overview](screenshots/dashboard_overview.png)

![Dashboard Details](screenshots/dashboard_details.png)

---

## 📡 Live Network Monitoring

The Live Network page displays real-time network events, detected threats, risk information, charts, and continuous monitoring status.

![Live Network Overview](screenshots/livenetwork_overview.png)

![Live Network Charts](screenshots/livenetwork_charts.png)

![Live Network Events](screenshots/livenetwork_events.png)

![Live Network Monitoring](screenshots/livenetwork_monitoring.png)

---

## 🚨 Threat Alerts

The Threat Alerts module allows security analysts to review, investigate, acknowledge, and manage detected security incidents.

![Threat Alerts Overview](screenshots/threatalerts_overview.png)

![Threat Alerts Table](screenshots/threatalerts_table.png)

---

## 📈 Security Analytics

The Security Analytics page provides detailed security metrics, threat distributions, risk analysis, AI performance, attack patterns, active threats, and recent security events.

![Analytics Overview](screenshots/analytics_overview.png)

![Analytics Activity](screenshots/analytics_activity.png)

![AI Performance Analytics](screenshots/analytics_ai_performance.png)

![Attack Pattern Analytics](screenshots/analytics_patterns.png)

![Active Threats Analytics](screenshots/analytics_threats.png)

![Recent Security Events](screenshots/analytics_events.png)

---

## 🤖 AI Predictions

The AI Predictions page displays machine learning predictions, threat classifications, confidence levels, severity, risk scores, and recent AI decisions.

![AI Predictions Overview](screenshots/predictions_overview.png)

![Prediction Distribution](screenshots/predictions_distribution.png)

![Recent AI Decisions](screenshots/predictions_decisions.png)

---

## ◷ Threat Timeline

The Threat Timeline provides a chronological view of detected security events and their associated threat information.

![Threat Timeline Overview](screenshots/timeline_overview.png)

![Threat Timeline Events](screenshots/timeline_events.png)

---

## 🔍 Incident Investigation

The Investigation page provides detailed information about individual security incidents and allows analysts to manage the investigation workflow.

![Investigation Overview](screenshots/investigation_overview.png)

![Investigation Information](screenshots/investigation_info.png)

![Investigation Management](screenshots/investigation_management.png)

![Investigation Details](screenshots/investigation_details.png)

---

## 📄 Security Report

NetShield AI can generate PDF security reports containing information about investigated security incidents.

Security reports are generated dynamically by the application using the ReportLab library.

---

# 🔮 Future Enhancements

The following enhancements can be considered for future versions of NetShield AI:

* ☁️ Deploy the complete application on AWS or Azure.
* 🔐 Implement stronger authentication and role-based access control.
* 📡 Integrate real network packet capture for production environments.
* 🧠 Explore advanced machine learning and deep learning models.
* 📊 Improve real-time security analytics and visualization.
* 🚨 Add automated security notifications and alerts.
* 🔄 Implement continuous model retraining using new network data.
* 📈 Improve prediction accuracy with additional datasets and feature engineering.
* 🌐 Support scalable cloud-based deployment for larger networks.

---

# 🎯 Project Outcomes

NetShield AI demonstrates the integration of:

* Artificial Intelligence and Machine Learning
* Network intrusion detection
* Real-time security monitoring
* Threat classification
* Risk assessment
* Security analytics
* Incident investigation
* Automated security reporting
* REST API development
* MongoDB database management
* Docker-based deployment

The project provides a complete foundation for an AI-assisted network security monitoring system.

---

# 📌 Milestone 4

## Testing, Deployment & Documentation

Milestone 4 focused on validating and preparing the complete NetShield AI platform for deployment.

The milestone included:

* ✅ Functional testing
* ✅ API testing
* ✅ Database validation
* ✅ Performance testing
* ✅ Docker deployment
* ✅ Application documentation
* ✅ Screenshot documentation
* 🔄 Preparation for cloud deployment using AWS/Azure or other suitable platforms

The application was successfully containerized using Docker Compose and tested across its major modules.

---

# 👩‍💻 Project

## NetShield AI

### Network Anomaly Detection & Threat Monitoring System

Built using:

**React + FastAPI + MongoDB + Machine Learning + Docker**

---

# 📄 License

This project was developed for educational and academic purposes.
