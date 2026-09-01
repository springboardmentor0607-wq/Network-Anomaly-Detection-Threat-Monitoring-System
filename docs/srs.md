# Software Requirements Specification (SRS)
## NetShield AI: Network Anomaly Detection & Threat Monitoring System

---

### 1. Introduction

#### 1.1 Purpose
This Software Requirements Specification (SRS) details the functional, non-functional, interface, data, security, and performance specifications for **NetShield AI: Network Anomaly Detection & Threat Monitoring System**. This document serves as the technical contract for system development, verification, and deployment.

#### 1.2 System Scope
NetShield AI is a modern defensive cybersecurity web platform designed to ingest network flow records, preprocess and transform tabular telemetry, execute machine learning anomaly detection and multi-class attack classification, compute risk scores, generate prioritized security alerts, manage security incidents, and visualize security analytics through a specialized SOC dashboard interface.

#### 1.3 Definitions & Acronyms
- **SOC:** Security Operations Center
- **IDS:** Intrusion Detection System
- **CICIDS2017:** Canadian Institute for Cybersecurity Intrusion Detection System 2017 Dataset
- **UNSW-NB15:** University of New South Wales Network Baseline 2015 Dataset
- **RBAC:** Role-Based Access Control
- **JWT:** JSON Web Token
- **IOC:** Indicator of Compromise
- **SSE:** Server-Sent Events

---

### 2. Overall Description

#### 2.1 User Classes and Characteristics
- **System Administrator (`ADMIN`):** High technical capability; manages system settings, user authorization, database seeds, audit trails, and ML model registry activations.
- **SOC Manager (`SOC_MANAGER`):** High operational capability; oversees security operations, monitors team performance metrics, manages major security incidents, and generates formal compliance/executive reports.
- **Security Analyst (`SECURITY_ANALYST`):** Technical security practitioner; investigates real-time monitoring streams, triages alerts, reviews AI anomaly explanations, marks false positives, and documents incident details.
- **Auditor / Viewer (`VIEWER`):** Technical or non-technical stakeholder; inspects high-level dashboard metrics, security reports, and system analytics in a strictly read-only capacity.

#### 2.2 Operating Environment
- **Server Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12), macOS, or Windows 11 with Docker Desktop.
- **Runtime Dependencies:** Python 3.11+, Node.js 18+, PostgreSQL 15+.
- **Client Browsers:** Modern evergreen web browsers (Google Chrome 110+, Mozilla Firefox 110+, Apple Safari 16+, Microsoft Edge 110+).

---

### 3. System Interfaces & Data Requirements

#### 3.1 User Interfaces
- **Visual Theme:** Modern dark SOC aesthetic (`#0B0F17` base background, `#111827` surface cards, `#1F2937` borders).
- **Primary Layout:** Desktop-first layout featuring a collapsible left navigation sidebar, top system navigation/global search bar, main content viewport, and alert drawer overlays.
- **Responsive Layout:** Adaptive layouts supporting desktop ($1280px+$), laptop ($1024px$), tablet ($768px$), and mobile ($375px$) breakpoints.

#### 3.2 Hardware & Software Interfaces
- **Database Interface:** PostgreSQL via SQLAlchemy 2.0 ORM with connection pooling (`pool_size=10`, `max_overflow=20`).
- **File System Interface:** Local disk storage for ML model artifacts (`ml_artifacts/`), raw dataset files (`data/raw/`), and sample CSV exports.
- **External Integration Interface (Mock/Optional):** RESTful HTTP integration points for Threat Intelligence enrichment (Geo-IP and IP Reputation lookup adapters).

#### 3.3 Data Entity Schemas

```
+-------------------+       +-------------------+       +-------------------+
|      User         |       |    TrafficFlow    |       |      Alert        |
+-------------------+       +-------------------+       +-------------------+
| id: UUID (PK)     |       | id: UUID (PK)     |       | id: UUID (PK)     |
| email: String     | 1   * | timestamp: DateTime| 1   * | alert_id: String  |
| password_hash: Str|-----> | src_ip: String    |-----> | severity: Enum    |
| role: Enum        |       | dst_ip: String    |       | status: Enum      |
| created_at: Date  |       | protocol: String  |       | risk_score: Int   |
+-------------------+       | bytes: Integer    |       | assigned_to: UUID |
                            | anomaly_score:Fl  |       +-------------------+
                            | risk_score: Int   |                 │
                            +-------------------+                 │ *
                                                                  ▼ 1
                                                        +-------------------+
                                                        |     Incident      |
                                                        +-------------------+
                                                        | id: UUID (PK)     |
                                                        | title: String     |
                                                        | status: Enum      |
                                                        | owner_id: UUID    |
                                                        +-------------------+
```

---

### 4. Detailed Functional Requirements

#### 4.1 Module 1: User Management & Authentication
- **SRS-FUN-1.1:** System shall validate user credentials at `POST /api/v1/auth/login` and issue an OAuth2-compliant JWT containing user ID, role, and expiration timestamp.
- **SRS-FUN-1.2:** System shall verify JWT signatures on all protected endpoint requests and reject unauthenticated requests with HTTP 401 Unauthorized.
- **SRS-FUN-1.3:** System shall enforce role permissions per route, returning HTTP 403 Forbidden when a user attempts unauthorized operations.

#### 4.2 Module 2: Traffic Ingestion & Flow Processing
- **SRS-FUN-2.1:** System shall accept CSV file uploads (`POST /api/v1/traffic/upload`) containing network flow telemetry.
- **SRS-FUN-2.2:** System shall invoke `CICIDS2017Adapter` or `UNSWNB15Adapter` to parse, clean, and convert uploaded dataset rows into normalized database entities (`TrafficFlow`).
- **SRS-FUN-2.3:** System shall calculate flow rates, packet sizes, duration statistics, and protocol categorizations during flow parsing.

#### 4.3 Module 3: Preprocessing & Machine Learning Pipeline
- **SRS-FUN-3.1:** ML pipeline shall clean missing or infinite values, encode categorical protocols/states, and scale numeric features using pre-fitted transformers.
- **SRS-FUN-3.2:** System shall pass preprocessed flows to the Anomaly Detection service to compute `anomaly_score` (float in range $[0.0, 1.0]$) and binary anomaly classification.
- **SRS-FUN-3.3:** System shall execute the multi-class Attack Classifier to predict specific attack categories (e.g., `DoS`, `PortScan`, `Brute Force`, `Web Attack`, `Exploits`, `Benign`) along with confidence probabilities.
- **SRS-FUN-3.4:** Risk Engine shall execute the deterministic formula:
  $$\text{RiskScore} = \text{Clamp}_{0}^{100}\left( 0.35 \times (\text{AnomalyScore} \times 100) + 0.45 \times (\text{AttackWeight} \times \text{Confidence}) + 0.20 \times \text{AssetCriticality} \right)$$

#### 4.4 Module 4: Alert & Incident Management
- **SRS-FUN-4.1:** System shall automatically trigger a new `Alert` entity whenever a processed flow exhibits a `RiskScore` $\ge 60$ or an `anomaly_score` $\ge 0.75$.
- **SRS-FUN-4.2:** System shall support updating alert status across `NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`, and `FALSE_POSITIVE`.
- **SRS-FUN-4.3:** System shall allow analysts to group multiple alerts into an `Incident` record with an assigned owner, title, description, severity rating, and resolution summary.

#### 4.5 Module 5: Analytics & Real-Time Monitoring
- **SRS-FUN-5.1:** System shall provide aggregated metrics for total traffic, flow rates, detected anomalies, active alerts, risk distribution, and protocol distributions.
- **SRS-FUN-5.2:** Live Monitor stream (`GET /api/v1/monitoring/stream`) shall broadcast simulated or ingested network flows over SSE/WebSocket connections to connected clients.

#### 4.6 Module 6: Audit Logging
- **SRS-FUN-6.1:** System shall record an immutable `AuditLog` entry for user login attempts, password changes, alert status modifications, incident updates, user management actions, and model activations.

---

### 5. Non-Functional & Quality Attributes

#### 5.1 Security Requirements
- All user passwords must be hashed using `bcrypt` (work factor $\ge 12$) or `Argon2id`.
- Secret keys must be retrieved exclusively from environment variables (`.env`).
- API inputs must undergo strict Pydantic model validation.
- SQL queries must be executed via parameterized ORM statements to prevent SQL injection.

#### 5.2 Performance & Scalability
- Database indexes must be placed on `timestamp`, `src_ip`, `dst_ip`, `severity`, `status`, and `risk_score` columns.
- API endpoints returning flow tables must support offset/limit pagination (default page size: 50 records).

#### 5.3 Software Quality & Maintainability
- Type hinting must be used across all Python code (`mypy` compliant).
- TypeScript strict mode must be enabled for frontend applications (`"strict": true`).
- Code must maintain clear modular architecture with zero circular dependencies.

---

### 6. Acceptance Criteria

1. User can successfully log in using demo credentials and receive a valid JWT token.
2. Analyst can upload a CIC-IDS-2017 or UNSW-NB15 sample CSV file and observe parsed flow telemetry in the UI.
3. System accurately flags anomalous flows and displays risk scores with clear contributing factors.
4. Alerts can be triaged, assigned, resolved, or marked as false positives with updated audit trail entries.
5. System builds cleanly in Docker containers via `docker compose up --build`.
