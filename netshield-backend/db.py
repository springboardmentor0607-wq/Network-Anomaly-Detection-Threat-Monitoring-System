import psycopg2
import traceback
import os
import time

conn = None

def get_db_connection(max_retries=5, retry_delay=2):
    global conn
    if conn and not conn.closed:
        return conn

    host = os.getenv("POSTGRES_HOST", "localhost")
    database = os.getenv("POSTGRES_DB", "netshield_ai")
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "password")
    port = os.getenv("POSTGRES_PORT", "5432")

    for attempt in range(1, max_retries + 1):
        try:
            conn = psycopg2.connect(
                host=host,
                database=database,
                user=user,
                password=password,
                port=port
            )
            conn.autocommit = False
            print(f"[OK] PostgreSQL Connected Successfully! (host={host}, db={database})")
            return conn
        except Exception as e:
            if attempt < max_retries:
                print(f"[WARNING] DB Connection Attempt {attempt}/{max_retries} failed ({e}). Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                print("[WARNING] Database Connection Failed (PostgreSQL offline or credential mismatch)")
                print(e)
                return None

# Attempt initial connection
conn = get_db_connection(max_retries=1)


def init_db_tables():
    """
    Creates required database tables for Milestone-2 if they do not exist,
    and applies column migrations so all required columns are present.
    """
    db_conn = get_db_connection()
    if not db_conn:
        print("[WARNING] Skipping DB table initialization (Database offline).")
        return False

    cursor = db_conn.cursor()
    try:
        # 1. Table for AI Anomaly Predictions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS anomaly_predictions (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source_ip VARCHAR(50),
                dest_ip VARCHAR(50),
                protocol VARCHAR(20),
                prediction VARCHAR(100),
                attack_type VARCHAR(50),
                confidence NUMERIC(5, 2),
                threat_level VARCHAR(20),
                risk_score INT,
                model_name VARCHAR(50) DEFAULT 'Random Forest Classifier',
                status VARCHAR(30) DEFAULT 'Investigating'
            );
        """)
        db_conn.commit()

        # Migrate columns for anomaly_predictions
        cols_anomaly = [
            ("timestamp", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("source_ip", "VARCHAR(50)"),
            ("dest_ip", "VARCHAR(50)"),
            ("protocol", "VARCHAR(20)"),
            ("prediction", "VARCHAR(100)"),
            ("attack_type", "VARCHAR(50)"),
            ("confidence", "NUMERIC(5, 2)"),
            ("threat_level", "VARCHAR(20)"),
            ("risk_score", "INT"),
            ("model_name", "VARCHAR(50) DEFAULT 'Random Forest Classifier'"),
            ("status", "VARCHAR(30) DEFAULT 'Investigating'")
        ]
        for col_name, col_type in cols_anomaly:
            try:
                cursor.execute(f"ALTER TABLE anomaly_predictions ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
                db_conn.commit()
            except Exception:
                db_conn.rollback()

        # 2. Table for Security Alerts
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                alert_id VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                attack_type VARCHAR(100),
                severity VARCHAR(20),
                source_ip VARCHAR(50),
                dest_ip VARCHAR(50),
                protocol VARCHAR(20) DEFAULT 'TCP',
                status VARCHAR(30) DEFAULT 'New',
                acknowledged BOOLEAN DEFAULT FALSE,
                confidence NUMERIC(5, 2),
                risk_score INT,
                prediction VARCHAR(100),
                model_engine VARCHAR(50) DEFAULT 'Random Forest Classifier',
                prediction_id INT,
                incident_id INT
            );
        """)
        db_conn.commit()

        # Migrate columns for alerts
        cols_alerts = [
            ("alert_id", "VARCHAR(50)"),
            ("timestamp", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("attack_type", "VARCHAR(100)"),
            ("severity", "VARCHAR(20)"),
            ("source_ip", "VARCHAR(50)"),
            ("dest_ip", "VARCHAR(50)"),
            ("protocol", "VARCHAR(20) DEFAULT 'TCP'"),
            ("status", "VARCHAR(30) DEFAULT 'New'"),
            ("acknowledged", "BOOLEAN DEFAULT FALSE"),
            ("confidence", "NUMERIC(5, 2)"),
            ("risk_score", "INT"),
            ("prediction", "VARCHAR(100)"),
            ("model_engine", "VARCHAR(50) DEFAULT 'Random Forest Classifier'"),
            ("prediction_id", "INT"),
            ("incident_id", "INT")
        ]
        for col_name, col_type in cols_alerts:
            try:
                cursor.execute(f"ALTER TABLE alerts ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
                db_conn.commit()
            except Exception:
                db_conn.rollback()

        # 3. Table for Network Flow Logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS network_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source_ip VARCHAR(50),
                dest_ip VARCHAR(50),
                protocol VARCHAR(20),
                packet_length INT,
                label VARCHAR(50),
                prediction VARCHAR(100)
            );
        """)
        db_conn.commit()

        # 4. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100),
                username VARCHAR(50),
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.commit()

        # 5. Table for Incidents (Milestone-3 Step 2)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id SERIAL PRIMARY KEY,
                incident_id VARCHAR(50) UNIQUE NOT NULL,
                alert_id VARCHAR(50),
                prediction_id INT,
                attack_type VARCHAR(100),
                threat_severity VARCHAR(20),
                risk_score INT,
                confidence NUMERIC(5, 2),
                source_ip VARCHAR(50),
                dest_ip VARCHAR(50),
                protocol VARCHAR(20) DEFAULT 'TCP',
                detection_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(30) DEFAULT 'New',
                investigation_details TEXT,
                action_taken TEXT,
                resolution_details TEXT,
                resolution_timestamp TIMESTAMP,
                responsible_user VARCHAR(100) DEFAULT 'Security Analyst',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.commit()

        # 6. Table for Incident History / Audit Timeline (Milestone-3 Step 2)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incident_history (
                id SERIAL PRIMARY KEY,
                incident_id VARCHAR(50) NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                status VARCHAR(30),
                notes TEXT,
                performed_by VARCHAR(100) DEFAULT 'Security Analyst',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.commit()

        # 7. Table for Notifications (Milestone-3 Step 3)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                notification_id VARCHAR(50) UNIQUE NOT NULL,
                alert_id VARCHAR(50),
                incident_id VARCHAR(50),
                attack_type VARCHAR(100),
                severity VARCHAR(20),
                risk_score INT,
                confidence NUMERIC(5, 2),
                source_ip VARCHAR(50),
                dest_ip VARCHAR(50),
                message TEXT,
                status VARCHAR(20) DEFAULT 'Unread',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.commit()

        print("[OK] PostgreSQL tables and columns initialized/verified successfully!")
        return True
    except Exception as e:
        db_conn.rollback()
        print("[ERROR] Error initializing PostgreSQL tables:", e)
        traceback.print_exc()
        return False
    finally:
        cursor.close()

if __name__ == "__main__":
    init_db_tables()