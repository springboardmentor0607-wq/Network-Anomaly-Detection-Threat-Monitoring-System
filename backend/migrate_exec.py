import mysql.connector
import psycopg2
from psycopg2 import extras

mysql_conn = mysql.connector.connect(
    host='database',
    port=3306,
    user='root',
    password='nandini$123',
    database='netshield_ai'
)
mysql_cur = mysql_conn.cursor()

pg_conn = psycopg2.connect(
    host='netshield-postgres',
    port=5432,
    user='postgres',
    password='postgrespassword',
    dbname='netshield_ai'
)

tables = [
    'users',
    'audit_logs',
    'datasets',
    'predictions',
    'threats',
    'security_alerts',
    'incidents',
    'notifications',
    'reports',
    'threat_intelligence',
    'network_traffic',
    'network_logs'
]

boolean_cols = {'has_ground_truth', 'is_read'}

total = 0
for t in tables:
    mysql_cur.execute(f'SELECT * FROM {t}')
    rows = mysql_cur.fetchall()
    if not rows:
        print(f'{t}: 0 rows')
        continue
    cols = [d[0] for d in mysql_cur.description]
    col_str = ', '.join([f'"{c}"' for c in cols])
    ph_str = ', '.join(['%s' for _ in cols])
    sql = f'INSERT INTO {t} ({col_str}) VALUES ({ph_str}) ON CONFLICT (id) DO NOTHING'
    
    clean_rows = []
    for r in rows:
        clean_r = []
        for cname, v in zip(cols, r):
            if cname in boolean_cols and v is not None:
                v = bool(v)
            elif isinstance(v, bytearray):
                v = bytes(v).decode('utf-8', errors='ignore')
            clean_r.append(v)
        clean_rows.append(tuple(clean_r))
        
    with pg_conn.cursor() as pg_cur:
        extras.execute_batch(pg_cur, sql, clean_rows, page_size=500)
        if 'id' in cols:
            pg_cur.execute(f"SELECT setval(pg_get_serial_sequence('{t}', 'id'), coalesce(max(id), 1)) FROM {t};")
    pg_conn.commit()
    print(f'{t}: Successfully migrated {len(rows)} rows')
    total += len(rows)

print(f'MIGRATION COMPLETED! Total records in PostgreSQL: {total}')
mysql_cur.close()
mysql_conn.close()
pg_conn.close()
