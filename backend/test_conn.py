import mysql.connector

try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="nandini$123",
        database="netshield_ai",
        use_pure=True
    )
    print("SUCCESS: Connected with use_pure=True!")
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    print("Tables:", cursor.fetchall())
    conn.close()
except Exception as e:
    print("ERROR with pure:", e)
