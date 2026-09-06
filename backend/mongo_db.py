import logging
from datetime import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from config import Config

logger = logging.getLogger(__name__)

mongo_client = None
mongo_db = None
_mongo_checked = False

def init_mongo():
    global mongo_client, mongo_db, _mongo_checked
    if _mongo_checked and mongo_db is not None:
        return True
    try:
        mongo_client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=500)
        mongo_db = mongo_client[Config.MONGO_DB_NAME]
        
        # Test connection
        mongo_client.admin.command('ping')
        logger.info(f"MongoDB connection initialized successfully to {Config.MONGO_DB_NAME}.")
        _mongo_checked = True
        
        # Create indexes for optimal query performance
        mongo_db.network_security_events.create_index([("timestamp", DESCENDING)])
        mongo_db.network_security_events.create_index([("predicted_label", ASCENDING)])
        mongo_db.network_security_events.create_index([("source_ip", ASCENDING)])
        mongo_db.detailed_threat_events.create_index([("detected_at", DESCENDING)])
        mongo_db.threat_intelligence_docs.create_index([("ip_address", ASCENDING)], unique=True)
        mongo_db.zeek_events.create_index([("ts", DESCENDING)])
        mongo_db.security_audit_events.create_index([("timestamp", DESCENDING)])
        
        return True
    except Exception as e:
        logger.warning(f"MongoDB connection note: {str(e)} (Running with fallback mode if MongoDB service is starting)")
        mongo_client = None
        mongo_db = None
        _mongo_checked = True
        return False

def get_mongo_db():
    global mongo_db, _mongo_checked
    if mongo_db is None and not _mongo_checked:
        init_mongo()
    return mongo_db

def check_mongo_connection():
    global mongo_db
    if mongo_db is None:
        return False
    try:
        mongo_client.admin.command('ping')
        return True
    except Exception:
        return False

def insert_security_event(event_dict):
    db = get_mongo_db()
    if db is not None:
        try:
            if 'timestamp' not in event_dict:
                event_dict['timestamp'] = datetime.utcnow()
            res = db.network_security_events.insert_one(event_dict)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f'Error inserting security event into MongoDB: {str(e)}')
    return None

def insert_detailed_threat_event(threat_dict):
    db = get_mongo_db()
    if db is not None:
        try:
            if 'detected_at' not in threat_dict:
                threat_dict['detected_at'] = datetime.utcnow()
            res = db.detailed_threat_events.insert_one(threat_dict)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f'Error inserting detailed threat event into MongoDB: {str(e)}')
    return None

def insert_zeek_event(zeek_dict):
    db = get_mongo_db()
    if db is not None:
        try:
            if 'imported_at' not in zeek_dict:
                zeek_dict['imported_at'] = datetime.utcnow()
            res = db.zeek_events.insert_one(zeek_dict)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f'Error inserting Zeek event into MongoDB: {str(e)}')
    return None

def cache_threat_intel_doc(ip_address, intel_data):
    db = get_mongo_db()
    if db is not None:
        try:
            intel_data['ip_address'] = ip_address
            intel_data['updated_at'] = datetime.utcnow()
            db.threat_intelligence_docs.update_one(
                {'ip_address': ip_address},
                {'': intel_data},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f'Error caching threat intelligence doc in MongoDB: {str(e)}')
    return False

def get_cached_threat_intel(ip_address):
    db = get_mongo_db()
    if db is not None:
        try:
            doc = db.threat_intelligence_docs.find_one({'ip_address': ip_address}, {'_id': 0})
            return doc
        except Exception as e:
            logger.error(f'Error querying cached threat intel from MongoDB: {str(e)}')
    return None

def log_mongo_audit_event(user_id, action, module, ip_address='127.0.0.1', details=None):
    db = get_mongo_db()
    if db is not None:
        try:
            doc = {
                'user_id': user_id,
                'action': action,
                'module': module,
                'ip_address': ip_address,
                'details': details or {},
                'timestamp': datetime.utcnow()
            }
            db.security_audit_events.insert_one(doc)
            return True
        except Exception as e:
            logger.error(f'Error logging audit event to MongoDB: {str(e)}')
    return False

def get_recent_security_events(limit=50, query_filter=None):
    db = get_mongo_db()
    if db is not None:
        try:
            cursor = db.network_security_events.find(query_filter or {}, {'_id': 0}).sort('timestamp', -1).limit(limit)
            return list(cursor)
        except Exception as e:
            logger.error(f'Error fetching recent security events from MongoDB: {str(e)}')
    return []
