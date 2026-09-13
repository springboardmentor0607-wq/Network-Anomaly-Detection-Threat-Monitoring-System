# Database Architecture & Schema Documentation
## NetShield AI: Network Anomaly Detection & Threat Monitoring System

---

### 1. Overview
The database layer for NetShield AI is designed around a normalized relational architecture using **PostgreSQL 15** and **SQLAlchemy 2.0 ORM**. It provides strong data integrity, foreign key cascading rules, index optimizations for high-volume network telemetry, and immutable audit logs.

---

### 2. Entity Relationship Summary

```
                       +-------------------+
                       |       ROLES       |
                       +-------------------+
                                 │
                                 │ 1:N
                                 ▼
+-------------------+  1:N  +-------------------+  1:N  +-------------------+
|       TEAMS       |──────>|       USERS       |──────>|     INCIDENTS     |
+-------------------+       +-------------------+       +-------------------+
                                                                  │
                                                                  │ 1:N
                                                                  ▼
                            +-------------------+  N:1  +-------------------+
                            |   TRAFFIC_FLOWS   |<──────|      ALERTS       |
                            +-------------------+       +-------------------+
                              │      │      │
                              │ 1:N  │ 1:N  │ 1:N
                              ▼      ▼      ▼
                        +-----------+ +-----------+ +-----------+
                        | ANOMALIES | |PREDICTIONS| |RISK_SCORES|
                        +-----------+ +-----------+ +-----------+
```

---

### 3. Detailed Table Schemas

#### 3.1 `roles`
Stores application RBAC roles.
- `id`: UUID (Primary Key)
- `name`: Enum (`ADMIN`, `SOC_MANAGER`, `SECURITY_ANALYST`, `VIEWER`) (Unique, Indexed)
- `description`: String (255)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.2 `teams`
Stores SOC teams and departments.
- `id`: UUID (Primary Key)
- `name`: String (100) (Unique, Indexed)
- `description`: String (255)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.3 `users`
Stores user accounts with hashed credentials.
- `id`: UUID (Primary Key)
- `email`: String (255) (Unique, Indexed)
- `full_name`: String (100)
- `password_hash`: String (255)
- `is_active`: Boolean (Default: true)
- `last_login`: DateTime (TZ, Nullable)
- `role_id`: UUID (Foreign Key -> `roles.id`)
- `team_id`: UUID (Foreign Key -> `teams.id`, Nullable)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.4 `traffic_flows`
Stores network flow telemetry ingested from datasets or live streams.
- `id`: UUID (Primary Key)
- `timestamp`: DateTime (TZ) (Indexed)
- `source_ip`: String (45) (Indexed)
- `destination_ip`: String (45) (Indexed)
- `source_port`: Integer
- `destination_port`: Integer (Indexed)
- `protocol`: String (20) (Indexed)
- `packets`: BigInteger
- `bytes`: BigInteger
- `duration`: Float
- `dataset_source`: String (50)
- `metadata_json`: JSON / JSONB (Nullable)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.5 `anomalies`
Stores unsupervised ML anomaly detection outputs.
- `id`: UUID (Primary Key)
- `flow_id`: UUID (Foreign Key -> `traffic_flows.id` ON DELETE CASCADE, Indexed)
- `anomaly_score`: Float (0.0 to 1.0, Indexed)
- `is_anomaly`: Boolean (Indexed)
- `model_name`: String (100)
- `model_version`: String (50)
- `contributing_features`: JSON / JSONB
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.6 `predictions`
Stores supervised multi-class attack classification outputs.
- `id`: UUID (Primary Key)
- `flow_id`: UUID (Foreign Key -> `traffic_flows.id` ON DELETE CASCADE, Indexed)
- `predicted_class`: String (100) (Indexed)
- `confidence`: Float (0.0 to 1.0)
- `model_name`: String (100)
- `model_version`: String (50)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.7 `risk_scores`
Stores explainable composite risk scores.
- `id`: UUID (Primary Key)
- `flow_id`: UUID (Foreign Key -> `traffic_flows.id` ON DELETE CASCADE, Indexed)
- `score`: Integer (0 to 100, Indexed)
- `severity`: Enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) (Indexed)
- `explanation`: JSON / JSONB
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.8 `alerts`
Stores prioritized security alert records.
- `id`: UUID (Primary Key)
- `alert_id`: String (50) (Unique, Indexed, e.g. "ALT-2026-0001")
- `title`: String (255)
- `alert_type`: String (100) (Indexed)
- `severity`: Enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) (Indexed)
- `status`: Enum (`NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`) (Indexed)
- `risk_score`: Integer (Indexed)
- `flow_id`: UUID (Foreign Key -> `traffic_flows.id` ON DELETE CASCADE, Indexed)
- `assigned_to_id`: UUID (Foreign Key -> `users.id`, Nullable)
- `incident_id`: UUID (Foreign Key -> `incidents.id`, Nullable)
- `notes`: Text (Nullable)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.9 `incidents`
Stores multi-alert incident investigation cases.
- `id`: UUID (Primary Key)
- `incident_id`: String (50) (Unique, Indexed, e.g. "INC-2026-0001")
- `title`: String (255)
- `description`: Text
- `severity`: String (50)
- `status`: Enum (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) (Indexed)
- `owner_id`: UUID (Foreign Key -> `users.id`)
- `resolution_summary`: Text (Nullable)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.10 `threat_intelligence`
Stores IP reputation and Geo-IP enrichment data.
- `id`: UUID (Primary Key)
- `ip_address`: String (45) (Unique, Indexed)
- `threat_score`: Integer (0 to 100, Indexed)
- `reputation`: String (50)
- `country_code`: String (10)
- `country_name`: String (100)
- `isp`: String (100)
- `known_attack_types`: JSON / JSONB
- `ioc_matches`: JSON / JSONB
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.11 `ml_models`
Stores model registry entries, performance metrics, and active version flags.
- `id`: UUID (Primary Key)
- `name`: String (100) (Indexed)
- `version`: String (50) (Indexed)
- `algorithm`: String (100)
- `task_type`: String (50)
- `dataset_name`: String (100)
- `is_active`: Boolean (Indexed)
- `accuracy`, `precision`, `recall`, `f1_score`: Float
- `metrics_json`: JSON / JSONB
- `artifact_path`: String (255)
- `created_at`, `updated_at`: DateTime (TZ)

#### 3.12 `audit_logs`
Stores immutable system audit records.
- `id`: UUID (Primary Key)
- `timestamp`: DateTime (TZ) (Indexed)
- `user_email`: String (255) (Indexed, Nullable)
- `action`: String (100) (Indexed)
- `resource`: String (100)
- `status_result`: String (50)
- `ip_address`: String (45)
- `details`: JSON / JSONB
- `created_at`, `updated_at`: DateTime (TZ)

---

### 4. Database Initialization & Seeding Commands

Run the seed script to create all schema tables and populate initial roles, demo users, models, and threat intelligence records:

```bash
cd backend
python -m app.db.seed
```

Default seeded credentials created:
- `admin@netshield.ai` / `AdminPass123!` (Role: `ADMIN`)
- `manager@netshield.ai` / `AdminPass123!` (Role: `SOC_MANAGER`)
- `analyst@netshield.ai` / `AdminPass123!` (Role: `SECURITY_ANALYST`)
- `viewer@netshield.ai` / `AdminPass123!` (Role: `VIEWER`)
