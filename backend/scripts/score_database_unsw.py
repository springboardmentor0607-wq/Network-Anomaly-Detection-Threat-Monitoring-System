import os
import json
import asyncio
import pandas as pd
import numpy as np
import joblib
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Config
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "netshield_logs"
COLLECTION_NAME = "unsw_nb15_traffic"
MODEL_DIR = r"e:\NetShield\backend\app\models\unswnb15"
REPORTS_DIR = r"e:\NetShield\backend\reports\unswnb15"
BATCH_SIZE = 5000

async def score_database():
    logger.info("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    
    # Load Models
    logger.info("Loading ML Models for UNSW-NB15...")
    try:
        iso_forest = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.joblib"))
        xgb = joblib.load(os.path.join(MODEL_DIR, "xgboost_classifier.joblib"))
        scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))
        label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.joblib"))
        feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.joblib"))
        cat_encoders = joblib.load(os.path.join(MODEL_DIR, "cat_encoders.joblib"))
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        return

    logger.info("Fetching un-scored records in batches...")
    
    # To prevent bottlenecks, we process in chunks
    cursor = collection.find({"ml_threat_class": {"$exists": False}})
    
    batch = []
    total_processed = 0
    
    # Stats for Threat Analysis
    analysis_stats = {
        "total_predictions": 0,
        "attack_distribution": {},
        "risk_score_distribution": {"Low": 0, "Medium": 0, "High": 0, "Critical": 0},
        "anomalies_detected": 0
    }
    
    async for document in cursor:
        batch.append(document)
        if len(batch) >= BATCH_SIZE:
            await process_batch(batch, collection, iso_forest, xgb, scaler, label_encoder, cat_encoders, feature_names, analysis_stats)
            total_processed += len(batch)
            logger.info(f"Processed {total_processed} records...")
            batch = []
            
    # Process remaining
    if batch:
        await process_batch(batch, collection, iso_forest, xgb, scaler, label_encoder, cat_encoders, feature_names, analysis_stats)
        total_processed += len(batch)
        logger.info(f"Processed {total_processed} records (Final).")
        
    logger.info("Batch scoring complete. Generating Threat Analysis Report...")
    
    # Calculate top attack
    most_freq_attack = "None"
    if analysis_stats["attack_distribution"]:
        attacks_only = {k:v for k,v in analysis_stats["attack_distribution"].items() if k != "BENIGN"}
        if attacks_only:
            most_freq_attack = max(attacks_only, key=attacks_only.get)
            
    threat_analysis_report = {
        "total_predictions": analysis_stats["total_predictions"],
        "most_frequent_attack": most_freq_attack,
        "risk_score_distribution": analysis_stats["risk_score_distribution"],
        "attack_distribution": analysis_stats["attack_distribution"],
        "anomalies_detected": analysis_stats["anomalies_detected"],
        "system_status": "Secure" if analysis_stats["risk_score_distribution"]["Critical"] == 0 else "Under Attack"
    }
    
    os.makedirs(REPORTS_DIR, exist_ok=True)
    with open(os.path.join(REPORTS_DIR, "threat_analysis.json"), "w") as f:
        json.dump(threat_analysis_report, f, indent=4)
        
    logger.info("Threat Analysis Report saved successfully.")

async def process_batch(batch, collection, iso_forest, xgb, scaler, label_encoder, cat_encoders, feature_names, stats):
    # Convert batch to DataFrame
    df = pd.DataFrame(batch)
    
    # Ensure correct columns exist, handle missing
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0
            
    X = df[feature_names].copy()
    
    # Clean Data
    # Handle string columns with specific encoders
    str_cols = ['proto', 'state', 'service']
    for col in str_cols:
        if col in X.columns:
            X[col] = X[col].astype(str)
            # Handle unknown categories gracefully by mapping to 0 or known
            X[col] = X[col].map(lambda s: s if s in cat_encoders[col].classes_ else cat_encoders[col].classes_[0])
            X[col] = cat_encoders[col].transform(X[col])
    
    # Coerce rest to numeric
    for col in X.columns:
        if col not in str_cols:
            X[col] = pd.to_numeric(X[col], errors='coerce')
    
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    X.fillna(0, inplace=True)
    
    X_scaled = scaler.transform(X)
    
    # Anomaly Detection
    anomalies = iso_forest.predict(X_scaled)
    is_anomaly = [True if x == -1 else False for x in anomalies]
    
    # Threat Classification
    y_pred_encoded = xgb.predict(X_scaled)
    y_pred_proba = xgb.predict_proba(X_scaled)
    threat_classes = label_encoder.inverse_transform(y_pred_encoded)
    
    confidences = np.max(y_pred_proba, axis=1)
    
    updates = []
    
    for i, doc in enumerate(batch):
        t_class = threat_classes[i]
        conf = float(confidences[i])
        anomaly = bool(is_anomaly[i])
        
        # Risk Score Calculation
        risk_score = conf * 100
        if t_class != "BENIGN":
            risk_score = min(risk_score * 1.5, 99.9)
        if anomaly:
             risk_score = min(risk_score + 10, 99.9)
             
        risk_category = "Low"
        if risk_score > 90: risk_category = "Critical"
        elif risk_score > 70: risk_category = "High"
        elif risk_score > 40: risk_category = "Medium"
        
        # Update Stats
        stats["total_predictions"] += 1
        stats["attack_distribution"][t_class] = stats["attack_distribution"].get(t_class, 0) + 1
        stats["risk_score_distribution"][risk_category] += 1
        if anomaly: stats["anomalies_detected"] += 1
        
        update = UpdateOne(
            {"_id": doc["_id"]},
            {"$set": {
                "ml_threat_class": t_class,
                "ml_confidence": conf,
                "ml_risk_score": float(risk_score),
                "ml_risk_category": risk_category,
                "ml_is_anomaly": anomaly
            }}
        )
        updates.append(update)
        
    if updates:
        await collection.bulk_write(updates)

if __name__ == "__main__":
    asyncio.run(score_database())
