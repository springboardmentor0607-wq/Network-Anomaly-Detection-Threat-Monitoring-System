import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(MONGO_URL)
mongo_db = client["netshield_ai"]  # database name — will be created on first write

# Core Collections
packet_logs = mongo_db["packet_logs"]
incident_logs = mongo_db["incident_logs"]  # --- NEW: Dedicated threats collection ---

def log_packet_to_db(packet_data: dict):
    """
    Schema for saving raw packets.
    """
    log_entry = {
        "timestamp": datetime.utcnow(),
        "packet_features": packet_data,
        "analyzed": False,  
        "threat_flag": "pending"
    }
    try:
        packet_logs.insert_one(log_entry)
    except Exception as e:
        print(f"MongoDB Insert Error: {e}")


# ==========================================
# --- NEW: INCIDENT PERSISTENCE LOGGING ---
# ==========================================

def log_anomaly_to_db(threat_data: dict):
    """Saves a detected threat to the database permanently."""
    log_entry = {
        "timestamp": datetime.utcnow(), # For strict backend sorting
        "time_formatted": threat_data.get("time", datetime.now().strftime("%I:%M:%S %p")),
        "source": threat_data.get("source", "Live Stream / AI"),
        "type": threat_data.get("type", "Unknown Threat"),
        "description": threat_data.get("description", "Anomalous signature detected."),
        "severity": threat_data.get("severity", "Critical"),
        "confidence": threat_data.get("confidence", "0.0%")
    }
    try:
        result = incident_logs.insert_one(log_entry)
        
        # Format for React frontend
        log_entry["id"] = str(result.inserted_id)
        del log_entry["_id"] # Remove raw ObjectId (FastAPI can't JSON-serialize it)
        log_entry["time"] = log_entry.pop("time_formatted")
        return log_entry
    except Exception as e:
        print(f"MongoDB Incident Insert Error: {e}")
        return None

def get_recent_anomalies(limit: int = 50):
    """Fetches the latest threats so React doesn't lose them on refresh."""
    try:
        # Sort by newest first
        cursor = incident_logs.find().sort("timestamp", -1).limit(limit)
        anomalies = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            if "timestamp" in doc:
                del doc["timestamp"] # Exclude raw datetime from JSON response
            
            # Map keys to match React frontend state
            doc["time"] = doc.pop("time_formatted", "Unknown Time")
            anomalies.append(doc)
        return anomalies
    except Exception as e:
        print(f"MongoDB Fetch Error: {e}")
        return []