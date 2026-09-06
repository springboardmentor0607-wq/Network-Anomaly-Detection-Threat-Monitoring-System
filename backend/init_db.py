import os
import sys
import mysql.connector

def run_sql_file(cursor, filepath):
    print(f"Executing SQL file: {os.path.basename(filepath)}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    statements = [stmt.strip() for stmt in content.split(';') if stmt.strip()]
    for statement in statements:
        if statement:
            cursor.execute(statement)

def init_database():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schema_path = os.path.join(base_dir, 'database', 'schema.sql')
    seed_path = os.path.join(base_dir, 'database', 'seed.sql')
    env_path = os.path.join(base_dir, 'backend', '.env')

    user = "root"
    port = 3306

    passwords_to_try = ["nandini$123", "", "password", "root", "123456", "mysql", "admin", "Password@123"]
    if len(sys.argv) > 1 and sys.argv[1]:
        passwords_to_try.insert(0, sys.argv[1])

    connection = None
    working_password = None
    working_host = "127.0.0.1"

    print("\n--- NetShield AI Database Initializer ---")
    
    for pwd in passwords_to_try:
        for host in ["127.0.0.1", "localhost"]:
            try:
                print(f"Testing MySQL connection to {host} with user '{user}'...")
                conn = mysql.connector.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=pwd,
                    connect_timeout=5,
                    use_pure=True
                )
                if conn.is_connected():
                    connection = conn
                    working_password = pwd
                    working_host = host
                    print(f"\n[SUCCESS] Connected to MySQL on {host} with password: '{pwd}'")
                    break
            except Exception as e:
                print(f"  Connection attempt failed for host={host}, password='{pwd}': {str(e)}")
                continue
        if connection:
            break

    if not connection:
        print("\n[ERROR] Could not connect to MySQL using provided passwords.")
        return False

    cursor = connection.cursor()

    try:
        run_sql_file(cursor, schema_path)
        connection.commit()
        
        run_sql_file(cursor, seed_path)
        connection.commit()
        
        print("\n[SUCCESS] Database 'netshield_ai' created and seeded successfully!")
        
        # Update backend/.env file with the working password
        env_content = f"""DB_HOST={working_host}
DB_PORT={port}
DB_USER={user}
DB_PASSWORD={working_password}
DB_NAME=netshield_ai
JWT_SECRET=netshield_super_secret_jwt_key_2026_safe
PORT=5000
"""
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print(f"[SUCCESS] Updated backend/.env with DB_HOST={working_host} and DB_PASSWORD={working_password}")
        
        return True

    except Exception as e:
        print(f"\n[ERROR] Failed during database setup: {str(e)}")
        return False
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    init_database()
