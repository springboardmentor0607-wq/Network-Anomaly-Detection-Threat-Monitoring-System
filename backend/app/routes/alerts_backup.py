from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
from datetime import datetime
from bson import ObjectId

from app.ai.classifier import classify_attack
from app.ai.risk_score import calculate_risk
from app.database import db


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


# ============================================================
# DATABASE
# ============================================================

alerts_collection = db["alerts"]


# ============================================================
# LIVE NETWORK STATUS
# ============================================================

network_status = {
    "incoming_packets": 2340,
    "outgoing_packets": 1920,
    "suspicious_connections": 0,
    "bandwidth_usage": 45
}


# ============================================================
# LOAD MODEL AND SCALER
# ============================================================

model = joblib.load("app/ai/model.pkl")
scaler = joblib.load("app/ai/scaler.pkl")


# ============================================================
# NSL-KDD FEATURES
# ============================================================

features = [
    "duration",
    "protocol_type",
    "service",
    "flag",
    "src_bytes",
    "dst_bytes",
    "land",
    "wrong_fragment",
    "urgent",
    "hot",
    "num_failed_logins",
    "logged_in",
    "num_compromised",
    "root_shell",
    "su_attempted",
    "num_root",
    "num_file_creations",
    "num_shells",
    "num_access_files",
    "num_outbound_cmds",
    "is_host_login",
    "is_guest_login",
    "count",
    "srv_count",
    "serror_rate",
    "srv_serror_rate",
    "rerror_rate",
    "srv_rerror_rate",
    "same_srv_rate",
    "diff_srv_rate",
    "srv_diff_host_rate",
    "dst_host_count",
    "dst_host_srv_count",
    "dst_host_same_srv_rate",
    "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate",
    "dst_host_srv_serror_rate",
    "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate"
]


# ============================================================
# REQUEST MODEL
# ============================================================

class NetworkPacket(BaseModel):

    duration: int = 0
    protocol_type: int = 0
    service: int = 0
    flag: int = 0

    src_bytes: int = 0
    dst_bytes: int = 0

    count: int = 0
    srv_count: int = 0

    serror_rate: float = 0
    srv_serror_rate: float = 0

    rerror_rate: float = 0
    srv_rerror_rate: float = 0

    same_srv_rate: float = 0
    diff_srv_rate: float = 0


# ============================================================
# HELPER — FORMAT MONGODB ALERT
# ============================================================

def format_alert(alert):

    return {
        "id": str(alert.get("_id")),

        "timestamp": (
            alert.get("timestamp").isoformat()
            if isinstance(alert.get("timestamp"), datetime)
            else alert.get("timestamp")
        ),

        "status": alert.get(
            "status",
            "Unknown"
        ),

        "workflow_status": alert.get(
            "workflow_status",
            "New"
        ),

        "prediction": alert.get(
            "prediction",
            "Unknown"
        ),

        "threat_type": alert.get(
            "threat_type",
            "Unknown"
        ),

        "severity": alert.get(
            "severity",
            "Low"
        ),

        "confidence": alert.get(
            "confidence",
            "0%"
        ),

        "risk_score": alert.get(
            "risk_score",
            0
        ),

        "risk_level": alert.get(
            "risk_level",
            alert.get(
                "severity",
                "Low"
            )
        ),

        "source": alert.get(
            "source",
            "Alert Detection"
        )
    }


# ============================================================
# DETECT THREAT
# ============================================================

@router.post("/detect")
def detect_threat(packet: NetworkPacket):

    data = pd.DataFrame(
        [[0] * 41],
        columns=features
    )

    data["duration"] = packet.duration
    data["protocol_type"] = packet.protocol_type
    data["service"] = packet.service
    data["flag"] = packet.flag

    data["src_bytes"] = packet.src_bytes
    data["dst_bytes"] = packet.dst_bytes

    data["count"] = packet.count
    data["srv_count"] = packet.srv_count

    data["serror_rate"] = packet.serror_rate
    data["srv_serror_rate"] = packet.srv_serror_rate

    data["rerror_rate"] = packet.rerror_rate
    data["srv_rerror_rate"] = packet.srv_rerror_rate

    data["same_srv_rate"] = packet.same_srv_rate
    data["diff_srv_rate"] = packet.diff_srv_rate

    scaled_data = scaler.transform(data)

    prediction = model.predict(
        scaled_data
    )[0]

    if prediction == 1:

        threat = classify_attack(
            scaled_data[0]
        )

        risk_score = calculate_risk(
            threat["severity"]
        )

        result = {
            "timestamp": datetime.utcnow(),

            "status": "Threat Detected",

            "workflow_status": "New",

            "prediction": "Attack",

            "threat_type": threat[
                "threat_type"
            ],

            "severity": threat[
                "severity"
            ],

            "confidence": threat[
                "confidence"
            ],

            "risk_score": risk_score,

            "risk_level": threat[
                "severity"
            ],

            "source": "Manual Detection"
        }

    else:

        result = {
            "timestamp": datetime.utcnow(),

            "status": "Normal Traffic",

            "workflow_status": "New",

            "prediction": "Normal",

            "threat_type": "None",

            "severity": "Low",

            "confidence": "100%",

            "risk_score": 0,

            "risk_level": "Low",

            "source": "Manual Detection"
        }

    result_id = alerts_collection.insert_one(
        result
    )

    network_status[
        "incoming_packets"
    ] += 120

    network_status[
        "outgoing_packets"
    ] += 80

    network_status[
        "bandwidth_usage"
    ] = min(
        network_status[
            "bandwidth_usage"
        ] + 3,
        100
    )

    if result["status"] == "Threat Detected":

        network_status[
            "suspicious_connections"
        ] += 1

    return {
        "id": str(
            result_id.inserted_id
        ),

        **format_alert(
            {
                **result,
                "_id": result_id.inserted_id
            }
        )
    }


# ============================================================
# GET ALL ALERTS
# ============================================================

@router.get("/")
def get_alerts():

    alerts = []

    cursor = (
        alerts_collection
        .find()
        .sort("_id", -1)
        .limit(100)
    )

    for alert in cursor:

        alerts.append(
            format_alert(alert)
        )

    return {
        "count": len(alerts),
        "alerts": alerts
    }


# ============================================================
# GET ALERT STATISTICS
# ============================================================

@router.get("/stats")
def get_alert_statistics():

    total = alerts_collection.count_documents({})

    threats = alerts_collection.count_documents({
        "status": "Threat Detected"
    })

    normal = alerts_collection.count_documents({
        "status": "Normal"
    })

    critical = alerts_collection.count_documents({
        "severity": "Critical"
    })

    high = alerts_collection.count_documents({
        "severity": "High"
    })

    medium = alerts_collection.count_documents({
        "severity": "Medium"
    })

    low = alerts_collection.count_documents({
        "severity": "Low"
    })

    new_alerts = alerts_collection.count_documents({
        "$or": [
            {
                "workflow_status": "New"
            },
            {
                "workflow_status": {
                    "$exists": False
                }
            }
        ]
    })

    acknowledged = alerts_collection.count_documents({
        "workflow_status": "Acknowledged"
    })

    investigating = alerts_collection.count_documents({
        "workflow_status": "Investigating"
    })

    resolved = alerts_collection.count_documents({
        "workflow_status": "Resolved"
    })

    return {
        "total_alerts": total,

        "threats_detected": threats,

        "normal_traffic": normal,

        "severity": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low
        },

        "workflow": {
            "new": new_alerts,
            "acknowledged": acknowledged,
            "investigating": investigating,
            "resolved": resolved
        }
    }


# ============================================================
# ACKNOWLEDGE ALERT
# ============================================================

@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str
):

    if not ObjectId.is_valid(alert_id):

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    result = alerts_collection.update_one(
        {
            "_id": ObjectId(alert_id)
        },
        {
            "$set": {
                "workflow_status": "Acknowledged",
                "acknowledged_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return {
        "message": "Alert acknowledged successfully",
        "alert_id": alert_id,
        "workflow_status": "Acknowledged"
    }


# ============================================================
# START INVESTIGATION
# ============================================================

@router.patch("/{alert_id}/investigate")
def investigate_alert(
    alert_id: str
):

    if not ObjectId.is_valid(alert_id):

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    result = alerts_collection.update_one(
        {
            "_id": ObjectId(alert_id)
        },
        {
            "$set": {
                "workflow_status": "Investigating",
                "investigation_started_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return {
        "message": "Investigation started",
        "alert_id": alert_id,
        "workflow_status": "Investigating"
    }


# ============================================================
# RESOLVE ALERT
# ============================================================

@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str
):

    if not ObjectId.is_valid(alert_id):

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    result = alerts_collection.update_one(
        {
            "_id": ObjectId(alert_id)
        },
        {
            "$set": {
                "workflow_status": "Resolved",
                "resolved_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return {
        "message": "Alert resolved successfully",
        "alert_id": alert_id,
        "workflow_status": "Resolved"
    }


# ============================================================
# GET NETWORK STATUS
# ============================================================

@router.get("/network/status")
def get_network_status():

    threat_count = alerts_collection.count_documents({
        "status": "Threat Detected"
    })

    network_status[
        "suspicious_connections"
    ] = threat_count

    return network_status


# ============================================================
# GET SINGLE ALERT
# ============================================================

@router.get("/{alert_id}")
def get_single_alert(
    alert_id: str
):

    if not ObjectId.is_valid(alert_id):

        raise HTTPException(
            status_code=400,
            detail="Invalid alert ID"
        )

    alert = alerts_collection.find_one(
        {
            "_id": ObjectId(alert_id)
        }
    )

    if alert is None:

        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return format_alert(
        alert
    )