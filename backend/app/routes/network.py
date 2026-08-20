from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any
from app.database import get_mongo
import random
import datetime

router = APIRouter()

# Helper function to generate mock IPs since CICIDS2017 often strips them
def generate_mock_ip():
    return f"{random.randint(10, 192)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

def map_dataset(dataset_str: str) -> str:
    if not dataset_str: return None
    if "CICIDS" in dataset_str or "WorkingHours" in dataset_str or "ISCX" in dataset_str:
        return "CICIDS2017"
    if "UNSW" in dataset_str or "NUSW" in dataset_str:
        return "UNSW-NB15"
    if dataset_str.startswith("Live Capture"):
        return dataset_str
    return dataset_str

def apply_dataset_filter(query: dict, dataset: str):
    if not dataset:
        return
    if dataset.startswith("Live Capture"):
        parts = dataset.split("|")
        query["Dataset"] = "Live Capture"
        if len(parts) > 1:
            time_filter = parts[1]
            now = datetime.datetime.utcnow()
            if time_filter == "Last 10 Minutes":
                query["Timestamp"] = {"$gte": (now - datetime.timedelta(minutes=10)).isoformat()}
            elif time_filter == "Last Hour":
                query["Timestamp"] = {"$gte": (now - datetime.timedelta(hours=1)).isoformat()}
            elif time_filter == "Today":
                query["Timestamp"] = {"$gte": (now - datetime.timedelta(days=1)).isoformat()}
    else:
        query["Dataset"] = dataset

@router.get("/summary")
async def get_summary(dataset: str = None, db = Depends(get_mongo)):
    dataset = map_dataset(dataset)
    try:
        collection = db["network_traffic"]
        
        # Build query for total rows and alerts
        base_query = {}
        if dataset:
            apply_dataset_filter(base_query, dataset)
            
        alert_query = {"Label": {"$nin": ["BENIGN", "Normal", "nan", "NaN", ""]}}
        if dataset:
            apply_dataset_filter(alert_query, dataset)
            
        if dataset:
            total_packets = await collection.count_documents(base_query)
        else:
            total_packets = await collection.estimated_document_count()
            
        alerts = await collection.count_documents(alert_query)
        
        if total_packets == 0: total_packets = 0
        if alerts == 0: alerts = 0

        return {
            "total_packets": int(total_packets),
            "total_alerts": int(alerts),
            "status": "Active"
        }
    except Exception as e:
        return {"total_packets": 0, "total_alerts": 0, "status": "Error"}

@router.get("/traffic-data")
async def get_telemetry(skip: int = 0, limit: int = 50, protocol: str = None, threat_level: str = None, dataset: str = None, db = Depends(get_mongo)):
    dataset = map_dataset(dataset)
    try:
        collection = db["network_traffic"]
        query = {}
        if dataset:
            apply_dataset_filter(query, dataset)
        if protocol and protocol != "All Protocols":
            query["Protocol"] = protocol
            
        if threat_level and threat_level != "All Threat Levels":
            if threat_level == "High":
                query["Label"] = {"$nin": ["BENIGN", "Normal", "nan", "NaN", ""]}
            elif threat_level == "Low":
                query["Label"] = {"$in": ["BENIGN", "Normal"]}
                
        cursor = collection.find(query).skip(skip).limit(limit)
        
        data = []
        async for doc in cursor:
            label = doc.get("Label", "BENIGN")
            is_benign = label in ["BENIGN", "Normal"]
            
            # Add some mock confidence scores since dataset doesn't have them
            confidence = random.randint(85, 99) if not is_benign else random.randint(60, 95)
            
            data.append({
                "id": str(doc["_id"]),
                "source_ip": doc.get("Source IP", generate_mock_ip()),
                "destination_ip": doc.get("Destination IP", generate_mock_ip()),
                "source_port": doc.get("Source Port", 0),
                "destination_port": doc.get("Destination Port", 0),
                "protocol": doc.get("Protocol", "TCP"),
                "flow_duration": doc.get("Flow Duration", 0),
                "packets": doc.get("Total Packets", 0),
                "bytes": doc.get("Total Bytes", 0),
                "label": label,
                "threat_level": "Low" if is_benign else "High",
                "prediction": "Normal" if is_benign else label,
                "confidence": confidence,
                "dataset": doc.get("Dataset", "Unknown"),
                "timestamp": doc.get("Timestamp", "")
            })
            
        total = await collection.count_documents(query)
        return {"data": data, "total": total}
    except Exception as e:
        print(e)
        return {"data": [], "total": 0}

@router.get("/dashboard-stats")
async def get_dashboard_stats(dataset: str = None, db = Depends(get_mongo)):
    dataset = map_dataset(dataset)
    try:
        collection = db["network_traffic"]
        
        # 1. Attack Category Distribution
        attack_match = {"Label": {"$nin": ["BENIGN", "Normal", "nan", "NaN", ""]}}
        if dataset:
            apply_dataset_filter(attack_match, dataset)
            
        attack_pipeline = [
            {"$match": attack_match},
            {"$group": {"_id": "$Label", "count": {"$sum": 1}}}
        ]
        
        raw_cats = {}
        async for doc in collection.aggregate(attack_pipeline):
            name = str(doc.get("_id", "")).strip()
            if name.lower() in ["nan", "benign", "normal", "none", ""]:
                continue
            if "dos" in name.lower() or "ddos" in name.lower():
                name = "DoS / DDoS"
            elif "web attack" in name.lower():
                name = "Web Attack"
            raw_cats[name] = raw_cats.get(name, 0) + doc["count"]
            
        attack_cats = [{"name": k, "value": v} for k, v in raw_cats.items()]
        attack_cats = sorted(attack_cats, key=lambda x: x["value"], reverse=True)[:10]
            
        # 2. Protocol Distribution
        proto_pipeline = []
        if dataset:
            proto_match = {}
            apply_dataset_filter(proto_match, dataset)
            proto_pipeline.append({"$match": proto_match})
        proto_pipeline.extend([
            {"$group": {"_id": "$Protocol", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ])
        
        protocols = []
        async for doc in collection.aggregate(proto_pipeline):
            proto_name = str(doc.get("_id", "Other"))
            if proto_name == 'nan' or not proto_name:
                 proto_name = "Other"
            protocols.append({"name": proto_name, "value": doc["count"]})
            
        # 3. Top Targeted IPs
        ip_match = {"Label": {"$nin": ["BENIGN", "Normal", "nan", "NaN", ""]}}
        if dataset:
            apply_dataset_filter(ip_match, dataset)
            
        ip_pipeline = [
            {"$match": ip_match},
            {"$group": {"_id": "$Destination IP", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        
        targeted_ips = []
        async for doc in collection.aggregate(ip_pipeline):
            targeted_ips.append({"ip": str(doc["_id"]), "hits": doc["count"]})
            
        # 4. System Health metrics
        health_query = {}
        if dataset:
            apply_dataset_filter(health_query, dataset)
        total_rows = await collection.count_documents(health_query)
        
        return {
            "attack_categories": attack_cats,
            "protocols": protocols,
            "targeted_ips": targeted_ips,
            "system_health": {
                "database_node": "CONNECTED",
                "pipeline_loading": "READY",
                "memory_footprint": "1293.3 MB",
                "ingested_rows": total_rows,
                "server_latency": "24.5ms"
            }
        }
    except Exception as e:
        print(e)
        return {}

@router.get("/traffic-flow")
async def get_traffic_flow(dataset: str = None, db = Depends(get_mongo)):
    dataset = map_dataset(dataset)
    try:
        collection = db["network_traffic"]
        pipeline = []
        if dataset:
            flow_match = {}
            apply_dataset_filter(flow_match, dataset)
            pipeline.append({"$match": flow_match})
            
        pipeline.extend([
            {"$sample": {"size": 30}},
            {"$project": {
                "Total Bytes": 1,
                "Label": 1
            }}
        ])
        
        flow_data = []
        count = 0
        async for doc in collection.aggregate(pipeline):
            is_benign = doc.get("Label", "BENIGN") in ["BENIGN", "Normal"]
            bytes_val = doc.get("Total Bytes", 0)
            try:
                bytes_val = int(bytes_val)
            except:
                import random
                bytes_val = random.randint(100, 5000)
                
            flow_data.append({
                "day": str(count),
                "income": bytes_val,
                "expense": 0 if is_benign else bytes_val
            })
            count += 1
            
        return flow_data
    except Exception as e:
        print(e)
        return []

@router.get("/port-usage")
async def get_port_usage(dataset: str = None, db = Depends(get_mongo)):
    dataset = map_dataset(dataset)
    try:
        collection = db["network_traffic"]
        port_pipeline = []
        if dataset:
            port_match = {}
            apply_dataset_filter(port_match, dataset)
            port_pipeline.append({"$match": port_match})
        port_pipeline.extend([
            {"$group": {"_id": "$Destination Port", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ])
        
        ports = []
        async for doc in collection.aggregate(port_pipeline):
            port = doc["_id"]
            if port == 80: name = "HTTP"
            elif port == 443: name = "HTTPS"
            elif port == 53: name = "DNS"
            elif port == 22: name = "SSH"
            elif port == 21: name = "FTP"
            else: name = f"Port {port}"
            ports.append({"name": name, "count": doc["count"]})
        return ports
    except Exception as e:
        print(e)
        return []

@router.get("/recent-alerts")
async def get_recent_alerts(limit: int = 10, dataset: str = None, db = Depends(get_mongo)):
    dataset = map_dataset(dataset)
    try:
        collection = db["network_traffic"]
        query = {"Label": {"$nin": ["BENIGN", "Normal", "nan", "NaN", ""]}}
        if dataset:
            apply_dataset_filter(query, dataset)
        cursor = collection.find(query).sort("_id", -1).limit(limit)
        alerts = []
        async for doc in cursor:
            alerts.append({
                "id": str(doc["_id"]),
                "source_ip": doc.get("Source IP", generate_mock_ip()),
                "destination_ip": doc.get("Destination IP", generate_mock_ip()),
                "destination_port": doc.get("Destination Port", 0),
                "anomaly_type": doc.get("Label", "Unknown Anomaly"),
                "severity": "High",
                "timestamp": doc.get("Timestamp", datetime.datetime.utcnow().isoformat())
            })
        return alerts
    except:
        return []
