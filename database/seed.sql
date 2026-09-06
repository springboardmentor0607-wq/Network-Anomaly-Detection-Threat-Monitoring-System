-- NetShield AI Seed Data
USE netshield_ai;

-- 1. Seed Users (Admin@123, Analyst@123)
INSERT INTO users (name, email, password_hash, role, status)
VALUES
('System Admin', 'admin@netshield.ai', 'scrypt:32768:8:1$QdWHcvJFjnod7ZEM$26a186315f9236b6d1387dfd68924f7eff9463be7a390dc1fc86e6b683ef52721f6c292f580390fc2f4ae200262e965d0606b2b8838af120b575da93f02996b7', 'ADMIN', 'ACTIVE'),
('Security Analyst', 'analyst@netshield.ai', 'scrypt:32768:8:1$bS8wK0tdCfAJAH7E$859141465e3bfeba438c73deb1d18e8b61bcc9092ed40b8952c8af9d1a42a21e073ecb2d00ebaadb74426c2737caed233d23ac67e9efd51474848fdbceaa817d', 'SECURITY_ANALYST', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Seed Initial Audit Log
INSERT INTO audit_logs (user_id, action, module, ip_address)
VALUES (1, 'SYSTEM_INITIALIZATION', 'DATABASE', '127.0.0.1');

-- 3. Seed Threat Intelligence Baselines
INSERT INTO threat_intelligence (attack_type, severity, risk_score, description, recommended_response, detection_count)
VALUES
('BENIGN', 'LOW', 5, 'Normal network traffic exhibiting standard protocol behaviors with no malicious payload signatures.', 'Continue routine passive telemetry monitoring. No defensive action needed.', 0),
('FTP-Patator', 'MEDIUM', 65, 'Automated brute-force password guessing attack targeting FTP services to gain unauthorized access.', 'Enforce rate-limiting on port 21, temporarily block attacking IPs via firewall, and enforce strong password policies.', 0),
('SSH-Patator', 'HIGH', 80, 'Brute-force SSH attack attempting dictionary credentials against administrative remote terminals.', 'Disable password authentication on SSH (enforce Ed25519 keys), bind SSH to non-standard port or VPN, and ban source IP via Fail2Ban.', 0),
('DDoS', 'CRITICAL', 95, 'Distributed Denial of Service attack flooding bandwidth and connection pools to bring down mission-critical services.', 'Trigger BGP Anycast scrubbing, activate Cloudflare/AWS Shield DDoS mitigation rate-limits, blackhole spoofed subnet traffic, and engage incident response team.', 0)
ON DUPLICATE KEY UPDATE 
    description=VALUES(description),
    recommended_response=VALUES(recommended_response),
    risk_score=VALUES(risk_score),
    severity=VALUES(severity);
