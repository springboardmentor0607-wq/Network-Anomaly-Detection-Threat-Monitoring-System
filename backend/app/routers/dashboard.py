from fastapi import APIRouter
from pathlib import Path
from datetime import datetime, timezone
from bson import ObjectId
import json


from app.database.mongodb import (
    users_collection,
    predictions_collection,
    incidents_collection,
    audit_collection,
    alerts_collection,
    pcap_analysis_collection
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ======================================================
# LOAD TRAINING METRICS
# ======================================================

BASE_DIR = Path(__file__).resolve().parents[1]

METRICS_FILE = BASE_DIR / "models" / "training_metrics.json"


def load_training_metrics():

    try:

        with open(
            METRICS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    except Exception as e:

        print(
            "Error loading training metrics:",
            e
        )

        return {}


# ======================================================
# ADMIN DASHBOARD
# ======================================================

@router.get("/admin")
def admin_dashboard():

    statistics = {

        "total_users":
            users_collection.count_documents({}),

        "active_users":
            users_collection.count_documents(
                {"status": "Active"}
            ),

        "inactive_users":
            users_collection.count_documents(
                {"status": "Inactive"}
            ),

        "admins":
            users_collection.count_documents(
                {"role": "Administrator"}
            ),

        "analysts":
            users_collection.count_documents(
                {"role": "Security Analyst"}
            ),

        "operators":
            users_collection.count_documents(
                {"role": "SOC Operator"}
            ),

        "predictions":
            predictions_collection.count_documents({}),

        "incidents":
            incidents_collection.count_documents({}),

        "alerts":
            alerts_collection.count_documents({}),

        "audit_logs":
            audit_collection.count_documents({})

    }


    # --------------------------------------------------
    # LATEST PREDICTIONS
    # --------------------------------------------------

    latest_predictions = list(

        predictions_collection.find(
            {},
            {"_id": 0}
        )
        .sort(
            "created_at",
            -1
        )
        .limit(5)

    )


    # --------------------------------------------------
    # LATEST AUDIT LOGS
    # --------------------------------------------------

    latest_logs = list(

        audit_collection.find(
            {},
            {"_id": 0}
        )
        .sort(
            "timestamp",
            -1
        )
        .limit(5)

    )


    # --------------------------------------------------
    # SYSTEM STATUS
    # --------------------------------------------------

    system = [

        {
            "name": "FastAPI Server",
            "status": "Online"
        },

        {
            "name": "MongoDB",
            "status": "Connected"
        },

        {
            "name": "AI Engine",
            "status": "Running"
        },

        {
            "name": "Prediction Service",
            "status": "Healthy"
        }

    ]


    return {

        "statistics":
            statistics,

        "system":
            system,

        "latest_predictions":
            latest_predictions,

        "latest_logs":
            latest_logs,

        "ai_models":
            load_training_metrics()

    }


# ======================================================
# SECURITY ANALYST DASHBOARD
# ======================================================

@router.get("/security")
def security_dashboard():

    latest_predictions = list(

        predictions_collection.find(
            {},
            {"_id": 0}
        )
        .sort(
            "created_at",
            -1
        )
        .limit(10)

    )


    total_predictions = \
        predictions_collection.count_documents({})


    processed_records = 0

    confidence_total = 0

    threat_summary = {}


    for prediction in latest_predictions:

        processed_records += prediction.get(
            "processed_records",
            0
        )


        confidence_total += prediction.get(
            "average_confidence",
            0
        )


        summary = prediction.get(
            "summary",
            {}
        )


        for attack, count in summary.items():

            threat_summary[attack] = (

                threat_summary.get(
                    attack,
                    0
                )

                + count

            )


    average_confidence = 0


    if latest_predictions:

        average_confidence = round(

            confidence_total /
            len(latest_predictions),

            2

        )


    system = [

        {
            "name": "FastAPI Server",
            "status": "Online"
        },

        {
            "name": "MongoDB",
            "status": "Connected"
        },

        {
            "name": "AI Engine",
            "status": "Running"
        },

        {
            "name": "Prediction Service",
            "status": "Healthy"
        }

    ]


    return {

        "total_predictions":
            total_predictions,

        "processed_records":
            processed_records,

        "average_confidence":
            average_confidence,

        "threat_summary":
            threat_summary,

        "latest_predictions":
            latest_predictions,

        "system":
            system,

        "ai_models":
            load_training_metrics()

    }


# ======================================================
# LIVE NETWORK DASHBOARD
# ======================================================

@router.get("/network")
def live_network():

    latest_predictions = list(

        predictions_collection.find(
            {},
            {"_id": 0}
        )
        .sort(
            "created_at",
            -1
        )
        .limit(20)

    )


    total_predictions = \
        predictions_collection.count_documents({})


    processed_records = 0

    confidence_total = 0

    datasets = {}

    threat_summary = {}


    for prediction in latest_predictions:

        processed_records += prediction.get(
            "processed_records",
            0
        )


        confidence_total += prediction.get(
            "average_confidence",
            0
        )


        dataset = prediction.get(
            "dataset",
            "Unknown"
        )


        datasets[dataset] = (

            datasets.get(
                dataset,
                0
            )

            + 1

        )


        summary = prediction.get(
            "summary",
            {}
        )


        for attack, count in summary.items():

            threat_summary[attack] = (

                threat_summary.get(
                    attack,
                    0
                )

                + count

            )


    average_confidence = 0


    if latest_predictions:

        average_confidence = round(

            confidence_total /
            len(latest_predictions),

            2

        )


    return {

        "total_predictions":
            total_predictions,

        "processed_records":
            processed_records,

        "average_confidence":
            average_confidence,

        "datasets":
            datasets,

        "threat_summary":
            threat_summary,

        "latest_predictions":
            latest_predictions,

        "ai_models":
            load_training_metrics()

    }


# ======================================================
# INCIDENT INVESTIGATION
# ======================================================

@router.get("/incidents")
def get_incidents():

    incidents = list(

        incidents_collection.find({})

        .sort(
            "created_at",
            -1
        )

        .limit(100)

    )


    for incident in incidents:

        incident["_id"] = str(
            incident["_id"]
        )


        if "prediction_id" in incident:

            incident["prediction_id"] = str(
                incident["prediction_id"]
            )


    return {

        "total":
            len(incidents),

        "incidents":
            incidents

    }


# ======================================================
# UPDATE INCIDENT STATUS
# ======================================================

@router.put("/incidents/{incident_id}")
def update_incident_status(
    incident_id: str,
    status: str
):

    allowed_statuses = [

        "Open",
        "Investigating",
        "Resolved",
        "Closed"

    ]


    if status not in allowed_statuses:

        return {

            "success": False,

            "message":
                "Invalid incident status"

        }


    try:

        object_id = ObjectId(
            incident_id
        )

    except Exception:

        return {

            "success": False,

            "message":
                "Invalid incident ID"

        }


    result = incidents_collection.update_one(

        {
            "_id":
                object_id
        },

        {
            "$set": {

                "status":
                    status,

                "updated_at":
                    datetime.now(
                        timezone.utc
                    )

            }

        }

    )


    if result.matched_count == 0:

        return {

            "success": False,

            "message":
                "Incident not found"

        }


    return {

        "success": True,

        "message":
            "Incident status updated",

        "status":
            status

    }


# ======================================================
# ALERT DASHBOARD
# ======================================================

@router.get("/alerts")
def get_alerts():

    alerts = list(

        alerts_collection.find({})

        .sort(
            "created_at",
            -1
        )

        .limit(100)

    )


    for alert in alerts:

        alert["_id"] = str(
            alert["_id"]
        )


        if "prediction_id" in alert:

            alert["prediction_id"] = str(
                alert["prediction_id"]
            )


        if "incident_id" in alert:

            alert["incident_id"] = str(
                alert["incident_id"]
            )


    return {

        "total":
            len(alerts),

        "alerts":
            alerts

    }


# ======================================================
# ALERT STATISTICS
# ======================================================

@router.get("/alert-stats")
def get_alert_statistics():

    total = alerts_collection.count_documents({})


    critical = alerts_collection.count_documents(
        {
            "severity": "Critical"
        }
    )


    high = alerts_collection.count_documents(
        {
            "severity": "High"
        }
    )


    medium = alerts_collection.count_documents(
        {
            "severity": "Medium"
        }
    )


    low = alerts_collection.count_documents(
        {
            "severity": "Low"
        }
    )


    new = alerts_collection.count_documents(
        {
            "status": "New"
        }
    )


    acknowledged = alerts_collection.count_documents(
        {
            "status": "Acknowledged"
        }
    )


    investigating = alerts_collection.count_documents(
        {
            "status": "Investigating"
        }
    )


    resolved = alerts_collection.count_documents(
        {
            "status": "Resolved"
        }
    )


    return {

        "total_alerts":
            total,

        "critical":
            critical,

        "high":
            high,

        "medium":
            medium,

        "low":
            low,

        "new":
            new,

        "acknowledged":
            acknowledged,

        "investigating":
            investigating,

        "resolved":
            resolved

    }


# ======================================================
# GET SINGLE ALERT
# ======================================================

@router.get("/alerts/{alert_id}")
def get_alert(alert_id: str):

    try:

        object_id = ObjectId(
            alert_id
        )

    except Exception:

        return {

            "success": False,

            "message":
                "Invalid alert ID"

        }


    alert = alerts_collection.find_one(
        {
            "_id":
                object_id
        }
    )


    if not alert:

        return {

            "success": False,

            "message":
                "Alert not found"

        }


    alert["_id"] = str(
        alert["_id"]
    )


    if "prediction_id" in alert:

        alert["prediction_id"] = str(
            alert["prediction_id"]
        )


    if "incident_id" in alert:

        alert["incident_id"] = str(
            alert["incident_id"]
        )


    return {

        "success": True,

        "alert":
            alert

    }


# ======================================================
# UPDATE ALERT STATUS
# ======================================================

@router.put("/alerts/{alert_id}")
def update_alert_status(
    alert_id: str,
    status: str
):

    allowed_statuses = [

        "New",
        "Acknowledged",
        "Investigating",
        "Resolved",
        "Closed"

    ]


    if status not in allowed_statuses:

        return {

            "success": False,

            "message":
                "Invalid alert status"

        }


    try:

        object_id = ObjectId(
            alert_id
        )

    except Exception:

        return {

            "success": False,

            "message":
                "Invalid alert ID"

        }


    result = alerts_collection.update_one(

        {
            "_id":
                object_id
        },

        {
            "$set": {

                "status":
                    status,

                "updated_at":
                    datetime.now(
                        timezone.utc
                    )

            }

        }

    )


    if result.matched_count == 0:

        return {

            "success": False,

            "message":
                "Alert not found"

        }


    return {

        "success": True,

        "message":
            "Alert status updated",

        "status":
            status

    }
 
# ============================================================
# UPDATE ALERT STATUS
# ============================================================

@router.put("/alerts/{alert_id}")
def update_alert_status(
    alert_id: str,
    status: str
):

    from bson import ObjectId

    allowed_statuses = [
        "Open",
        "Acknowledged",
        "Investigating",
        "Resolved",
        "Closed"
    ]

    if status not in allowed_statuses:

        return {
            "success": False,
            "message": "Invalid alert status"
        }

    try:

        object_id = ObjectId(alert_id)

    except Exception:

        return {
            "success": False,
            "message": "Invalid alert ID"
        }

    result = alerts_collection.update_one(
        {
            "_id": object_id
        },
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(
                    timezone.utc
                )
            }
        }
    )

    if result.matched_count == 0:

        return {
            "success": False,
            "message": "Alert not found"
        }

    return {
        "success": True,
        "message": "Alert status updated",
        "status": status
    }
    # ============================================================
# SECURITY ANALYTICS
# ============================================================

@router.get("/analytics")
def security_analytics():

    # --------------------------------------------------------
    # Get latest predictions
    # --------------------------------------------------------

    predictions = list(
        predictions_collection.find({})
        .sort("created_at", -1)
        .limit(100)
    )

    total_predictions = len(predictions)

    # --------------------------------------------------------
    # Analytics variables
    # --------------------------------------------------------

    total_records = 0
    total_threats = 0
    benign_records = 0
    confidence_total = 0

    attack_distribution = {}
    dataset_distribution = {}

    # --------------------------------------------------------
    # Process prediction records
    # --------------------------------------------------------

    for prediction in predictions:

        processed = prediction.get(
            "processed_records",
            0
        )

        total_records += processed

        confidence_total += prediction.get(
            "average_confidence",
            0
        )

        dataset = prediction.get(
            "dataset",
            "Unknown"
        )

        dataset_distribution[dataset] = (
            dataset_distribution.get(dataset, 0) + 1
        )

        summary = prediction.get(
            "summary",
            {}
        )

        for attack, count in summary.items():

            attack_distribution[attack] = (
                attack_distribution.get(
                    attack,
                    0
                ) + count
            )

            if attack.upper() == "BENIGN":

                benign_records += count

            else:

                total_threats += count

    # --------------------------------------------------------
    # Average confidence
    # --------------------------------------------------------

    average_confidence = 0

    if predictions:

        average_confidence = round(
            confidence_total / len(predictions),
            2
        )

    # --------------------------------------------------------
    # Threat percentage
    # --------------------------------------------------------

    threat_percentage = 0

    if total_records > 0:

        threat_percentage = round(
            (total_threats / total_records) * 100,
            2
        )

    # --------------------------------------------------------
    # Benign percentage
    # --------------------------------------------------------

    benign_percentage = 0

    if total_records > 0:

        benign_percentage = round(
            (benign_records / total_records) * 100,
            2
        )

    # --------------------------------------------------------
    # Incidents
    # --------------------------------------------------------

    total_incidents = incidents_collection.count_documents({})

    open_incidents = incidents_collection.count_documents({
        "status": "Open"
    })

    investigating_incidents = incidents_collection.count_documents({
        "status": "Investigating"
    })

    resolved_incidents = incidents_collection.count_documents({
        "status": "Resolved"
    })

    # --------------------------------------------------------
    # Alerts
    # --------------------------------------------------------

    total_alerts = alerts_collection.count_documents({})

    # --------------------------------------------------------
    # Sort attack distribution
    # --------------------------------------------------------

    sorted_attacks = dict(
        sorted(
            attack_distribution.items(),
            key=lambda item: item[1],
            reverse=True
        )
    )

    # --------------------------------------------------------
    # Most frequent attack
    # --------------------------------------------------------

    most_frequent_attack = "None"

    if sorted_attacks:

        non_benign = {
            k: v
            for k, v in sorted_attacks.items()
            if k.upper() != "BENIGN"
        }

        if non_benign:

            most_frequent_attack = max(
                non_benign,
                key=non_benign.get
            )

    # --------------------------------------------------------
    # Return analytics
    # --------------------------------------------------------

    return {

        "success": True,

        "total_predictions":
            predictions_collection.count_documents({}),

        "analyzed_predictions":
            total_predictions,

        "total_records":
            total_records,

        "total_threats":
            total_threats,

        "benign_records":
            benign_records,

        "threat_percentage":
            threat_percentage,

        "benign_percentage":
            benign_percentage,

        "average_confidence":
            average_confidence,

        "attack_distribution":
            sorted_attacks,

        "dataset_distribution":
            dataset_distribution,

        "most_frequent_attack":
            most_frequent_attack,

        "incidents": {

            "total":
                total_incidents,

            "open":
                open_incidents,

            "investigating":
                investigating_incidents,

            "resolved":
                resolved_incidents

        },

        "alerts": {

            "total":
                total_alerts

        }

    }
    # ============================================================
# SECURITY ANALYTICS
# ============================================================

@router.get("/analytics")
def security_analytics():

    # --------------------------------------------------------
    # Get latest predictions
    # --------------------------------------------------------

    predictions = list(
        predictions_collection.find({})
        .sort("created_at", -1)
        .limit(100)
    )

    total_predictions = len(predictions)

    # --------------------------------------------------------
    # Analytics variables
    # --------------------------------------------------------

    total_records = 0
    total_threats = 0
    benign_records = 0
    confidence_total = 0

    attack_distribution = {}
    dataset_distribution = {}

    # --------------------------------------------------------
    # Process prediction records
    # --------------------------------------------------------

    for prediction in predictions:

        processed = prediction.get(
            "processed_records",
            0
        )

        total_records += processed

        confidence_total += prediction.get(
            "average_confidence",
            0
        )

        dataset = prediction.get(
            "dataset",
            "Unknown"
        )

        dataset_distribution[dataset] = (
            dataset_distribution.get(dataset, 0) + 1
        )

        summary = prediction.get(
            "summary",
            {}
        )

        for attack, count in summary.items():

            attack_distribution[attack] = (
                attack_distribution.get(
                    attack,
                    0
                ) + count
            )

            if attack.upper() == "BENIGN":

                benign_records += count

            else:

                total_threats += count

    # --------------------------------------------------------
    # Average confidence
    # --------------------------------------------------------

    average_confidence = 0

    if predictions:

        average_confidence = round(
            confidence_total / len(predictions),
            2
        )

    # --------------------------------------------------------
    # Threat percentage
    # --------------------------------------------------------

    threat_percentage = 0

    if total_records > 0:

        threat_percentage = round(
            (total_threats / total_records) * 100,
            2
        )

    # --------------------------------------------------------
    # Benign percentage
    # --------------------------------------------------------

    benign_percentage = 0

    if total_records > 0:

        benign_percentage = round(
            (benign_records / total_records) * 100,
            2
        )

    # --------------------------------------------------------
    # Incidents
    # --------------------------------------------------------

    total_incidents = incidents_collection.count_documents({})

    open_incidents = incidents_collection.count_documents({
        "status": "Open"
    })

    investigating_incidents = incidents_collection.count_documents({
        "status": "Investigating"
    })

    resolved_incidents = incidents_collection.count_documents({
        "status": "Resolved"
    })

    # --------------------------------------------------------
    # Alerts
    # --------------------------------------------------------

    total_alerts = alerts_collection.count_documents({})

    # --------------------------------------------------------
    # Sort attack distribution
    # --------------------------------------------------------

    sorted_attacks = dict(
        sorted(
            attack_distribution.items(),
            key=lambda item: item[1],
            reverse=True
        )
    )

    # --------------------------------------------------------
    # Most frequent attack
    # --------------------------------------------------------

    most_frequent_attack = "None"

    if sorted_attacks:

        non_benign = {
            k: v
            for k, v in sorted_attacks.items()
            if k.upper() != "BENIGN"
        }

        if non_benign:

            most_frequent_attack = max(
                non_benign,
                key=non_benign.get
            )

    # --------------------------------------------------------
    # Return analytics
    # --------------------------------------------------------

    return {

        "success": True,

        "total_predictions":
            predictions_collection.count_documents({}),

        "analyzed_predictions":
            total_predictions,

        "total_records":
            total_records,

        "total_threats":
            total_threats,

        "benign_records":
            benign_records,

        "threat_percentage":
            threat_percentage,

        "benign_percentage":
            benign_percentage,

        "average_confidence":
            average_confidence,

        "attack_distribution":
            sorted_attacks,

        "dataset_distribution":
            dataset_distribution,

        "most_frequent_attack":
            most_frequent_attack,

        "incidents": {

            "total":
                total_incidents,

            "open":
                open_incidents,

            "investigating":
                investigating_incidents,

            "resolved":
                resolved_incidents

        },

        "alerts": {

            "total":
                total_alerts

        }

    }
    # ============================================================
# PCAP SECURITY ANALYTICS
# ============================================================

@router.get("/pcap-analytics")
def pcap_security_analytics():

    analyses = list(
        pcap_analysis_collection.find({})
        .sort("created_at", -1)
        .limit(20)
    )

    total_packets = 0
    total_bytes = 0
    total_tcp = 0
    total_udp = 0
    total_icmp = 0

    protocol_distribution = {}
    source_ips = {}
    destination_ips = {}

    for analysis in analyses:

        total_packets += analysis.get(
            "total_packets",
            0
        )

        total_bytes += analysis.get(
            "total_bytes",
            0
        )

        total_tcp += analysis.get(
            "tcp_packets",
            0
        )

        total_udp += analysis.get(
            "udp_packets",
            0
        )

        total_icmp += analysis.get(
            "icmp_packets",
            0
        )

        # Protocols

        protocols = analysis.get(
            "protocol_distribution",
            {}
        )

        for protocol, count in protocols.items():

            protocol_distribution[protocol] = (
                protocol_distribution.get(
                    protocol,
                    0
                ) + count
            )

        # Source IPs

        sources = analysis.get(
            "top_source_ips",
            {}
        )

        for ip, count in sources.items():

            source_ips[ip] = (
                source_ips.get(ip, 0)
                + count
            )

        # Destination IPs

        destinations = analysis.get(
            "top_destination_ips",
            {}
        )

        for ip, count in destinations.items():

            destination_ips[ip] = (
                destination_ips.get(ip, 0)
                + count
            )

    # Top 10 IPs

    top_sources = dict(
        sorted(
            source_ips.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
    )

    top_destinations = dict(
        sorted(
            destination_ips.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
    )

    return {

        "total_analyses":
            len(analyses),

        "total_packets":
            total_packets,

        "total_bytes":
            total_bytes,

        "tcp_packets":
            total_tcp,

        "udp_packets":
            total_udp,

        "icmp_packets":
            total_icmp,

        "protocol_distribution":
            protocol_distribution,

        "top_source_ips":
            top_sources,

        "top_destination_ips":
            top_destinations

    }