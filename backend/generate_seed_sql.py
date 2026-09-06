from werkzeug.security import generate_password_hash
import os

admin_hash = generate_password_hash("Admin@123", method='scrypt')
analyst_hash = generate_password_hash("Analyst@123", method='scrypt')

seed_sql = f"""-- NetShield AI Seed Data
USE netshield_ai;

-- 1. Seed Users (Passwords: Admin@123, Analyst@123)
INSERT INTO users (name, email, password_hash, role, status)
VALUES
('System Admin', 'admin@netshield.ai', '{admin_hash}', 'ADMIN', 'ACTIVE'),
('Security Analyst', 'analyst@netshield.ai', '{analyst_hash}', 'SECURITY_ANALYST', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Seed Initial Audit Log
INSERT INTO audit_logs (user_id, action, module, ip_address)
VALUES (1, 'SYSTEM_INITIALIZATION', 'DATABASE', '127.0.0.1');
"""

seed_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'seed.sql'))
with open(seed_path, 'w', encoding='utf-8') as f:
    f.write(seed_sql)

print(f"Generated seed.sql successfully at {seed_path}")
