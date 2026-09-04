from fastapi import APIRouter, HTTPException
from app.database import alerts_collection
from collections import Counter
from datetime import datetime


router = APIRouter(
    prefix="/timeline",
    tags=["Threat Timeline"]
)


# ============================================================
# THREAT TIMELINE
# ============================================================

@router.get("/")
def get_threat_timeline():

    try:

        # ----------------------------------------------------
        # Get latest 100 events
        # ----------------------------------------------------

        alerts = list(
            alerts_collection
            .find({})
            .sort("timestamp", -1)
            .limit(100)
        )

        timeline = []

        # ----------------------------------------------------
        # Process alerts
        # ----------------------------------------------------

        for alert in alerts:

            alert_id = str(
                alert.get("_id", "")
            )

            threat_type = (
                alert.get("threat_type")
                or alert.get("prediction")
                or "Unknown"
            )

            severity = (
                alert.get("severity")
                or "Low"
            )

            status = (
                alert.get("status")
                or "Unknown"
            )

            confidence = (
                alert.get("confidence")
                or alert.get("confidence_value")
                or 0
            )

            # ------------------------------------------------
            # Convert confidence
            # ------------------------------------------------

            if isinstance(confidence, str):

                confidence = (
                    confidence
                    .replace("%", "")
                    .strip()
                )

                try:
                    confidence = float(confidence)

                except ValueError:
                    confidence = 0

            # ------------------------------------------------
            # Risk score
            # ------------------------------------------------

            risk_score = alert.get(
                "risk_score",
                0
            )

            try:

                risk_score = float(
                    risk_score
                )

            except (
                ValueError,
                TypeError
            ):

                risk_score = 0

            # ------------------------------------------------
            # Timestamp
            # ------------------------------------------------

            timestamp = alert.get(
                "timestamp"
            )

            if isinstance(
                timestamp,
                datetime
            ):

                timestamp = (
                    timestamp.isoformat()
                )

            elif timestamp:

                timestamp = str(
                    timestamp
                )

            else:

                timestamp = None

            # ------------------------------------------------
            # Network information
            # ------------------------------------------------

            source_ip = alert.get(
                "source_ip",
                "Unknown"
            )

            destination_ip = alert.get(
                "destination_ip",
                "Unknown"
            )

            protocol = (
                alert.get("protocol_type")
                or alert.get("protocol")
                or "Unknown"
            )

            service = alert.get(
                "service",
                "Unknown"
            )

            source_port = alert.get(
                "source_port",
                0
            )

            destination_port = alert.get(
                "destination_port",
                0
            )

            # ------------------------------------------------
            # Timeline event
            # ------------------------------------------------

            timeline.append({

                "id": alert_id,

                "threat_type":
                    threat_type,

                "severity":
                    severity,

                "risk_score":
                    risk_score,

                "confidence":
                    confidence,

                "status":
                    status,

                "timestamp":
                    timestamp,

                "source_ip":
                    source_ip,

                "destination_ip":
                    destination_ip,

                "protocol":
                    protocol,

                "service":
                    service,

                "source_port":
                    source_port,

                "destination_port":
                    destination_port

            })

        # ====================================================
        # BEHAVIORAL INTELLIGENCE
        # ====================================================

        source_counter = Counter()
        destination_counter = Counter()
        port_counter = Counter()
        service_counter = Counter()
        threat_counter = Counter()

        # ----------------------------------------------------
        # Analyze events
        # ----------------------------------------------------

        for event in timeline:

            threat_type = str(
                event["threat_type"]
            )

            # Don't include normal traffic
            # when calculating attacking sources

            if "normal" not in threat_type.lower():

                source_counter[
                    event["source_ip"]
                ] += 1

                destination_counter[
                    event["destination_ip"]
                ] += 1

                destination_port = str(
                    event["destination_port"]
                )

                port_counter[
                    destination_port
                ] += 1

                service_counter[
                    event["service"]
                ] += 1

            threat_counter[
                threat_type
            ] += 1

        # ====================================================
        # TOP ATTACKING IPs
        # ====================================================

        top_sources = [

            {
                "ip": ip,
                "count": count
            }

            for ip, count
            in source_counter.most_common(10)

        ]

        # ====================================================
        # TOP TARGETED IPs
        # ====================================================

        top_destinations = [

            {
                "ip": ip,
                "count": count
            }

            for ip, count
            in destination_counter.most_common(10)

        ]

        # ====================================================
        # TOP PORTS
        # ====================================================

        top_ports = [

            {
                "port": port,
                "count": count
            }

            for port, count
            in port_counter.most_common(10)

        ]

        # ====================================================
        # TOP SERVICES
        # ====================================================

        top_services = [

            {
                "service": service,
                "count": count
            }

            for service, count
            in service_counter.most_common(10)

        ]

        # ====================================================
        # THREAT TRENDS
        # ====================================================

        threat_distribution = [

            {
                "name": name,
                "value": count
            }

            for name, count
            in threat_counter.items()

        ]

        # ====================================================
        # RESPONSE
        # ====================================================

        return {

            "success": True,

            "summary": {

                "total_events":
                    len(timeline),

                "threat_events":
                    sum(
                        1
                        for event in timeline
                        if "normal"
                        not in str(
                            event["threat_type"]
                        ).lower()
                    ),

                "normal_events":
                    sum(
                        1
                        for event in timeline
                        if "normal"
                        in str(
                            event["threat_type"]
                        ).lower()
                    ),

                "critical_events":
                    sum(
                        1
                        for event in timeline
                        if str(
                            event["severity"]
                        ).lower()
                        == "critical"
                    )

            },

            "timeline":
                timeline,

            "threat_distribution":
                threat_distribution,

            "top_attacking_sources":
                top_sources,

            "top_targeted_destinations":
                top_destinations,

            "top_destination_ports":
                top_ports,

            "top_services":
                top_services

        }

    except Exception as error:

        print(
            "[TIMELINE ERROR]",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate threat timeline"
        )