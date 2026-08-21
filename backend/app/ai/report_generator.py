from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import os


def generate_pdf_report(alert):
    """
    Generate a PDF security incident report
    from a MongoDB alert.
    """

    reports_folder = "reports"

    # Create reports folder if it doesn't exist
    os.makedirs(reports_folder, exist_ok=True)

    alert_id = str(alert.get("_id", "unknown"))

    file_path = os.path.join(
        reports_folder,
        f"security_report_{alert_id}.pdf"
    )

    # Create PDF
    document = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    normal_style = styles["BodyText"]

    content = []

    # Title
    content.append(
        Paragraph(
            "NetShield AI - Security Incident Report",
            title_style
        )
    )

    content.append(Spacer(1, 20))

    # Report information
    content.append(
        Paragraph(
            f"<b>Alert ID:</b> {alert_id}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Generated:</b> "
            f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            normal_style
        )
    )

    content.append(Spacer(1, 15))

    # Threat Summary
    content.append(
        Paragraph(
            "Threat Summary",
            heading_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Threat Type:</b> "
            f"{alert.get('threat_type', 'Unknown')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Severity:</b> "
            f"{alert.get('severity', 'Unknown')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Confidence:</b> "
            f"{alert.get('confidence', '0%')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Risk Score:</b> "
            f"{alert.get('risk_score', 0)}/100",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Status:</b> "
            f"{alert.get('status', 'Unknown')}",
            normal_style
        )
    )

    content.append(Spacer(1, 15))

    # Network Details
    content.append(
        Paragraph(
            "Network Details",
            heading_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Packet Size:</b> "
            f"{alert.get('packet_size', 0)}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Duration:</b> "
            f"{alert.get('duration', 0)}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Connection Count:</b> "
            f"{alert.get('connection_count', 0)}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Source Port:</b> "
            f"{alert.get('source_port', '--')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Destination Port:</b> "
            f"{alert.get('destination_port', '--')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Protocol:</b> "
            f"{alert.get('protocol_type', '--')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Service:</b> "
            f"{alert.get('service', '--')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Flag:</b> "
            f"{alert.get('flag', '--')}",
            normal_style
        )
    )

    content.append(Spacer(1, 15))

    # AI Recommendation
    content.append(
        Paragraph(
            "AI Security Recommendation",
            heading_style
        )
    )

    investigation = alert.get(
        "investigation",
        {}
    )

    content.append(
        Paragraph(
            f"<b>Priority:</b> "
            f"{investigation.get('priority', 'Normal')}",
            normal_style
        )
    )

    content.append(
        Paragraph(
            f"<b>Recommendation:</b> "
            f"{investigation.get('recommendation', 'No immediate action required.')}",
            normal_style
        )
    )

    content.append(Spacer(1, 20))

    content.append(
        Paragraph(
            "Generated automatically by NetShield AI.",
            normal_style
        )
    )

    document.build(content)

    return file_path