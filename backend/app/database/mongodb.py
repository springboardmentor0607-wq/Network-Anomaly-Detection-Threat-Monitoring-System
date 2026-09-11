from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))

db = client[os.getenv("DATABASE_NAME")]

users_collection = db["users"]

predictions_collection = db["predictions"]

audit_collection = db["audit_logs"]

incidents_collection = db["incidents"]
alerts_collection = db["alerts"]
pcap_analysis_collection = db["pcap_analysis"]