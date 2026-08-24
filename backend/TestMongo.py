from mongodb import mongo_db

# Insert a test document into a "logs" collection
result = mongo_db.logs.insert_one({"event": "connection_test", "status": "ok"})
print(f"Inserted test document with id: {result.inserted_id}")

# Read it back
doc = mongo_db.logs.find_one({"_id": result.inserted_id})
print(f"Retrieved document: {doc}")