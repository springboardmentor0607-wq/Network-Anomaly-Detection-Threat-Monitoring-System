-- NetShield AI: PostgreSQL Schema Definition (Matching Specification Document)

-- 1. Users Table (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'SECURITY_ANALYST' CHECK (role IN ('ADMIN', 'SECURITY_ANALYST', 'AUDITOR')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Datasets Table (Traffic File Ingestion)
CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    dataset_type VARCHAR(100) DEFAULT 'CICIDS2017',
    rows_count INT DEFAULT 0,
    columns_count INT DEFAULT 78,
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    has_ground_truth BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'PROCESSED' CHECK (status IN ('PROCESSING', 'PROCESSED', 'FAILED')),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Predictions Table (ML Classifications)
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    dataset_id INT REFERENCES datasets(id) ON DELETE CASCADE,
    actual_label VARCHAR(100),
    predicted_label VARCHAR(100) NOT NULL,
    confidence FLOAT DEFAULT 0.95,
    risk_score INT DEFAULT 50,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Threats Table (Malicious Incursion Telemetry)
CREATE TABLE IF NOT EXISTS threats (
    id SERIAL PRIMARY KEY,
    prediction_id INT REFERENCES predictions(id) ON DELETE CASCADE,
    attack_type VARCHAR(100) NOT NULL,
    source_ip VARCHAR(50) NOT NULL,
    destination_ip VARCHAR(50) NOT NULL,
    protocol VARCHAR(20) DEFAULT 'TCP',
    confidence FLOAT DEFAULT 0.95,
    risk_score INT DEFAULT 50,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'INVESTIGATING', 'CONTAINED', 'RESOLVED')),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    threat_id INT REFERENCES threats(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    alert_type VARCHAR(100) DEFAULT 'Threat Detection',
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'INVESTIGATING', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Incidents Table (SOC Incident Escalation)
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    alert_id INT REFERENCES security_alerts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'HIGH' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    alert_id INT REFERENCES security_alerts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audit Logs Table (Compliance & Activity Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Threat Intelligence Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id SERIAL PRIMARY KEY,
    attack_type VARCHAR(100) UNIQUE NOT NULL,
    severity VARCHAR(20) NOT NULL,
    risk_score INT DEFAULT 50,
    description TEXT,
    recommended_response TEXT
);

-- 10. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) DEFAULT 'Threat Detection Security Report',
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    summary_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
