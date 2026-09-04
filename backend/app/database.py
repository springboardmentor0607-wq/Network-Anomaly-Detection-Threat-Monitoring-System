import os
from pymongo import MongoClient


# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)


# Database
db = client["NetShieldAI"]


# Collections
users_collection = db["users"]

alerts_collection = db["alerts"]
