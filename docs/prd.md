# Product Requirements Document (PRD)
## NetShield AI: Network Anomaly Detection & Threat Monitoring System

---

### 1. Document Control & Metadata
- **Project Name:** NetShield AI
- **Document Version:** 1.0.0
- **Status:** Approved / Baseline Architecture
- **Target Audience:** Technical Leads, Security Analysts, Software Engineers, AI/ML Engineers, SOC Managers, Academic Evaluators

---

### 2. Executive Summary & Problem Statement
Modern enterprise networks face continuous, sophisticated cyber threats, ranging from Distributed Denial of Service (DDoS) attacks and exfiltration attempts to subtle reconnaissance and zero-day exploits. Traditional signature-based Intrusion Detection Systems (IDS) frequently fail to identify novel anomalies and generate high rates of false positives, leading to security analyst fatigue.

**NetShield AI** solves this problem by providing an AI-driven, centralized SOC-style platform that continuously ingests network flow telemetry, extracts deep statistical features, performs unsupervised anomaly detection and multi-class intrusion classification using machine learning models trained on benchmark datasets (CIC-IDS-2017 and UNSW-NB15), calculates an explainable 0–100 risk score, and facilitates full alert triage and incident management workflows.

---

### 3. Objectives & Core Value Proposition
- **Automated Threat Detection:** Identify anomalous network patterns and classify attack types with high precision and recall.
- **Explainable Risk Scoring:** Synthesize complex telemetry and model confidence into an intuitive 0–100 threat/risk metric.
- **SOC Analyst Productivity:** Streamline alert management, triage, false-positive labeling, and incident escalation.
- **Defensive & Educational Focus:** Provide a safe, production-grade cybersecurity research platform without offensive or destructive capabilities.
- **Enterprise-Ready UI/UX:** Deliver a high-density, dark-themed SOC web application adhering to modern design standards.

---

### 4. Target User Roles & Personas

| Role Name | Description & Key Responsibilities | Primary System Modules Used |
| :--- | :--- | :--- |
| **ADMIN** | System administrator responsible for user onboarding, role assignments, system settings, and immutable audit logs. | User Management, Audit Logs, Model Registry |
| **SOC_MANAGER** | Operational leader monitoring overall security posture, reviewing high-severity incidents, analyzing reports, and assigning analysts. | Overview Dashboard, Incidents, Threat Intel, Reports |
| **SECURITY_ANALYST** | Front-line defender triaging live traffic flows, investigating alerts, annotating findings, and escalating alerts to incidents. | Live Monitor, Alerts, Alert Detail, Incidents, Anomalies |
| **VIEWER** | Executive or auditor seeking read-only visibility into security posture and high-level reports. | Overview Dashboard, Analytics, Reports (Read-Only) |

---

### 5. Scope of System

#### In-Scope Features
- Multi-dataset ingestion supporting `CIC-IDS-2017` and `UNSW-NB15` CSV files and custom flow formats.
- Preprocessing and feature engineering pipeline with zero ML data leakage.
- Machine learning models for Anomaly Detection (Isolation Forest baseline) and Attack Classification (XGBoost/Random Forest).
- Explainable Risk Engine generating 0–100 Risk Scores mapped to 4 severity bands (`Low`, `Medium`, `High`, `Critical`).
- Full Alert Management lifecycle (`NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`).
- Incident Management module connecting multiple alerts to structured incident investigations.
- Mock Threat Intelligence enrichment (IP reputation, Geo-IP, IOC matching).
- Comprehensive SOC Dashboard, Live Monitoring view with pause/resume controls, and Advanced Analytics.
- Role-Based Access Control (RBAC) enforced server-side.
- Immutable system audit logging.
- Dockerized container deployment.

#### Out-of-Scope (Explicit Prohibitions)
- Offensive execution scripts, exploit payloads, automated attack vectors, or unauthorized network scanning tools.
- Live OS raw packet capture requiring root/admin OS level privileges (isolated/simulated stream engine used instead).
- Third-party paid Threat Intel API dependencies (mock provider used out of the box).

---

### 6. Functional Requirements Matrix

#### FR-1: Authentication & User Management
- **FR-1.1:** System shall authenticate users via JWT access tokens using secure password hashing (bcrypt/Argon2).
- **FR-1.2:** System shall enforce RBAC for `ADMIN`, `SOC_MANAGER`, `SECURITY_ANALYST`, and `VIEWER` roles on all API routes.
- **FR-1.3:** Administrators shall be able to create, update, deactivate, and assign roles to users.

#### FR-2: Data Ingestion & Dataset Adapters
- **FR-2.1:** System shall ingest dataset CSV files conforming to `CIC-IDS-2017` and `UNSW-NB15` standard formats.
- **FR-2.2:** System shall provide dedicated adapters (`CICIDS2017Adapter` and `UNSWNB15Adapter`) to map dataset-specific columns to an internal `NormalizedFlow` schema.
- **FR-2.3:** System shall validate schema integrity and drop or impute corrupted/missing records during ingestion.

#### FR-3: Machine Learning & Risk Scoring Engine
- **FR-3.1:** System shall execute anomaly detection model to assign an `anomaly_score` (0.00 to 1.00) and binary status (`normal`/`anomalous`).
- **FR-3.2:** System shall execute multi-class attack classification model to predict attack categories (e.g., `DoS`, `PortScan`, `Brute Force`, `Exploits`) with confidence metrics.
- **FR-3.3:** System shall calculate an explainable 0–100 Risk Score using a weighted combination of anomaly score, attack severity, and asset criticality.

#### FR-4: Alert & Incident Triage Workflow
- **FR-4.1:** System shall automatically generate security alerts for traffic flows exceeding designated risk thresholds (e.g., Risk Score $\ge 60$).
- **FR-4.2:** Analysts shall be able to acknowledge, assign, annotate, resolve, or mark alerts as false positive.
- **FR-4.3:** Analysts and Managers shall be able to correlate one or more alerts into a formal Incident record with timeline tracking and resolution summaries.

#### FR-5: Dashboard & Analytics Visualization
- **FR-5.1:** SOC Dashboard shall display real-time KPI metrics: Total Traffic, Analyzed Flows, Detected Anomalies, Active Alerts, Critical Threats, and Detection Rate.
- **FR-5.2:** Dashboard shall provide responsive visual charts for Traffic Over Time, Anomaly Trends, Attack Category Distribution, Protocol Distribution, and Risk Bands.
- **FR-5.3:** Live Monitor page shall display streaming traffic telemetry with interactive pause/resume and protocol/IP filter controls.

#### FR-6: Audit & Reporting
- **FR-6.1:** System shall log all administrative, operational, authentication, and status-change actions to an immutable audit trail.
- **FR-6.2:** System shall support exporting traffic flow, alert, and incident reports to CSV format.

---

### 7. Non-Functional Requirements (NFRs)

- **NFR-1 (Performance):** Dashboard UI initial render time shall be $\le 1.5$ seconds under normal network conditions. API telemetry query endpoints with pagination shall respond in $\le 200$ ms.
- **NFR-2 (Security):** All user credentials must be stored with secure salt/hash algorithms. All API endpoints must sanitize input data to prevent SQL Injection, XSS, and broken access controls.
- **NFR-3 (Usability & Aesthetics):** UI shall adhere to a modern dark SOC visual theme, WCAG 2.1 AA accessibility guidelines, with responsive support across desktop and tablet viewpoints.
- **NFR-4 (Reliability & Maintainability):** Core application code must maintain clean separation of concerns (Layered Backend architecture, modular React components).
- **NFR-5 (Deployability):** Application stack must be fully containerized using Docker and Docker Compose with single-command deployment capabilities (`docker compose up --build`).

---

### 8. Key Technical Risks & Mitigation Plan

1. **Risk:** High memory footprint when processing multi-gigabyte raw dataset CSVs.
   - **Mitigation:** Implement chunked file processing (`pandas.read_csv(..., chunksize=10000)`) and sample dataset extraction.
2. **Risk:** Data leakage in ML preprocessing pipeline leading to artificially inflated accuracy metrics.
   - **Mitigation:** Strictly fit all scalers, encoders, and imputers on training data splits only; serialize pipeline parameters with model artifacts.
3. **Risk:** Incompatible feature columns between CIC-IDS-2017 and UNSW-NB15.
   - **Mitigation:** Use isolated dataset adapters to preserve raw dataset features while exposing standard `NormalizedFlow` abstractions.

---

### 9. Success Metrics
- **Model Detection Accuracy:** $\ge 92\%$ accuracy and $\ge 0.90$ F1-score on benchmark dataset test splits.
- **API Performance:** 95% of standard read API requests completed within 150 ms.
- **Test Coverage:** $\ge 80\%$ code coverage on core backend services and ML preprocessing modules.
