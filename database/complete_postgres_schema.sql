-- NetShield AI: Complete PostgreSQL Schema Definition
-- Primary Relational Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SECURITY_ANALYST',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- 3. Datasets Table
CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    dataset_type VARCHAR(100) NOT NULL,
    rows_count INT NOT NULL DEFAULT 0,
    columns_count INT NOT NULL DEFAULT 0,
    uploaded_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    has_ground_truth BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'PROCESSED'
);
CREATE INDEX IF NOT EXISTS idx_datasets_uploaded_by ON datasets(uploaded_by);

-- 4. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    dataset_id INT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_label VARCHAR(100) DEFAULT 'N/A',
    predicted_label VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.0,
    risk_score INT NOT NULL DEFAULT 0,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW'
);
CREATE INDEX IF NOT EXISTS idx_predictions_dataset ON predictions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_predictions_severity ON predictions(severity);
CREATE INDEX IF NOT EXISTS idx_predictions_label ON predictions(predicted_label);

-- 5. Threats Table
CREATE TABLE IF NOT EXISTS threats (
    id SERIAL PRIMARY KEY,
    prediction_id INT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    attack_type VARCHAR(100) NOT NULL,
    source_ip VARCHAR(50) DEFAULT 'Not available',
    destination_ip VARCHAR(50) DEFAULT 'Not available',
    protocol VARCHAR(20) DEFAULT 'TCP',
    confidence FLOAT NOT NULL DEFAULT 0.0,
    risk_score INT NOT NULL DEFAULT 0,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'NEW'
);
CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats(severity);
CREATE INDEX IF NOT EXISTS idx_threats_attack ON threats(attack_type);
CREATE INDEX IF NOT EXISTS idx_threats_detected ON threats(detected_at);

-- 6. Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    threat_id INT NULL REFERENCES threats(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    alert_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON security_alerts(severity);

-- 7. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    alert_id INT NULL REFERENCES security_alerts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    assigned_to INT NULL REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolution TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id INT NULL REFERENCES security_alerts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 9. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    generated_by INT NULL REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_summary JSONB NULL
);

-- 10. Threat Intelligence Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id SERIAL PRIMARY KEY,
    attack_type VARCHAR(100) NOT NULL UNIQUE,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    risk_score INT NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    recommended_response TEXT NOT NULL,
    detection_count INT NOT NULL DEFAULT 0,
    last_detected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Network Traffic Table
CREATE TABLE IF NOT EXISTS network_traffic (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_ip VARCHAR(50) DEFAULT 'Not available',
    destination_ip VARCHAR(50) DEFAULT 'Not available',
    protocol VARCHAR(20) DEFAULT 'TCP',
    packets INT DEFAULT 0,
    bytes BIGINT DEFAULT 0,
    duration FLOAT DEFAULT 0.0,
    traffic_rate FLOAT DEFAULT 0.0
);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON network_traffic(timestamp);

-- 12. Network Logs Table
CREATE TABLE IF NOT EXISTS network_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_ip VARCHAR(50) DEFAULT '127.0.0.1',
    destination_ip VARCHAR(50) DEFAULT '127.0.0.1',
    protocol VARCHAR(20) DEFAULT 'TCP',
    packets INT DEFAULT 0,
    bytes BIGINT DEFAULT 0,
    duration FLOAT DEFAULT 0.0,
    traffic_rate FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'NORMAL'
);
CREATE INDEX IF NOT EXISTS idx_network_logs_timestamp ON network_logs(timestamp);
