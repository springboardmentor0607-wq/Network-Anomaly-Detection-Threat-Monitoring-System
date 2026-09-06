-- NetShield AI Database Schema
CREATE DATABASE IF NOT EXISTS netshield_ai;
USE netshield_ai;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'SECURITY_ANALYST') NOT NULL DEFAULT 'SECURITY_ANALYST',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Datasets Table
CREATE TABLE IF NOT EXISTS datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    dataset_type VARCHAR(100) NOT NULL,
    rows_count INT NOT NULL DEFAULT 0,
    columns_count INT NOT NULL DEFAULT 0,
    uploaded_by INT NULL,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    has_ground_truth BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'PROCESSED',
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_dataset_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_label VARCHAR(100) DEFAULT 'N/A',
    predicted_label VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.0,
    risk_score INT NOT NULL DEFAULT 0,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    INDEX idx_pred_dataset (dataset_id),
    INDEX idx_pred_severity (severity),
    INDEX idx_pred_label (predicted_label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Threats Table
CREATE TABLE IF NOT EXISTS threats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prediction_id INT NULL,
    attack_type VARCHAR(100) NOT NULL,
    source_ip VARCHAR(50) DEFAULT 'Not available',
    destination_ip VARCHAR(50) DEFAULT 'Not available',
    protocol VARCHAR(20) DEFAULT 'TCP',
    confidence FLOAT NOT NULL DEFAULT 0.0,
    risk_score INT NOT NULL DEFAULT 0,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('NEW', 'INVESTIGATING', 'MITIGATED', 'RESOLVED') DEFAULT 'NEW',
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE,
    INDEX idx_threat_severity (severity),
    INDEX idx_threat_attack (attack_type),
    INDEX idx_threat_detected (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    threat_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    alert_type VARCHAR(100) NOT NULL,
    status ENUM('NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED') DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (threat_id) REFERENCES threats(id) ON DELETE CASCADE,
    INDEX idx_alert_status (status),
    INDEX idx_alert_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    assigned_to INT NULL,
    status ENUM('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolution TEXT NULL,
    FOREIGN KEY (alert_id) REFERENCES security_alerts(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_incident_status (status),
    INDEX idx_incident_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    alert_id INT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (alert_id) REFERENCES security_alerts(id) ON DELETE CASCADE,
    INDEX idx_notification_user (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    generated_by INT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_summary JSON NULL,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Threat Intelligence Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attack_type VARCHAR(100) NOT NULL UNIQUE,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    risk_score INT NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    recommended_response TEXT NOT NULL,
    detection_count INT NOT NULL DEFAULT 0,
    last_detected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Network Traffic Table
CREATE TABLE IF NOT EXISTS network_traffic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_ip VARCHAR(50) DEFAULT 'Not available',
    destination_ip VARCHAR(50) DEFAULT 'Not available',
    protocol VARCHAR(20) DEFAULT 'TCP',
    packets INT DEFAULT 0,
    bytes BIGINT DEFAULT 0,
    duration FLOAT DEFAULT 0.0,
    traffic_rate FLOAT DEFAULT 0.0,
    INDEX idx_traffic_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Network Logs Table (Stream)
CREATE TABLE IF NOT EXISTS network_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_ip VARCHAR(50) DEFAULT '127.0.0.1',
    destination_ip VARCHAR(50) DEFAULT '127.0.0.1',
    protocol VARCHAR(20) DEFAULT 'TCP',
    packets INT DEFAULT 0,
    bytes BIGINT DEFAULT 0,
    duration FLOAT DEFAULT 0.0,
    traffic_rate FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'NORMAL',
    INDEX idx_log_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
