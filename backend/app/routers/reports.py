from fastapi import APIRouter
from datetime import datetime, timezone

from app.database.mongodb import (
    predictions_collection,
    alerts_collection,
    incidents_collection,
    pcap_analysis_collection,
)

router = APIRouter(
    prefix="/reports",
    tags=["Threat Intelligence Reports"]
)


def serialize_datetime(value):
    """Convert MongoDB datetime to JSON-safe ISO format."""
    if isinstance(value, datetime):
        return value.isoformat()

    return value


def serialize_document(document):
    """Convert MongoDB document into JSON-safe dictionary."""
    if not document:
        return None

    result = {}

    for key, value in document.items():

        if key == "_id":
            result[key] = str(value)

        elif key == "prediction_id":
            result[key] = str(value)

        elif isinstance(value, datetime):
            result[key] = value.isoformat()

        else:
            result[key] = value

    return result


@router.get("/threat-intelligence")
def generate_threat_intelligence_report():

    # ============================================================
    # 1. GET PREDICTIONS
    # ============================================================

    predictions = list(
        predictions_collection.find({})
        .sort("created_at", -1)
        .limit(1000)
    )

    total_records = len(predictions)

    total_threats = 0
    total_benign = 0

    attack_distribution = {}
    dataset_distribution = {}

    threat_records = []

    confidence_total = 0
    confidence_count = 0

    for prediction in predictions:

        # --------------------------------------------------------
        # Determine prediction label
        # --------------------------------------------------------

        label = (
            prediction.get("prediction")
            or prediction.get("predicted_class")
            or prediction.get("label")
            or prediction.get("result")
            or ""
        )

        label_string = str(label)

        is_benign = (
            label_string.upper() == "BENIGN"
            or label_string.upper() == "NORMAL"
        )

        # --------------------------------------------------------
        # Confidence
        # --------------------------------------------------------

        confidence = (
            prediction.get("confidence")
            or prediction.get("average_confidence")
        )

        if confidence is not None:

            try:
                confidence_value = float(confidence)

                # Convert 0-1 confidence to percentage
                if confidence_value <= 1:
                    confidence_value *= 100

                confidence_total += confidence_value
                confidence_count += 1

            except (ValueError, TypeError):
                pass

        # --------------------------------------------------------
        # Dataset
        # --------------------------------------------------------

        dataset = (
            prediction.get("dataset")
            or prediction.get("model")
            or "Unknown"
        )

        dataset = str(dataset)

        dataset_distribution[dataset] = (
            dataset_distribution.get(dataset, 0) + 1
        )

        # --------------------------------------------------------
        # Threat / benign classification
        # --------------------------------------------------------

        if is_benign:

            total_benign += 1

        else:

            total_threats += 1

            attack_type = label_string or "Unknown"

            attack_distribution[attack_type] = (
                attack_distribution.get(attack_type, 0) + 1
            )

            threat_records.append(
                serialize_document(prediction)
            )


    # ============================================================
    # 2. GET SECURITY ALERTS
    # ============================================================

    alerts = list(
        alerts_collection.find({})
        .sort("created_at", -1)
        .limit(500)
    )

    alert_severity_distribution = {}

    for alert in alerts:

        severity = (
            alert.get("severity")
            or alert.get("level")
            or "Unknown"
        )

        severity = str(severity)

        alert_severity_distribution[severity] = (
            alert_severity_distribution.get(severity, 0) + 1
        )


    # ============================================================
    # 3. GET INCIDENTS
    # ============================================================

    incidents = list(
        incidents_collection.find({})
        .sort("created_at", -1)
        .limit(500)
    )

    incident_status_distribution = {}

    for incident in incidents:

        status = (
            incident.get("status")
            or "Unknown"
        )

        status = str(status)

        incident_status_distribution[status] = (
            incident_status_distribution.get(status, 0) + 1
        )


    # ============================================================
    # 4. GET PCAP ANALYSES
    # ============================================================

    pcap_analyses = list(
        pcap_analysis_collection.find({})
        .sort("created_at", -1)
        .limit(50)
    )

    total_pcap_packets = 0
    total_pcap_bytes = 0

    tcp_packets = 0
    udp_packets = 0
    icmp_packets = 0

    protocol_distribution = {}

    top_source_ips = {}
    top_destination_ips = {}

    for analysis in pcap_analyses:

        total_pcap_packets += analysis.get(
            "total_packets", 0
        )

        total_pcap_bytes += analysis.get(
            "total_bytes", 0
        )

        tcp_packets += analysis.get(
            "tcp_packets", 0
        )

        udp_packets += analysis.get(
            "udp_packets", 0
        )

        icmp_packets += analysis.get(
            "icmp_packets", 0
        )

        # --------------------------------------------------------
        # Protocols
        # --------------------------------------------------------

        protocols = analysis.get(
            "protocol_distribution",
            {}
        )

        for protocol, count in protocols.items():

            protocol_distribution[protocol] = (
                protocol_distribution.get(protocol, 0)
                + count
            )

        # --------------------------------------------------------
        # Source IPs
        # --------------------------------------------------------

        sources = analysis.get(
            "top_source_ips",
            {}
        )

        for ip, count in sources.items():

            top_source_ips[ip] = (
                top_source_ips.get(ip, 0)
                + count
            )

        # --------------------------------------------------------
        # Destination IPs
        # --------------------------------------------------------

        destinations = analysis.get(
            "top_destination_ips",
            {}
        )

        for ip, count in destinations.items():

            top_destination_ips[ip] = (
                top_destination_ips.get(ip, 0)
                + count
            )


    # ============================================================
    # 5. SORT NETWORK INFORMATION
    # ============================================================

    top_source_ips = dict(
        sorted(
            top_source_ips.items(),
            key=lambda item: item[1],
            reverse=True
        )[:10]
    )

    top_destination_ips = dict(
        sorted(
            top_destination_ips.items(),
            key=lambda item: item[1],
            reverse=True
        )[:10]
    )

    protocol_distribution = dict(
        sorted(
            protocol_distribution.items(),
            key=lambda item: item[1],
            reverse=True
        )
    )


    # ============================================================
    # 6. CALCULATE SUMMARY
    # ============================================================

    if total_records > 0:

        threat_percentage = (
            total_threats / total_records
        ) * 100

        benign_percentage = (
            total_benign / total_records
        ) * 100

    else:

        threat_percentage = 0
        benign_percentage = 0


    if confidence_count > 0:

        average_confidence = (
            confidence_total /
            confidence_count
        )

    else:

        average_confidence = 0


    # ============================================================
    # 7. GENERATE RECOMMENDATIONS
    # ============================================================

    recommendations = []

    if total_threats > 0:

        recommendations.append(
            "Investigate detected threat records "
            "and review their associated network activity."
        )

        recommendations.append(
            "Review the source and destination IP addresses "
            "associated with detected threats."
        )

    else:

        recommendations.append(
            "No active threats were detected in the "
            "currently analyzed prediction records."
        )

    if len(alerts) > 0:

        recommendations.append(
            "Review security alerts according to their "
            "severity and investigate unresolved alerts."
        )

    if len(incidents) > 0:

        recommendations.append(
            "Monitor open and investigating incidents "
            "until they are resolved."
        )

    if len(pcap_analyses) > 0:

        recommendations.append(
            "Use Wireshark PCAP analysis to investigate "
            "suspicious network traffic and communication patterns."
        )

    recommendations.append(
        "Continue continuous network monitoring and "
        "periodically review threat intelligence reports."
    )


    # ============================================================
    # 8. BUILD FINAL REPORT
    # ============================================================

    generated_at = datetime.now(timezone.utc)

    report = {

        "report_title":
            "NetShield AI Threat Intelligence Report",

        "generated_at":
            generated_at.isoformat(),

        "summary": {

            "total_records":
                total_records,

            "total_threats":
                total_threats,

            "total_benign":
                total_benign,

            "threat_percentage":
                round(threat_percentage, 2),

            "benign_percentage":
                round(benign_percentage, 2),

            "average_confidence":
                round(average_confidence, 2),

            "total_alerts":
                len(alerts),

            "total_incidents":
                len(incidents),

            "total_pcap_analyses":
                len(pcap_analyses),

        },

        "threat_intelligence": {

            "attack_distribution":
                attack_distribution,

            "dataset_distribution":
                dataset_distribution,

            "threat_records":
                threat_records,

        },

        "alert_intelligence": {

            "total_alerts":
                len(alerts),

            "severity_distribution":
                alert_severity_distribution,

            "recent_alerts": [
                serialize_document(alert)
                for alert in alerts[:20]
            ],

        },

        "incident_intelligence": {

            "total_incidents":
                len(incidents),

            "status_distribution":
                incident_status_distribution,

            "recent_incidents": [
                serialize_document(incident)
                for incident in incidents[:20]
            ],

        },

        "network_intelligence": {

            "pcap_analyses":
                len(pcap_analyses),

            "total_packets":
                total_pcap_packets,

            "total_bytes":
                total_pcap_bytes,

            "tcp_packets":
                tcp_packets,

            "udp_packets":
                udp_packets,

            "icmp_packets":
                icmp_packets,

            "protocol_distribution":
                protocol_distribution,

            "top_source_ips":
                top_source_ips,

            "top_destination_ips":
                top_destination_ips,

        },

        "recommendations":
            recommendations,

    }

    return report