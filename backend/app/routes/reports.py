from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, Response
from app.database import get_mongo
import datetime

router = APIRouter()

@router.get("/list")
async def get_reports():
    # Keep the list of available reports dynamic based on time
    return [
        {
            "id": "rep-001",
            "name": "Milestone 2 Final Report",
            "type": "Executive Summary",
            "date": "Oct 24, 2023 - 09:00 AM",
            "size": "2.4 MB"
        },
        {
            "id": "rep-002",
            "name": "Network Baseline Audit",
            "type": "Anomaly Analysis",
            "date": "Oct 23, 2023 - 18:30 PM",
            "size": "1.1 MB"
        },
        {
            "id": "rep-003",
            "name": "Intrusion Prediction Model Eval",
            "type": "ML Model Metrics",
            "date": "Oct 22, 2023 - 11:15 AM",
            "size": "5.8 MB"
        },
        {
            "id": f"rep-{int(datetime.datetime.utcnow().timestamp())}",
            "name": "Real-time Threat Intelligence",
            "type": "Live Analysis",
            "date": datetime.datetime.utcnow().strftime("%b %d, %Y - %H:%M %p"),
            "size": "0.5 MB"
        }
    ]

@router.get("/download/{report_id}")
async def download_report(report_id: str, db = Depends(get_mongo)):
    collection = db["network_traffic"]
    
    # Run real aggregations
    attack_query = {"Label": {"$nin": ["BENIGN", "Normal", "nan", "NaN", ""]}}
    total_anomalies = await collection.count_documents(attack_query)
    
    # Average Risk Score
    risk_pipeline = [
        {"$match": attack_query},
        {"$group": {"_id": None, "avg_risk": {"$avg": "$ml_risk_score"}}}
    ]
    avg_risk = 0
    async for doc in collection.aggregate(risk_pipeline):
        avg_risk = doc.get("avg_risk", 0)
        break
        
    # Most Targeted IP
    ip_pipeline = [
        {"$match": attack_query},
        {"$group": {"_id": "$Destination IP", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    targeted_ip = "N/A"
    async for doc in collection.aggregate(ip_pipeline):
        targeted_ip = str(doc.get("_id", "N/A"))
        break
        
    # Dominant Protocol
    proto_pipeline = [
        {"$match": attack_query},
        {"$group": {"_id": "$Protocol", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    dominant_proto = "N/A"
    async for doc in collection.aggregate(proto_pipeline):
        dominant_proto = str(doc.get("_id", "N/A"))
        break

    risk_label = "Critical" if avg_risk > 90 else ("High" if avg_risk > 70 else "Medium")

    content = f"Threat Intelligence Report - {report_id}\n\n"
    content += "Generated on: " + datetime.datetime.utcnow().isoformat() + "\n\n"
    content += "Summary:\n"
    content += f"- Overall Risk Score: {avg_risk:.1f} ({risk_label})\n"
    content += f"- Total Anomalies Detected: {total_anomalies}\n"
    content += f"- Most Targeted IP: {targeted_ip}\n"
    content += f"- Dominant Protocol: {dominant_proto}\n\n"
    content += "Action Required: Investigate endpoints exhibiting high volume of DoS patterns.\n"
    
    headers = {
        'Content-Disposition': f'attachment; filename="report_{report_id}.txt"'
    }
    
    return Response(content=content, media_type="text/plain", headers=headers)
