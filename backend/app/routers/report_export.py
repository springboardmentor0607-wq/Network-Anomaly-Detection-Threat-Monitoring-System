from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from datetime import datetime, timezone
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

from app.database.mongodb import (
    predictions_collection,
    alerts_collection,
    incidents_collection,
    pcap_analysis_collection,
)


router = APIRouter(
    prefix="/reports",
    tags=["Threat Intelligence PDF"]
)


def get_label(prediction):
    return str(
        prediction.get("prediction")
        or prediction.get("predicted_class")
        or prediction.get("label")
        or prediction.get("result")
        or "Unknown"
    )


def get_confidence(prediction):
    confidence = (
        prediction.get("confidence")
        or prediction.get("average_confidence")
    )

    try:
        confidence = float(confidence)

        if confidence <= 1:
            confidence *= 100

        return confidence

    except (ValueError, TypeError):
        return 0


def build_pdf():

    # ==========================================================
    # LOAD DATA
    # ==========================================================

    predictions = list(
        predictions_collection.find({})
        .sort("created_at", -1)
        .limit(1000)
    )

    alerts = list(
        alerts_collection.find({})
        .sort("created_at", -1)
        .limit(500)
    )

    incidents = list(
        incidents_collection.find({})
        .sort("created_at", -1)
        .limit(500)
    )

    pcap_analyses = list(
        pcap_analysis_collection.find({})
        .sort("created_at", -1)
        .limit(50)
    )


    # ==========================================================
    # THREAT STATISTICS
    # ==========================================================

    total_records = len(predictions)
    total_threats = 0
    total_benign = 0

    attack_distribution = {}
    dataset_distribution = {}

    confidence_total = 0
    confidence_count = 0

    for prediction in predictions:

        label = get_label(prediction)

        if label.upper() in ["BENIGN", "NORMAL"]:

            total_benign += 1

        else:

            total_threats += 1

            attack_distribution[label] = (
                attack_distribution.get(label, 0) + 1
            )

        dataset = str(
            prediction.get("dataset")
            or prediction.get("model")
            or "Unknown"
        )

        dataset_distribution[dataset] = (
            dataset_distribution.get(dataset, 0) + 1
        )

        confidence = get_confidence(prediction)

        if confidence > 0:

            confidence_total += confidence
            confidence_count += 1


    threat_percentage = (
        (total_threats / total_records) * 100
        if total_records
        else 0
    )

    benign_percentage = (
        (total_benign / total_records) * 100
        if total_records
        else 0
    )

    average_confidence = (
        confidence_total / confidence_count
        if confidence_count
        else 0
    )


    # ==========================================================
    # ALERT STATISTICS
    # ==========================================================

    alert_severity_distribution = {}

    for alert in alerts:

        severity = str(
            alert.get("severity")
            or alert.get("level")
            or "Unknown"
        )

        alert_severity_distribution[severity] = (
            alert_severity_distribution.get(severity, 0) + 1
        )


    # ==========================================================
    # INCIDENT STATISTICS
    # ==========================================================

    incident_status_distribution = {}

    for incident in incidents:

        status = str(
            incident.get("status")
            or "Unknown"
        )

        incident_status_distribution[status] = (
            incident_status_distribution.get(status, 0) + 1
        )


    # ==========================================================
    # PCAP STATISTICS
    # ==========================================================

    total_pcap_packets = 0
    total_pcap_bytes = 0
    tcp_packets = 0
    udp_packets = 0
    icmp_packets = 0

    protocol_distribution = {}
    source_ips = {}
    destination_ips = {}

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


        for protocol, count in analysis.get(
            "protocol_distribution", {}
        ).items():

            protocol_distribution[protocol] = (
                protocol_distribution.get(protocol, 0)
                + count
            )


        for ip, count in analysis.get(
            "top_source_ips", {}
        ).items():

            source_ips[ip] = (
                source_ips.get(ip, 0) + count
            )


        for ip, count in analysis.get(
            "top_destination_ips", {}
        ).items():

            destination_ips[ip] = (
                destination_ips.get(ip, 0) + count
            )


    source_ips = dict(
        sorted(
            source_ips.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
    )

    destination_ips = dict(
        sorted(
            destination_ips.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
    )


    # ==========================================================
    # CREATE PDF
    # ==========================================================

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )


    styles = getSampleStyleSheet()


    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=22,
        leading=28,
        spaceAfter=10,
    )


    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=11,
        leading=16,
        spaceAfter=20,
    )


    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=15,
        leading=20,
        spaceBefore=12,
        spaceAfter=10,
    )


    normal_style = ParagraphStyle(
        "NormalText",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
    )


    story = []


    # ==========================================================
    # TITLE PAGE
    # ==========================================================

    story.append(
        Spacer(1, 25 * mm)
    )

    story.append(
        Paragraph(
            "NETSHIELD AI",
            title_style
        )
    )

    story.append(
        Paragraph(
            "Threat Intelligence Report",
            title_style
        )
    )

    story.append(
        Paragraph(
            "AI-Powered Network Security Monitoring and Analytics",
            subtitle_style
        )
    )


    generated_at = datetime.now(
        timezone.utc
    ).astimezone().strftime(
        "%d-%b-%Y %I:%M %p"
    )


    title_data = [
        ["Generated", generated_at],
        ["Total Records", str(total_records)],
        ["Threats Detected", str(total_threats)],
        ["Benign Records", str(total_benign)],
        ["AI Confidence", f"{average_confidence:.2f}%"],
    ]


    title_table = Table(
        title_data,
        colWidths=[55 * mm, 90 * mm]
    )


    title_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.HexColor("#1f2937")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (0, -1),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, -1),
                "Helvetica"
            ),
            (
                "FONTNAME",
                (0, 0),
                (0, -1),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                8
            ),
        ])
    )


    story.append(title_table)

    story.append(PageBreak())


    # ==========================================================
    # SECURITY SUMMARY
    # ==========================================================

    story.append(
        Paragraph(
            "1. Security Intelligence Summary",
            heading_style
        )
    )


    summary_data = [
        ["Metric", "Value"],

        ["Total Records", str(total_records)],

        ["Total Threats", str(total_threats)],

        ["Benign Records", str(total_benign)],

        [
            "Threat Percentage",
            f"{threat_percentage:.2f}%"
        ],

        [
            "Benign Percentage",
            f"{benign_percentage:.2f}%"
        ],

        [
            "Average AI Confidence",
            f"{average_confidence:.2f}%"
        ],

        [
            "Security Alerts",
            str(len(alerts))
        ],

        [
            "Security Incidents",
            str(len(incidents))
        ],

        [
            "PCAP Analyses",
            str(len(pcap_analyses))
        ],
    ]


    summary_table = Table(
        summary_data,
        colWidths=[90 * mm, 60 * mm]
    )


    summary_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#2563eb")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(summary_table)


    # ==========================================================
    # ATTACK DISTRIBUTION
    # ==========================================================

    story.append(
        Paragraph(
            "2. Threat and Attack Intelligence",
            heading_style
        )
    )


    attack_data = [
        ["Attack Type", "Count"]
    ]


    for attack, count in attack_distribution.items():

        attack_data.append([
            attack,
            str(count)
        ])


    if len(attack_data) == 1:

        attack_data.append([
            "No attack types detected",
            "0"
        ])


    attack_table = Table(
        attack_data,
        colWidths=[100 * mm, 50 * mm]
    )


    attack_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#dc2626")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(attack_table)


    # ==========================================================
    # DATASET DISTRIBUTION
    # ==========================================================

    story.append(
        Paragraph(
            "Dataset Distribution",
            heading_style
        )
    )


    dataset_data = [
        ["Dataset", "Records"]
    ]


    for dataset, count in dataset_distribution.items():

        dataset_data.append([
            dataset,
            str(count)
        ])


    dataset_table = Table(
        dataset_data,
        colWidths=[100 * mm, 50 * mm]
    )


    dataset_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#7c3aed")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(dataset_table)


    # ==========================================================
    # ALERT INTELLIGENCE
    # ==========================================================

    story.append(
        Paragraph(
            "3. Alert Intelligence",
            heading_style
        )
    )


    alert_data = [
        ["Severity", "Count"]
    ]


    for severity, count in alert_severity_distribution.items():

        alert_data.append([
            severity,
            str(count)
        ])


    if len(alert_data) == 1:

        alert_data.append([
            "No alerts",
            "0"
        ])


    alert_table = Table(
        alert_data,
        colWidths=[100 * mm, 50 * mm]
    )


    alert_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#f59e0b")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(alert_table)


    # ==========================================================
    # INCIDENT INTELLIGENCE
    # ==========================================================

    story.append(
        Paragraph(
            "4. Incident Intelligence",
            heading_style
        )
    )


    incident_data = [
        ["Status", "Count"]
    ]


    for status, count in incident_status_distribution.items():

        incident_data.append([
            status,
            str(count)
        ])


    if len(incident_data) == 1:

        incident_data.append([
            "No incidents",
            "0"
        ])


    incident_table = Table(
        incident_data,
        colWidths=[100 * mm, 50 * mm]
    )


    incident_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#0891b2")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(incident_table)


    # ==========================================================
    # NETWORK INTELLIGENCE
    # ==========================================================

    story.append(
        Paragraph(
            "5. Network and PCAP Intelligence",
            heading_style
        )
    )


    network_data = [
        ["Network Metric", "Value"],

        [
            "PCAP Analyses",
            str(len(pcap_analyses))
        ],

        [
            "Total Packets",
            f"{total_pcap_packets:,}"
        ],

        [
            "Total Bytes",
            f"{total_pcap_bytes:,}"
        ],

        [
            "TCP Packets",
            f"{tcp_packets:,}"
        ],

        [
            "UDP Packets",
            f"{udp_packets:,}"
        ],

        [
            "ICMP Packets",
            f"{icmp_packets:,}"
        ],
    ]


    network_table = Table(
        network_data,
        colWidths=[100 * mm, 50 * mm]
    )


    network_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#059669")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(network_table)


    # ==========================================================
    # PROTOCOL DISTRIBUTION
    # ==========================================================

    story.append(
        Paragraph(
            "Protocol Distribution",
            heading_style
        )
    )


    protocol_data = [
        ["Protocol", "Packets"]
    ]


    for protocol, count in protocol_distribution.items():

        protocol_data.append([
            protocol,
            f"{count:,}"
        ])


    protocol_table = Table(
        protocol_data,
        colWidths=[100 * mm, 50 * mm]
    )


    protocol_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#475569")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(protocol_table)


    # ==========================================================
    # SOURCE IPs
    # ==========================================================

    story.append(
        Paragraph(
            "6. Top Source IP Addresses",
            heading_style
        )
    )


    source_data = [
        ["Source IP", "Packet Count"]
    ]


    for ip, count in source_ips.items():

        source_data.append([
            ip,
            f"{count:,}"
        ])


    source_table = Table(
        source_data,
        colWidths=[100 * mm, 50 * mm]
    )


    source_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#334155")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(source_table)


    # ==========================================================
    # DESTINATION IPs
    # ==========================================================

    story.append(
        Paragraph(
            "7. Top Destination IP Addresses",
            heading_style
        )
    )


    destination_data = [
        ["Destination IP", "Packet Count"]
    ]


    for ip, count in destination_ips.items():

        destination_data.append([
            ip,
            f"{count:,}"
        ])


    destination_table = Table(
        destination_data,
        colWidths=[100 * mm, 50 * mm]
    )


    destination_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#334155")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )


    story.append(destination_table)


    # ==========================================================
    # RECOMMENDATIONS
    # ==========================================================

    story.append(
        Paragraph(
            "8. Security Recommendations",
            heading_style
        )
    )


    recommendations = []


    if total_threats > 0:

        recommendations.append(
            "Investigate detected threat records and review "
            "their associated network activity."
        )

        recommendations.append(
            "Review source and destination IP addresses "
            "associated with detected threats."
        )

    else:

        recommendations.append(
            "No active threats were detected in the "
            "currently analyzed prediction records."
        )


    if len(alerts) > 0:

        recommendations.append(
            "Review security alerts according to severity "
            "and investigate unresolved alerts."
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


    for index, recommendation in enumerate(
        recommendations,
        start=1
    ):

        story.append(
            Paragraph(
                f"{index}. {recommendation}",
                normal_style
            )
        )

        story.append(
            Spacer(1, 5)
        )


    # ==========================================================
    # FOOTER
    # ==========================================================

    def add_footer(canvas, doc):

        canvas.saveState()

        canvas.setFont(
            "Helvetica",
            8
        )

        canvas.drawString(
            18 * mm,
            10 * mm,
            "NetShield AI - Threat Intelligence Report"
        )

        canvas.drawRightString(
            A4[0] - 18 * mm,
            10 * mm,
            f"Page {doc.page}"
        )

        canvas.restoreState()


    document.build(
        story,
        onFirstPage=add_footer,
        onLaterPages=add_footer
    )


    buffer.seek(0)

    return buffer


# ==============================================================
# PDF DOWNLOAD ENDPOINT
# ==============================================================

@router.get("/threat-intelligence/pdf")
def download_threat_intelligence_pdf():

    try:

        pdf_file = build_pdf()

        return StreamingResponse(
            pdf_file,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    "attachment; filename=NetShield_AI_Threat_Intelligence_Report.pdf"
            }
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(e)}"
        )