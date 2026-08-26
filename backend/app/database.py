from pymongo import MongoClient


# MongoDB Connection
client = MongoClient("mongodb://localhost:27017")


# Database
db = client["NetShieldAI"]


# Collections
users_collection = db["users"]

alerts_collection = db["alerts"]