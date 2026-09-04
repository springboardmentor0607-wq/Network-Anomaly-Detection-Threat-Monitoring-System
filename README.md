# 🛡️ NetShield AI

## Network Anomaly Detection & Threat Monitoring System

NetShield AI is an AI-powered network security monitoring platform designed to detect, classify, analyze, and monitor suspicious network activity in real time.

The system combines **Machine Learning, FastAPI, React, MongoDB, and Docker** to provide a complete security monitoring environment.

## 🎯 Project Objective

The main objective of NetShield AI is to identify abnormal network behavior and potential cyber threats using a **Random Forest machine learning model** trained on the **NSL-KDD dataset**.

The platform provides security teams with real-time visibility into:

* Network security events
* Detected threats
* Threat severity
* Risk scores
* AI prediction confidence
* Security analytics
* Threat timelines
* Incident investigation
* Security reports

## 🚀 Key Features

* 🔐 User Registration & Login
* 📡 Real-Time Network Monitoring
* 🚨 Threat Detection & Alert Management
* 🤖 AI-Based Threat Prediction
* 📊 Security Analytics Dashboard
* 📈 Threat Timeline Visualization
* 🔍 Incident Investigation
* 🧠 Random Forest Machine Learning Model
* 📄 Automated Security Report Generation
* 🗄️ MongoDB Alert Storage
* 🐳 Docker Containerized Deployment
* ⚡ Auto-refreshing Security Monitoring

## 📌 Project Status

**Milestone 4 — Testing, Deployment & Documentation**

The system has been functionally tested and containerized using Docker Compose.

## ✅ Current System Components

| Component | Technology       |    Port | Status     |
| --------- | ---------------- | ------: | ---------- |
| Frontend  | React + Nginx    |    3000 | 🟢 Running |
| Backend   | FastAPI + Python |    8000 | 🟢 Running |
| Database  | MongoDB 8        |   27017 | 🟢 Running |
| AI Engine | Random Forest    | Backend | 🟢 Online  |


## 🛠️ Technology Stack

### Frontend

* React.js
* HTML5
* CSS3
* React Router
* Recharts

### Backend

* Python
* FastAPI
* Uvicorn
* PyMongo

### Database

* MongoDB 8

### Artificial Intelligence & Machine Learning

* Scikit-learn
* Random Forest Classifier
* NSL-KDD Dataset

### Deployment & Infrastructure

* Docker
* Docker Compose
* Nginx
* AWS / Azure *(planned cloud deployment)*

### Reporting

* ReportLab
* PDF Security Reports


## 🏗️ System Architecture

NetShield AI follows a three-tier architecture consisting of the React frontend, FastAPI backend, and MongoDB database.

```text
                    🛡️ NETSHIELD AI
                         │
          ┌──────────────┴──────────────┐
          │                             │
     React Frontend                FastAPI Backend
       + Nginx                         │
      Port 3000                        │
          │                    ┌────────┴────────┐
          │                    │                 │
          │              AI/ML Engine       API Routes
          │              Random Forest           │
          │                    │                 │
          │                    └────────┬────────┘
          │                             │
          └─────────────────────────────┤
                                        │
                                   MongoDB 8
                                   Port 27017
                                        │
                                 Users & Alerts
```

### 🔄 Application Workflow

```text
Network Traffic
      ↓
Data Processing
      ↓
AI/ML Prediction
      ↓
Threat Classification
      ↓
Risk Score Calculation
      ↓
Security Alert Generation
      ↓
MongoDB Storage
      ↓
React Security Dashboard
      ↓
Investigation & Security Reporting
```

### 🧩 Main Components

| Component           | Responsibility                             |
| ------------------- | ------------------------------------------ |
| React Frontend      | Provides the security monitoring interface |
| Nginx               | Serves the React production build          |
| FastAPI Backend     | Handles APIs and application logic         |   
| Random Forest Model | Predicts network threats                   |
| MongoDB             | Stores users and security alerts           |
| ReportLab           | Generates security reports                 |
| Docker              | Containerizes the application              |
| Docker Compose      | Runs the complete application stack        |


## 🤖 AI & Machine Learning

NetShield AI uses a **Random Forest Classifier** to identify and classify suspicious network activity.

### 📚 Dataset

The machine learning model is trained using the **NSL-KDD dataset**, a widely used dataset for network intrusion detection research.

The dataset contains network connection records with multiple features that are used to identify different types of network activity.

### 🧠 Machine Learning Pipeline

```text
NSL-KDD Dataset
       ↓
Data Preprocessing
       ↓
Feature Preparation
       ↓
Random Forest Training
       ↓
Model Evaluation
       ↓
Threat Prediction
       ↓
Risk Assessment
       ↓
Security Alert
```

### 🔍 Threat Categories

The system can classify network activity into categories such as:

* Normal Traffic
* DoS Attack
* Probe
* R2L

### 📊 Prediction Information

For detected network events, the AI system provides:

* Threat type
* Prediction result
* Severity level
* Prediction confidence
* Risk score

### ⚙️ AI Engine

The Random Forest model is integrated into the FastAPI backend and is used for real-time threat prediction during network monitoring.


## 📋 Application Features & Modules

### 🔐 1. User Authentication

The authentication module provides secure access to the NetShield AI platform.

Features include:

* User registration
* User login
* Authentication validation
* Protected application access

---

### 📡 2. Live Network Monitoring

The Live Network module provides real-time visibility into network security events.

It displays:

* Total network events
* Detected threats
* Critical threats
* Average risk
* Recent network events
* Monitoring status
* AI model status
* Database connection status

The dashboard automatically refreshes to provide updated security information.

---

### 🚨 3. Threat Alerts

The Threat Alerts module allows security events to be monitored and managed.

Security analysts can:

* View detected alerts
* Check threat severity
* View risk scores
* Acknowledge alerts
* Start investigations
* Resolve alerts
* Add investigation notes
* Generate security reports

---

### 📊 4. Security Analytics

The Security Analytics module provides a detailed overview of network security activity.

It includes:

* Total events
* Active threats
* Critical threats
* High-severity threats
* Resolved incidents
* AI confidence
* Average risk
* Attack velocity
* Source IP concentration
* Threat distribution
* Risk escalation
* Attack pattern analysis

---

### ✦ 5. AI Predictions

The AI Predictions module displays machine learning predictions generated by the Random Forest model.

It provides:

* Total predictions
* Threat predictions
* Critical threats
* Average AI confidence
* Threat rate
* Threat distribution
* Severity distribution
* Risk distribution
* Recent AI decisions

---

### ◷ 6. Threat Timeline

The Threat Timeline module provides a chronological view of security events.

It helps security analysts understand:

* When threats occurred
* Threat types
* Severity levels
* Risk levels
* Security event progression

---

### 🔍 7. Incident Investigation

The Investigation module provides detailed information about individual security incidents.

Analysts can:

* Review security events
* Examine threat information
* Check risk scores
* View AI predictions
* Update investigation status
* Add investigation notes
* Generate security reports

---

### 📄 8. Security Reports

NetShield AI can generate PDF security reports for investigated incidents.

Reports provide a structured summary of the detected security event and its associated security information.


## 🐳 Docker Deployment

NetShield AI is containerized using Docker and Docker Compose.

The application consists of three main containers:

```text
┌─────────────────────────────────────┐
│          NetShield AI                │
├─────────────────────────────────────┤
│                                     │
│  React + Nginx       → Port 3000   │
│                                     │
│  FastAPI Backend     → Port 8000   │
│                                     │
│  MongoDB 8           → Port 27017  │
│                                     │
└─────────────────────────────────────┘
```

### 📦 Docker Services

| Service  | Container            |  Port |
| -------- | -------------------- | ----: |
| Frontend | `netshield-frontend` |  3000 |
| Backend  | `netshield-backend`  |  8000 |
| Database | `netshield-mongodb`  | 27017 |

### ⚙️ Prerequisites

Before running NetShield AI with Docker, install:

* Docker Desktop
* Docker Compose
* Git

Docker Desktop should be configured to use the **WSL 2 backend** on Windows.

### 🚀 Start the Application

Open PowerShell in the project root directory:

```powershell
docker compose up -d
```

### 🔎 Check Container Status

Run:

```powershell
docker compose ps
```

All three containers should show an `Up` status.

### 🌐 Access the Application

After the containers start, open:

**Frontend:**

```text
http://localhost:3000
```

**Backend:**

```text
http://localhost:8000
```

**FastAPI Swagger Documentation:**

```text
http://localhost:8000/docs
```

### 🛑 Stop the Application

To stop the containers:

```powershell
docker compose down
```

### 🔄 Rebuild the Application

After making code changes:

```powershell
docker compose build
docker compose up -d
```

### 📋 View Logs

Backend logs:

```powershell
docker compose logs backend
```

Frontend logs:

```powershell
docker compose logs frontend
```

MongoDB logs:

```powershell
docker compose logs mongodb
```


## 🔌 API Endpoints

NetShield AI provides REST API endpoints through the FastAPI backend.

### 🔐 Authentication

| Method | Endpoint    | Description         |
| ------ | ----------- | ------------------- |
| POST   | `/register` | Register a new user |
| POST   | `/login`    | Authenticate a user |

### 🚨 Alerts

| Method | Endpoint                         | Description               |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/alerts/`                       | Retrieve security alerts  |
| GET    | `/alerts/{alert_id}`             | Retrieve a specific alert |
| PATCH  | `/alerts/{alert_id}/workflow`    | Update alert workflow     |
| PATCH  | `/alerts/{alert_id}/acknowledge` | Acknowledge an alert      |
| POST   | `/alerts/{alert_id}/notes`       | Add investigation notes   |
| GET    | `/alerts/report/{alert_id}`      | Generate an alert report  |

### 📡 Network Monitoring

| Method | Endpoint                             | Description                        |
| ------ | ------------------------------------ | ---------------------------------- |
| GET    | `/monitoring/generate`               | Generate network monitoring events |
| GET    | `/monitoring/live-alerts`            | Retrieve live security alerts      |
| GET    | `/monitoring/status`                 | Retrieve monitoring status         |
| GET    | `/monitoring/investigate/{alert_id}` | Investigate a security alert       |
| GET    | `/monitoring/report/{alert_id}`      | Generate a security report         |

### 🤖 AI Predictions

| Method | Endpoint        | Description                    |
| ------ | --------------- | ------------------------------ |
| GET    | `/predictions/` | Retrieve AI threat predictions |

### 📊 Analytics

| Method | Endpoint      | Description                 |
| ------ | ------------- | --------------------------- |
| GET    | `/analytics/` | Retrieve security analytics |

### ◷ Threat Timeline

| Method | Endpoint     | Description                     |
| ------ | ------------ | ------------------------------- |
| GET    | `/timeline/` | Retrieve threat timeline events |

### 📖 API Documentation

FastAPI automatically provides interactive API documentation.

Open:

```text
http://localhost:8000/docs
```

The Swagger interface can be used to view and test the available API endpoints.


## 🧪 Testing & Performance Results

Testing was performed as part of **Milestone 4 — Testing, Deployment & Documentation**.

The application was tested for functionality, API availability, database connectivity, performance, and Docker deployment.

### ✅ Functional Testing

| Test Case               | Result   |
| ----------------------- | -------- |
| User Registration       | ✅ Passed |
| User Login              | ✅ Passed |
| Dashboard               | ✅ Passed |
| Live Network Monitoring | ✅ Passed |
| Threat Alerts           | ✅ Passed |
| Security Analytics      | ✅ Passed |
| AI Predictions          | ✅ Passed |
| Threat Timeline         | ✅ Passed |
| Sidebar Navigation      | ✅ Passed |
| Docker Deployment       | ✅ Passed |

### 🔌 API Testing

| Test                      |      Result |
| ------------------------- | ----------: |
| FastAPI Root Endpoint     |  Successful |
| `/monitoring/live-alerts` |    HTTP 200 |
| `/predictions/`           |    HTTP 200 |
| `/timeline/`              |    HTTP 200 |
| MongoDB Health Check      | `{ ok: 1 }` |
| Stored Alert Records      |       1,438 |

### ⚡ Performance Testing

| Component / Test               |    Result |
| ------------------------------ | --------: |
| Frontend Response Time         |  81.17 ms |
| Initial Backend Response       | 656.86 ms |
| Live Monitoring API            | 142.23 ms |
| Average of 10 Backend Requests |  ~64.3 ms |
| Fastest Backend Request        |  31.58 ms |
| Slowest Backend Request        | 228.02 ms |

### 🐳 Docker Resource Usage

| Container | CPU Usage | Memory Usage |
| --------- | --------: | -----------: |
| Frontend  |     0.00% |      9.01 MB |
| Backend   |     0.49% |    302.10 MB |
| MongoDB   |     1.78% |    164.90 MB |

### 📋 Testing Conclusion

The NetShield AI platform successfully completed functional, API, database, performance, and Docker deployment testing.

All major application modules operated successfully. The tested APIs returned successful responses, MongoDB was connected successfully, and the database contained 1,438 security alert records.

The frontend demonstrated an 81.17 ms response time, while the live monitoring API responded in 142.23 ms. Docker resource utilization remained within the observed system limits during testing.


## 🖥️ Application Screenshots

The following screenshots demonstrate the main modules and functionality of the NetShield AI platform.

### 🔐 Login

The login page provides authenticated access to the NetShield AI security platform.

> 📷 *Add Login page screenshot here*

---

### 📝 User Registration

The registration page allows new users to create an account.

> 📷 *Add Registration page screenshot here*

---

### 📊 Security Dashboard

The main dashboard provides an overview of network security activity, detected threats, risk levels, and system status.

> 📷 *Add Dashboard screenshot here*

---

### 📡 Live Network Monitoring

The Live Network page displays real-time network events, detected threats, risk information, and monitoring status.

> 📷 *Add Live Network screenshot here*

---

### 🚨 Threat Alerts

The Threat Alerts module allows security analysts to review and manage detected security incidents.

> 📷 *Add Threat Alerts screenshot here*

---

### 📈 Security Analytics

The Security Analytics page provides detailed security metrics, threat distributions, risk analysis, and attack patterns.

> 📷 *Add Security Analytics screenshot here*

---

### 🤖 AI Predictions

The AI Predictions page displays machine learning predictions, threat classifications, confidence levels, severity, and risk scores.

> 📷 *Add AI Predictions screenshot here*

---

### ◷ Threat Timeline

The Threat Timeline provides a chronological view of detected security events.

> 📷 *Add Threat Timeline screenshot here*

---

### 🔍 Incident Investigation

The Investigation page provides detailed information about individual security incidents and allows analysts to manage their investigation workflow.

> 📷 *Add Investigation screenshot here*

---

### 📄 Security Report

NetShield AI can generate PDF reports containing information about investigated security incidents.

> 📷 *Add Security Report screenshot here*


## 🔮 Future Enhancements

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

## 🎯 Project Outcomes

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
* Docker-based deployment

The project provides a complete foundation for an AI-assisted network security monitoring system.

---

## 📌 Milestone 4

**Milestone 4 — Testing, Deployment & Documentation**

The project was tested across its major functional modules and deployed successfully using Docker Compose.

The milestone focused on:

* Functional testing
* API testing
* Database validation
* Performance testing
* Docker deployment
* Application documentation
* Preparation for cloud deployment using AWS/Azure

---

## 👩‍💻 Project

**NetShield AI — Network Anomaly Detection & Threat Monitoring System**

Built using **React, FastAPI, MongoDB, Machine Learning, and Docker**.

---

## 📄 License

This project was developed for educational and academic purposes.


