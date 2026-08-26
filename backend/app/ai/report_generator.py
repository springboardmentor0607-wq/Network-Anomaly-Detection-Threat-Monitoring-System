from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import os


def generate_pdf_report(alert):
    """
    Generate a professional PDF security incident report
    from a MongoDB alert.
    """

    # --------------------------------------------------
    # Reports folder
    # --------------------------------------------------

    reports_folder = "reports"
    os.makedirs(reports_folder, exist_ok=True)

    # --------------------------------------------------
    # Alert ID
    # --------------------------------------------------

    alert_id = str(alert.get("_id", "unknown"))

    file_path = os.path.join(
        reports_folder,
        f"security_report_{alert_id}.pdf"
    )

    # --------------------------------------------------
    # Create PDF document
    # --------------------------------------------------

    document = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    # --------------------------------------------------
    # Styles
    # --------------------------------------------------

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=20,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=10,
        spaceAfter=20
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        spaceBefore=10,
        spaceAfter=8
    )

    normal_style = ParagraphStyle(
        "NormalText",
        parent=styles["BodyText"],
        fontSize=10,
        leading=15
    )

    # --------------------------------------------------
    # Content
    # --------------------------------------------------

    content = []

    # --------------------------------------------------
    # TITLE
    # --------------------------------------------------

    content.append(
        Paragraph(
            "NetShield AI",
            title_style
        )
    )

    content.append(
        Paragraph(
            "Security Incident Report",
            subtitle_style
        )
    )

    # --------------------------------------------------
    # REPORT INFORMATION
    # --------------------------------------------------

    content.append(
        Paragraph(
            "Report Information",
            heading_style
        )
    )

    report_info = [
        ["Alert ID", alert_id],
        [
            "Generated",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ],
        [
            "Source",
            alert.get("source", "Live Network Monitor")
        ],
        [
            "Detection Time",
            str(alert.get("timestamp", "Unknown"))
        ]
    ]

    report_table = Table(
        report_info,
        colWidths=[130, 350]
    )

    report_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 7)
        ])
    )

    content.append(report_table)

    # --------------------------------------------------
    # THREAT SUMMARY
    # --------------------------------------------------

    content.append(
        Paragraph(
            "Threat Summary",
            heading_style
        )
    )

    threat_summary = [
        ["Threat Type", str(alert.get("threat_type", "Unknown"))],
        ["Severity", str(alert.get("severity", "Unknown"))],
        ["Confidence", str(alert.get("confidence", "0%"))],
        [
            "Risk Score",
            f"{alert.get('risk_score', 0)}/100"
        ],
        ["Status", str(alert.get("status", "Unknown"))],
        [
            "Workflow Status",
            str(alert.get("workflow_status", "New"))
        ]
    ]

    threat_table = Table(
        threat_summary,
        colWidths=[150, 330]
    )

    threat_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "TOP")
        ])
    )

    content.append(threat_table)

    # --------------------------------------------------
    # NETWORK TELEMETRY
    # --------------------------------------------------

    content.append(
        Paragraph(
            "Network Telemetry",
            heading_style
        )
    )

    network_details = [
        [
            "Packet Size",
            f"{alert.get('packet_size', 0)} bytes"
        ],
        [
            "Duration",
            f"{alert.get('duration', 0)} sec"
        ],
        [
            "Connection Count",
            str(alert.get("connection_count", 0))
        ],
        [
            "Source Port",
            str(alert.get("source_port", "--"))
        ],
        [
            "Destination Port",
            str(alert.get("destination_port", "--"))
        ],
        [
            "Protocol",
            str(alert.get("protocol_type", "--"))
        ],
        [
            "Service",
            str(alert.get("service", "--"))
        ],
        [
            "Connection Flag",
            str(alert.get("flag", "--"))
        ]
    ]

    network_table = Table(
        network_details,
        colWidths=[150, 330]
    )

    network_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "TOP")
        ])
    )

    content.append(network_table)

    # --------------------------------------------------
    # IP INFORMATION
    # --------------------------------------------------

    source_ip = alert.get("source_ip")
    destination_ip = alert.get("destination_ip")

    if source_ip or destination_ip:

        content.append(
            Paragraph(
                "Network Addresses",
                heading_style
            )
        )

        ip_details = [
            [
                "Source IP",
                str(source_ip or "--")
            ],
            [
                "Destination IP",
                str(destination_ip or "--")
            ]
        ]

        ip_table = Table(
            ip_details,
            colWidths=[150, 330]
        )

        ip_table.setStyle(
            TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 7)
            ])
        )

        content.append(ip_table)

    # --------------------------------------------------
    # AI ASSESSMENT
    # --------------------------------------------------

    content.append(
        Paragraph(
            "AI Security Assessment",
            heading_style
        )
    )

    investigation = alert.get(
        "investigation",
            {}
        )

    priority = investigation.get(
        "priority",
        "Critical" if alert.get("severity") == "Critical" else "Normal"
    )

    recommendation = investigation.get(
        "recommendation",
        "Investigate the detected network activity and monitor "
        "related connections for further suspicious behavior."
    )

    ai_details = [
        ["Detection Model", "Random Forest"],
        [
            "Threat Type",
            str(alert.get("threat_type", "Unknown"))
        ],
        [
            "Severity",
            str(alert.get("severity", "Unknown"))
        ],
        [
            "AI Confidence",
            str(alert.get("confidence", "0%"))
        ],
        [
            "Risk Score",
            f"{alert.get('risk_score', 0)}/100"
        ],
        [
            "Priority",
            str(priority)
        ]
    ]

    ai_table = Table(
        ai_details,
        colWidths=[150, 330]
    )

    ai_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("PADDING", (0, 0), (-1, -1), 7)
        ])
    )

    content.append(ai_table)

    content.append(Spacer(1, 10))

    content.append(
        Paragraph(
            f"<b>Security Recommendation:</b> {recommendation}",
            normal_style
        )
    )

    # --------------------------------------------------
    # INCIDENT MANAGEMENT
    # --------------------------------------------------

    content.append(
        Paragraph(
            "Incident Management",
            heading_style
        )
    )

    workflow_status = alert.get(
        "workflow_status",
        "New"
    )

    incident_text = (
        f"<b>Current Workflow Status:</b> {workflow_status}<br/>"
        f"<b>Incident Source:</b> "
        f"{alert.get('source', 'Live Network Monitor')}<br/>"
        f"<b>Incident Status:</b> "
        f"{alert.get('status', 'Unknown')}"
    )

    content.append(
        Paragraph(
            incident_text,
            normal_style
        )
    )

    # --------------------------------------------------
    # FOOTER
    # --------------------------------------------------

    content.append(Spacer(1, 25))

    content.append(
        Paragraph(
            "This report was generated automatically by "
            "NetShield AI - AI-Powered Network Anomaly Detection.",
            normal_style
        )
    )

    # --------------------------------------------------
    # BUILD PDF
    # --------------------------------------------------

    document.build(content)

    return file_path