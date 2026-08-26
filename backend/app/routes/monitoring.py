from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
import random
import os

from bson import ObjectId

from app.database import alerts_collection
from app.ai.report_generator import generate_pdf_report


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/monitoring",
    tags=["Live Monitoring"]
)


# ============================================================
# GENERATE SIMULATED NETWORK TRAFFIC
# ============================================================

def generate_network_traffic():

    traffic_types = [
        "Normal Traffic",
        "Normal Traffic",
        "Normal Traffic",
        "DDoS Attack",
        "Port Scan",
        "Brute Force Attack",
        "Malware Traffic"
    ]

    threat_type = random.choice(traffic_types)

    packet_size = random.randint(200, 10000)

    duration = random.randint(1, 100)

    connection_count = random.randint(1, 100)

    # --------------------------------------------------------
    # CLASSIFY TRAFFIC
    # --------------------------------------------------------

    if threat_type == "Normal Traffic":

        severity = "Low"

        risk_score = random.randint(0, 30)

        confidence = random.randint(70, 99)

        status = "Normal"

    elif threat_type == "DDoS Attack":

        severity = "Critical"

        risk_score = random.randint(85, 100)

        confidence = random.randint(90, 99)

        status = "Threat Detected"

    elif threat_type == "Port Scan":

        severity = "High"

        risk_score = random.randint(60, 85)

        confidence = random.randint(80, 98)

        status = "Threat Detected"

    elif threat_type == "Brute Force Attack":

        severity = "High"

        risk_score = random.randint(60, 90)

        confidence = random.randint(80, 98)

        status = "Threat Detected"

    else:

        severity = "Critical"

        risk_score = random.randint(80, 100)

        confidence = random.randint(85, 99)

        status = "Threat Detected"

    # --------------------------------------------------------
    # NETWORK INFORMATION
    # --------------------------------------------------------

    source_port = random.randint(
        1024,
        65535
    )

    destination_port = random.choice(
        [
            80,
            443,
            21,
            22,
            25,
            53,
            3389
        ]
    )

    protocol_type = random.choice(
        [
            "tcp",
            "udp",
            "icmp"
        ]
    )

    service = random.choice(
        [
            "http",
            "https",
            "ssh",
            "ftp",
            "dns",
            "smtp"
        ]
    )

    flag = random.choice(
        [
            "SF",
            "S0",
            "REJ",
            "RSTO"
        ]
    )

    # --------------------------------------------------------
    # RETURN EVENT
    # --------------------------------------------------------

    return {

        "packet_size": packet_size,

        "duration": duration,

        "connection_count": connection_count,

        "source_port": source_port,

        "destination_port": destination_port,

        "protocol_type": protocol_type,

        "service": service,

        "flag": flag,

        "threat_type": threat_type,

        "severity": severity,

        "confidence": f"{confidence}%",

        "confidence_value": confidence,

        "risk_score": risk_score,

        "status": status,

        "workflow_status": "New",

        "timestamp": datetime.utcnow(),

        "source": "Live Network Monitor"
    }


# ============================================================
# MANUAL TRAFFIC GENERATION
# ============================================================

@router.post("/generate")
def generate_alert():

    traffic = generate_network_traffic()

    result = alerts_collection.insert_one(
        traffic
    )

    traffic["_id"] = str(
        result.inserted_id
    )

    return {

        "message":
            "Network traffic generated successfully",

        "alert_id":
            str(result.inserted_id),

        "traffic":
            traffic
    }


# ============================================================
# GET LIVE ALERTS
# ============================================================

@router.get("/live-alerts")
def get_live_alerts():

    alerts = list(
        alerts_collection
        .find()
        .sort("_id", -1)
        .limit(20)
    )

    formatted_alerts = []

    for alert in alerts:

        formatted_alerts.append({

            "_id":
                str(alert["_id"]),

            "packet_size":
                alert.get("packet_size", 0),

            "duration":
                alert.get("duration", 0),

            "connection_count":
                alert.get("connection_count", 0),

            "source_port":
                alert.get("source_port", 0),

            "destination_port":
                alert.get("destination_port", 0),

            "protocol_type":
                alert.get("protocol_type", "Unknown"),

            "service":
                alert.get("service", "Unknown"),

            "flag":
                alert.get("flag", "Unknown"),

            "threat_type":
                alert.get("threat_type", "Unknown"),

            "severity":
                alert.get("severity", "Low"),

            "confidence":
                alert.get("confidence", "0%"),

            "confidence_value":
                alert.get("confidence_value", 0),

            "risk_score":
                alert.get("risk_score", 0),

            "status":
                alert.get("status", "Unknown"),

            "workflow_status":
                alert.get("workflow_status", "New"),

            "timestamp":
                (
                    alert["timestamp"].isoformat()
                    if alert.get("timestamp")
                    else None
                ),

            "source":
                alert.get(
                    "source",
                    "Live Network Monitor"
                )
        })

    return {

        "count":
            len(formatted_alerts),

        "alerts":
            formatted_alerts
    }


# ============================================================
# MONITORING STATUS
# ============================================================

@router.get("/status")
def monitoring_status():

    total_alerts = (
        alerts_collection.count_documents({})
    )

    active_threats = (
        alerts_collection.count_documents({
            "status": "Threat Detected"
        })
    )

    critical_threats = (
        alerts_collection.count_documents({
            "severity": "Critical"
        })
    )

    # --------------------------------------------------------
    # RECENT ALERTS
    # --------------------------------------------------------

    recent_alerts = list(
        alerts_collection
        .find()
        .sort("_id", -1)
        .limit(20)
    )

    incoming_packets = 0

    outgoing_packets = 0

    suspicious_connections = 0

    total_packet_size = 0

    for alert in recent_alerts:

        packet_size = int(
            alert.get(
                "packet_size",
                0
            ) or 0
        )

        connection_count = int(
            alert.get(
                "connection_count",
                0
            ) or 0
        )

        total_packet_size += packet_size

        if alert.get("status") == "Threat Detected":

            suspicious_connections += connection_count

            incoming_packets += packet_size

        else:

            outgoing_packets += packet_size

    # --------------------------------------------------------
    # BANDWIDTH
    # --------------------------------------------------------

    bandwidth_usage = min(
        round(
            total_packet_size /
            100000 *
            100
        ),
        100
    )

    return {

        "monitoring":
            "ACTIVE",

        "total_alerts":
            total_alerts,

        "active_threats":
            active_threats,

        "critical_threats":
            critical_threats,

        "incoming_packets":
            incoming_packets,

        "outgoing_packets":
            outgoing_packets,

        "suspicious_connections":
            suspicious_connections,

        "bandwidth_usage":
            bandwidth_usage,

        "timestamp":
            datetime.utcnow().isoformat()
    }


# ============================================================
# THREAT INVESTIGATION
# ============================================================

@router.get("/investigate/{alert_id}")
def investigate_alert(alert_id: str):

    # --------------------------------------------------------
    # VALIDATE ID
    # --------------------------------------------------------

    try:

        object_id = ObjectId(
            alert_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    # --------------------------------------------------------
    # FIND ALERT
    # --------------------------------------------------------

    alert = alerts_collection.find_one({
        "_id": object_id
    })

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    # --------------------------------------------------------
    # INVESTIGATION PRIORITY
    # --------------------------------------------------------

    severity = alert.get(
        "severity",
        "Unknown"
    )

    status = alert.get(
        "status",
        "Unknown"
    )

    if severity == "Critical":

        priority = "Immediate"

        recommendation = (
            "Immediately investigate and "
            "isolate affected traffic."
        )

    elif severity == "High":

        priority = "High"

        recommendation = (
            "Investigate suspicious network "
            "activity and review affected connections."
        )

    elif status == "Threat Detected":

        priority = "Medium"

        recommendation = (
            "Review the network event and "
            "monitor for additional suspicious activity."
        )

    else:

        priority = "Normal"

        recommendation = (
            "No immediate action required."
        )

    # --------------------------------------------------------
    # RETURN INVESTIGATION
    # --------------------------------------------------------

    return {

        "_id":
            str(alert["_id"]),

        "threat_type":
            alert.get(
                "threat_type",
                "Unknown"
            ),

        "severity":
            severity,

        "confidence":
            alert.get(
                "confidence",
                "0%"
            ),

        "confidence_value":
            alert.get(
                "confidence_value",
                0
            ),

        "risk_score":
            alert.get(
                "risk_score",
                0
            ),

        "status":
            status,

        "workflow_status":
            alert.get(
                "workflow_status",
                "New"
            ),

        "packet_size":
            alert.get(
                "packet_size",
                0
            ),

        "duration":
            alert.get(
                "duration",
                0
            ),

        "connection_count":
            alert.get(
                "connection_count",
                0
            ),

        "source_port":
            alert.get(
                "source_port",
                "Unknown"
            ),

        "destination_port":
            alert.get(
                "destination_port",
                "Unknown"
            ),

        "protocol_type":
            alert.get(
                "protocol_type",
                "Unknown"
            ),

        "service":
            alert.get(
                "service",
                "Unknown"
            ),

        "flag":
            alert.get(
                "flag",
                "Unknown"
            ),

        "timestamp":
            (
                alert["timestamp"].isoformat()
                if alert.get("timestamp")
                else None
            ),

        "source":
            alert.get(
                "source",
                "Live Network Monitor"
            ),

        "investigation": {

            "priority":
                priority,

            "recommendation":
                recommendation
        }
    }


# ============================================================
# GENERATE SECURITY INCIDENT PDF REPORT
# ============================================================

@router.get("/report/{alert_id}")
def generate_security_report(alert_id: str):

    # --------------------------------------------------------
    # VALIDATE MONGODB ID
    # --------------------------------------------------------

    try:

        object_id = ObjectId(
            alert_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    # --------------------------------------------------------
    # FIND ALERT
    # --------------------------------------------------------

    alert = alerts_collection.find_one({
        "_id": object_id
    })

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    # --------------------------------------------------------
    # INVESTIGATION INFORMATION
    # --------------------------------------------------------

    severity = alert.get(
        "severity",
        "Unknown"
    )

    status = alert.get(
        "status",
        "Unknown"
    )

    if severity == "Critical":

        priority = "Immediate"

        recommendation = (
            "Immediately investigate and "
            "isolate affected traffic."
        )

    elif severity == "High":

        priority = "High"

        recommendation = (
            "Investigate suspicious network "
            "activity and review affected connections."
        )

    elif status == "Threat Detected":

        priority = "Medium"

        recommendation = (
            "Review the network event and "
            "monitor for additional suspicious activity."
        )

    else:

        priority = "Normal"

        recommendation = (
            "No immediate action required."
        )

    alert["investigation"] = {

        "priority":
            priority,

        "recommendation":
            recommendation
    }

    # --------------------------------------------------------
    # GENERATE PDF
    # --------------------------------------------------------

    try:

        file_path = generate_pdf_report(
            alert
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(e)}"
        )

    # --------------------------------------------------------
    # CHECK FILE
    # --------------------------------------------------------

    if not file_path or not os.path.exists(
        file_path
    ):

        raise HTTPException(
            status_code=500,
            detail="PDF file was not created"
        )

    # --------------------------------------------------------
    # RETURN PDF
    # --------------------------------------------------------

    return FileResponse(

        path=file_path,

        media_type="application/pdf",

        filename=(
            f"NetShield_Report_{alert_id}.pdf"
        )
    )