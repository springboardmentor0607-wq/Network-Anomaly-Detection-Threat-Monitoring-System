import sys
sys.path.append('backend')
from database import execute_query, fetch_all

def clean_database_records():
    # 1. Update security_alerts
    execute_query("""
        UPDATE security_alerts 
        SET title = REPLACE(title, 'Automated Security Alert: ', '')
        WHERE title LIKE 'Automated Security Alert:%'
    """)

    # 2. Update incidents titles
    execute_query("""
        UPDATE incidents 
        SET title = REPLACE(title, 'CRITICAL INCIDENT: ', '')
        WHERE title LIKE 'CRITICAL INCIDENT:%'
    """)

    # 3. Update incidents descriptions to clean target format
    execute_query("""
        UPDATE incidents 
        SET description = SUBSTRING(description, LOCATE('Target system:', description))
        WHERE description LIKE '%Target system:%' AND description LIKE 'Critical priority security incident automatically dispatched%'
    """)

    print(">>> SUCCESS: MySQL security_alerts and incidents cleaned up! <<<")
    
    alerts = fetch_all("SELECT id, title, description FROM security_alerts LIMIT 5")
    print("\nSAMPLE ALERTS:")
    for a in alerts:
        print(f"ID #{a['id']}: {a['title']} -> {a['description']}")

    incidents = fetch_all("SELECT id, title, description FROM incidents LIMIT 5")
    print("\nSAMPLE INCIDENTS:")
    for inc in incidents:
        print(f"ID #{inc['id']}: {inc['title']} -> {inc['description']}")

if __name__ == '__main__':
    clean_database_records()
