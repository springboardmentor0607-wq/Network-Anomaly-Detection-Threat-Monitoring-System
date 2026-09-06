import csv
import io
import datetime
from typing import Any, Dict, List, Optional

from app.services.threat_analytics_service import compute_threat_intelligence_analytics


def load_real_model_metrics() -> Dict[str, Any]:
    """Load empirical model evaluation metrics from backend/reports/metrics.json."""
    from pathlib import Path
    import json
    metrics_path = Path(__file__).resolve().parent.parent.parent / "reports" / "metrics.json"
    if metrics_path.exists():
        try:
            with open(metrics_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["status"] = "Optimal"
                return data
        except Exception:
            pass
    return {
        "accuracy": 0.0,
        "precision": 0.0,
        "recall": 0.0,
        "f1_score": 0.0,
        "roc_auc": 0.0,
        "detection_rate": 0.0,
        "false_positive_rate": 0.0,
        "status": "Unverified"
    }


async def generate_report_data(db=None) -> Dict[str, Any]:
    """Fetch complete analytics and model performance metrics for report generation."""
    analytics = await compute_threat_intelligence_analytics(db=db)
    model_metrics = load_real_model_metrics()

    # Calculate actual average confidence from the alerts list
    timeline = analytics.get("detection_timeline", [])
    confidences = [float(ev.get("confidence", 0)) for ev in timeline if ev.get("confidence") is not None]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
    model_metrics["average_confidence"] = avg_conf

    return {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "kpis": analytics.get("kpis", {}),
        "model_metrics": model_metrics,
        "attack_distribution": analytics.get("attack_distribution", []),
        "risk_score_distribution": analytics.get("risk_score_distribution", []),
        "timeline": timeline
    }


# ─────────────────────────────────────────────────────────────────────────────
# Milestone 3 Operational Report Generators
# ─────────────────────────────────────────────────────────────────────────────

async def generate_executive_summary(db) -> Dict[str, Any]:
    """
    Generate an executive summary report from live MongoDB data.
    Includes alert counts, attack distribution, severity breakdown, and incident summary.
    Admin-only view.
    """
    generated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # --- Alerts stats ---
    total_alerts = await db["alerts"].count_documents({})
    total_threats = await db["alerts"].count_documents({"attack_type": {"$ne": "Benign"}})

    # Severity distribution
    severity_pipeline = [
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    severity_cursor = db["alerts"].aggregate(severity_pipeline)
    severity_distribution = []
    critical_high_count = 0
    async for doc in severity_cursor:
        sev = doc.get("_id") or "Unknown"
        cnt = doc.get("count", 0)
        severity_distribution.append({"severity": sev, "count": cnt})
        if sev in ("Critical", "High"):
            critical_high_count += cnt

    # Attack type distribution
    attack_pipeline = [
        {"$match": {"attack_type": {"$ne": "Benign"}}},
        {"$group": {"_id": "$attack_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    attack_cursor = db["alerts"].aggregate(attack_pipeline)
    attack_distribution = []
    async for doc in attack_cursor:
        attack_distribution.append({"attack_type": doc.get("_id") or "Unknown", "count": doc.get("count", 0)})

    # Average risk score
    risk_pipeline = [{"$group": {"_id": None, "avg_risk": {"$avg": "$risk_score"}}}]
    risk_cursor = db["alerts"].aggregate(risk_pipeline)
    avg_risk_score = 0.0
    async for doc in risk_cursor:
        avg_risk_score = round(float(doc.get("avg_risk", 0.0)), 2)

    # Top attack vector
    top_attack = attack_distribution[0]["attack_type"] if attack_distribution else "N/A"

    # --- Incidents stats ---
    total_incidents = await db["incidents"].count_documents({})
    open_incidents = await db["incidents"].count_documents(
        {"status": {"$in": ["New", "In Progress", "Under Investigation"]}}
    )
    resolved_incidents = await db["incidents"].count_documents({"status": {"$in": ["Resolved", "Closed"]}})

    # Status breakdown
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    status_cursor = db["incidents"].aggregate(status_pipeline)
    incident_status_summary = []
    async for doc in status_cursor:
        incident_status_summary.append({"status": doc.get("_id") or "Unknown", "count": doc.get("count", 0)})

    # Recent 5 alerts as recent threat activity
    recent_alerts_cursor = db["alerts"].find(
        {"attack_type": {"$ne": "Benign"}},
        {"_id": 0, "alert_id": 1, "attack_type": 1, "severity": 1, "risk_score": 1,
         "source_ip": 1, "destination_ip": 1, "timestamp": 1},
    ).sort("timestamp", -1).limit(10)
    recent_threats = []
    async for doc in recent_alerts_cursor:
        recent_threats.append(doc)

    return {
        "generated_at": generated_at,
        "alerts": {
            "total_alerts": total_alerts,
            "total_threats_detected": total_threats,
            "avg_risk_score": avg_risk_score,
            "critical_high_count": critical_high_count,
            "top_attack_vector": top_attack,
        },
        "severity_distribution": severity_distribution,
        "attack_distribution": attack_distribution,
        "incidents": {
            "total_incidents": total_incidents,
            "open_incidents": open_incidents,
            "resolved_incidents": resolved_incidents,
        },
        "incident_status_summary": incident_status_summary,
        "recent_threat_activity": recent_threats,
    }


async def generate_threat_intelligence_report(
    db,
    user: Optional[Dict[str, Any]] = None,
    limit: int = 200,
) -> Dict[str, Any]:
    """
    Generate a threat intelligence report from alerts data.
    Administrators see all alerts.
    Analysts see only alerts related to their assigned incidents.
    """
    generated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user_role = str(user.get("role", "")).strip().lower().replace(" ", "_") if user else ""
    is_analyst = user_role == "security_analyst"

    alert_filter: Dict[str, Any] = {}

    if is_analyst:
        # Gather alert IDs linked to this analyst's incidents
        user_id = str(user.get("id") or user.get("_id") or "")
        user_email = str(user.get("email") or "").strip().lower()
        user_name = str(user.get("full_name") or "").strip()

        incident_filter: Dict[str, Any] = {
            "$or": [
                {"assigned_analyst_id": user_id},
            ]
        }
        if user_email:
            incident_filter["$or"].append({"assigned_analyst": user_email})
        if user_name:
            incident_filter["$or"].append({"assigned_analyst_name": user_name})

        incident_cursor = db["incidents"].find(incident_filter, {"alert_id": 1})
        alert_ids = []
        async for inc in incident_cursor:
            aid = inc.get("alert_id")
            if aid:
                alert_ids.append(aid)

        if not alert_ids:
            return {
                "generated_at": generated_at,
                "total_records": 0,
                "alerts": [],
                "note": "No alerts found for your assigned incidents.",
            }
        alert_filter = {"alert_id": {"$in": alert_ids}}

    cursor = db["alerts"].find(
        alert_filter,
        {
            "_id": 0, "alert_id": 1, "attack_type": 1, "severity": 1,
            "source_ip": 1, "destination_ip": 1, "risk_score": 1,
            "confidence": 1, "timestamp": 1, "status": 1, "protocol": 1,
        },
    ).sort("timestamp", -1).limit(limit)

    alerts = []
    async for doc in cursor:
        alerts.append(doc)

    return {
        "generated_at": generated_at,
        "total_records": len(alerts),
        "alerts": alerts,
    }


async def generate_incident_report(
    db,
    user: Optional[Dict[str, Any]] = None,
    limit: int = 200,
) -> Dict[str, Any]:
    """
    Generate an incident report.
    Administrators see all incidents.
    Analysts see only incidents assigned to them.
    """
    generated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    user_role = str(user.get("role", "")).strip().lower().replace(" ", "_") if user else ""
    is_analyst = user_role == "security_analyst"

    incident_filter: Dict[str, Any] = {}
    if is_analyst and user:
        user_id = str(user.get("id") or user.get("_id") or "")
        user_email = str(user.get("email") or "").strip().lower()
        user_name = str(user.get("full_name") or "").strip()
        or_conditions: List[Dict[str, Any]] = [{"assigned_analyst_id": user_id}]
        if user_email:
            or_conditions.append({"assigned_analyst": user_email})
        if user_name:
            or_conditions.append({"assigned_analyst_name": user_name})
        incident_filter = {"$or": or_conditions}

    cursor = db["incidents"].find(
        incident_filter,
        {"hashed_password": 0},
    ).sort("created_at", -1).limit(limit)

    incidents = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id", ""))
        incidents.append(doc)

    return {
        "generated_at": generated_at,
        "total_records": len(incidents),
        "incidents": incidents,
    }


async def generate_security_trends(db, days: int = 30) -> Dict[str, Any]:
    """
    Generate security trend data — daily and weekly attack counts.
    Groups alerts by date to show how threats change over time.
    """
    generated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
    cutoff_iso = cutoff.isoformat()

    # Daily attack counts
    daily_pipeline = [
        {"$match": {
            "attack_type": {"$ne": "Benign"},
            "timestamp": {"$gte": cutoff_iso},
        }},
        {"$addFields": {
            "date_str": {"$substr": ["$timestamp", 0, 10]},
        }},
        {"$group": {"_id": "$date_str", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    daily_cursor = db["alerts"].aggregate(daily_pipeline)
    daily_counts: List[Dict[str, Any]] = []
    async for doc in daily_cursor:
        daily_counts.append({"date": doc.get("_id"), "count": doc.get("count", 0)})

    # Weekly attack counts (group by week number of year)
    weekly: Dict[str, int] = {}
    for entry in daily_counts:
        try:
            dt = datetime.date.fromisoformat(entry["date"])
            year, week, _ = dt.isocalendar()
            week_label = f"{year}-W{week:02d}"
            weekly[week_label] = weekly.get(week_label, 0) + entry["count"]
        except Exception:
            pass
    weekly_counts = [{"week": k, "count": v} for k, v in sorted(weekly.items())]

    # Attack type trends by day
    type_pipeline = [
        {"$match": {
            "attack_type": {"$ne": "Benign"},
            "timestamp": {"$gte": cutoff_iso},
        }},
        {"$addFields": {"date_str": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {
            "_id": {"date": "$date_str", "attack_type": "$attack_type"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.date": 1}},
    ]
    type_cursor = db["alerts"].aggregate(type_pipeline)
    attack_type_trends: List[Dict[str, Any]] = []
    async for doc in type_cursor:
        attack_type_trends.append({
            "date": doc["_id"]["date"],
            "attack_type": doc["_id"]["attack_type"],
            "count": doc.get("count", 0),
        })

    # Severity trends by day
    sev_pipeline = [
        {"$match": {"timestamp": {"$gte": cutoff_iso}}},
        {"$addFields": {"date_str": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {
            "_id": {"date": "$date_str", "severity": "$severity"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.date": 1}},
    ]
    sev_cursor = db["alerts"].aggregate(sev_pipeline)
    severity_trends: List[Dict[str, Any]] = []
    async for doc in sev_cursor:
        severity_trends.append({
            "date": doc["_id"]["date"],
            "severity": doc["_id"]["severity"],
            "count": doc.get("count", 0),
        })

    return {
        "generated_at": generated_at,
        "period_days": days,
        "daily_attack_counts": daily_counts,
        "weekly_attack_counts": weekly_counts,
        "attack_type_trends": attack_type_trends,
        "severity_trends": severity_trends,
    }



def generate_threat_report_csv(report_data: Dict[str, Any]) -> str:
    """Generate CSV report content string."""
    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Executive Summary & KPIs
    writer.writerow(["=== NETSHIELD AI EXECUTIVE THREAT INTELLIGENCE REPORT ==="])
    writer.writerow(["Generated At", report_data.get("generated_at", "")])
    writer.writerow([])
    
    kpis = report_data.get("kpis", {})
    model = report_data.get("model_metrics", {})
    
    writer.writerow(["=== KEY METRICS & MODEL ACCURACY ==="])
    writer.writerow(["Total Attacks Detected", kpis.get("total_threats", 0)])
    writer.writerow(["Critical & High Risk Alerts", kpis.get("critical_high_count", 0)])
    writer.writerow(["Average Risk Score", kpis.get("avg_risk_score", 0)])
    writer.writerow(["Top Threat Vector", kpis.get("top_attack_vector", "N/A")])
    writer.writerow(["Active Incidents", kpis.get("active_incidents", 0)])
    writer.writerow(["AI Model Accuracy", f"{model.get('accuracy', 0.0) * 100:.4f}%" if 'accuracy' in model else "N/A"])
    writer.writerow(["Model Precision", f"{model.get('precision', 0.0) * 100:.4f}%" if 'precision' in model else "N/A"])
    writer.writerow(["Model Recall", f"{model.get('recall', 0.0) * 100:.4f}%" if 'recall' in model else "N/A"])
    writer.writerow(["Model F1-Score", f"{model.get('f1_score', 0.0) * 100:.4f}%" if 'f1_score' in model else "N/A"])
    writer.writerow(["ROC-AUC", f"{model.get('roc_auc', 0.0) * 100:.4f}%" if 'roc_auc' in model else "N/A"])
    writer.writerow(["Detection Rate", f"{model.get('detection_rate', 0.0) * 100:.4f}%" if 'detection_rate' in model else "N/A"])
    writer.writerow(["False Positive Rate", f"{model.get('false_positive_rate', 0.0) * 100:.4f}%" if 'false_positive_rate' in model else "N/A"])
    writer.writerow(["Average Alert Confidence", f"{model.get('average_confidence', 0.0) * 100:.2f}%" if 'average_confidence' in model else "N/A"])
    writer.writerow([])

    # 2. Threat Distribution
    writer.writerow(["=== THREAT CATEGORY DISTRIBUTION ==="])
    writer.writerow(["Attack Type", "Event Count", "Percentage (%)"])
    for item in report_data.get("attack_distribution", []):
        writer.writerow([item.get("attack_type"), item.get("count"), item.get("percentage")])
    writer.writerow([])

    # 3. Risk Score Distribution
    writer.writerow(["=== RISK SCORE BINNED DISTRIBUTION ==="])
    writer.writerow(["Risk Range", "Frequency Count"])
    for item in report_data.get("risk_score_distribution", []):
        writer.writerow([item.get("range"), item.get("count")])
    writer.writerow([])

    # 4. Attack Timeline
    writer.writerow(["=== DETAILED ATTACK TIMELINE ==="])
    writer.writerow(["Timestamp", "Alert ID", "Attack Type", "Severity", "Confidence", "Risk Score", "Source IP", "Destination IP", "Incident Status"])
    for event in report_data.get("timeline", []):
        conf_val = event.get("confidence", 0.9)
        conf_str = f"{conf_val * 100:.1f}%" if conf_val <= 1 else f"{conf_val}%"
        writer.writerow([
            event.get("timestamp"),
            event.get("alert_id"),
            event.get("attack_type"),
            event.get("severity"),
            conf_str,
            event.get("risk_score"),
            event.get("source_ip"),
            event.get("destination_ip"),
            event.get("incident_status", "Not Promoted")
        ])

    return output.getvalue()


def generate_threat_report_pdf(report_data: Dict[str, Any]) -> bytes:
    """Generate PDF report binary bytes using ReportLab."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError:
        raise RuntimeError("reportlab library is required for PDF generation")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e3a8a')
    )
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1e293b')
    )
    cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # Title Banner
    story.append(Paragraph("NetShield AI — Threat Intelligence Report", title_style))
    story.append(Spacer(1, 4))
    gen_time = report_data.get("generated_at", "")[:19].replace("T", " ")
    story.append(Paragraph(f"Executive Security & Model Analytics Summary | Generated At: {gen_time} UTC", subtitle_style))
    story.append(Spacer(1, 14))

    kpis = report_data.get("kpis", {})
    model = report_data.get("model_metrics", {})

    # 1. Executive Summary & KPIs Grid Table
    story.append(Paragraph("1. Executive Threat & AI Model Metrics", heading_style))
    story.append(Spacer(1, 6))

    kpi_table_data = [
        [
            Paragraph("Total Attacks Detected", cell_bold), Paragraph(str(kpis.get("total_threats", 0)), cell_style),
            Paragraph("AI Model Accuracy", cell_bold), Paragraph(f"{model.get('accuracy', 0.0)*100:.4f}%" if 'accuracy' in model else "N/A", cell_style)
        ],
        [
            Paragraph("Critical & High Risk", cell_bold), Paragraph(str(kpis.get("critical_high_count", 0)), cell_style),
            Paragraph("Model Precision", cell_bold), Paragraph(f"{model.get('precision', 0.0)*100:.4f}%" if 'precision' in model else "N/A", cell_style)
        ],
        [
            Paragraph("Average Risk Score", cell_bold), Paragraph(f"{kpis.get('avg_risk_score', 0)} / 100", cell_style),
            Paragraph("Model Recall", cell_bold), Paragraph(f"{model.get('recall', 0.0)*100:.4f}%" if 'recall' in model else "N/A", cell_style)
        ],
        [
            Paragraph("Top Attack Vector", cell_bold), Paragraph(str(kpis.get("top_attack_vector", "DDoS")), cell_style),
            Paragraph("Model F1-Score", cell_bold), Paragraph(f"{model.get('f1_score', 0.0)*100:.4f}%" if 'f1_score' in model else "N/A", cell_style)
        ],
        [
            Paragraph("Active Incidents", cell_bold), Paragraph(str(kpis.get("active_incidents", 0)), cell_style),
            Paragraph("ROC-AUC", cell_bold), Paragraph(f"{model.get('roc_auc', 0.0)*100:.4f}%" if 'roc_auc' in model else "N/A", cell_style)
        ],
        [
            Paragraph("Total Alerts Stored", cell_bold), Paragraph(str(kpis.get("total_alerts_stored", 0)), cell_style),
            Paragraph("Detection Rate", cell_bold), Paragraph(f"{model.get('detection_rate', 0.0)*100:.4f}%" if 'detection_rate' in model else "N/A", cell_style)
        ],
        [
            Paragraph("Average Alert Confidence", cell_bold), Paragraph(f"{model.get('average_confidence', 0.0)*100:.2f}%" if 'average_confidence' in model else "N/A", cell_style),
            Paragraph("False Positive Rate", cell_bold), Paragraph(f"{model.get('false_positive_rate', 0.0)*100:.4f}%" if 'false_positive_rate' in model else "N/A", cell_style)
        ]
    ]

    t_kpi = Table(kpi_table_data, colWidths=[130, 130, 130, 130])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 14))

    # 2. Threat & Risk Distribution Table
    story.append(Paragraph("2. Threat Category Breakdown", heading_style))
    story.append(Spacer(1, 6))

    dist_table_data = [[Paragraph("Attack Type", cell_bold), Paragraph("Event Count", cell_bold), Paragraph("Percentage", cell_bold)]]
    for d in report_data.get("attack_distribution", []):
        dist_table_data.append([
            Paragraph(str(d.get("attack_type")), cell_style),
            Paragraph(str(d.get("count")), cell_style),
            Paragraph(f"{d.get('percentage')}%", cell_style)
        ])

    t_dist = Table(dist_table_data, colWidths=[200, 160, 160])
    t_dist.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_dist)
    story.append(Spacer(1, 14))

    # 3. Detection Timeline Stream
    story.append(Paragraph("3. Recent Detection Timeline", heading_style))
    story.append(Spacer(1, 6))

    timeline_data = [[
        Paragraph("Timestamp", cell_bold),
        Paragraph("Alert ID", cell_bold),
        Paragraph("Attack Type", cell_bold),
        Paragraph("Severity", cell_bold),
        Paragraph("Risk Score", cell_bold),
        Paragraph("Source IP", cell_bold),
        Paragraph("Incident Status", cell_bold)
    ]]

    for ev in report_data.get("timeline", [])[:15]:
        ts_str = str(ev.get("timestamp"))[:19].replace("T", " ")
        timeline_data.append([
            Paragraph(ts_str, cell_style),
            Paragraph(str(ev.get("alert_id")), cell_bold),
            Paragraph(str(ev.get("attack_type")), cell_style),
            Paragraph(str(ev.get("severity")), cell_style),
            Paragraph(str(ev.get("risk_score")), cell_style),
            Paragraph(str(ev.get("source_ip")), cell_style),
            Paragraph(str(ev.get("incident_status", "Not Promoted")), cell_style)
        ])

    t_timeline = Table(timeline_data, colWidths=[90, 70, 90, 55, 50, 90, 95])
    t_timeline.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_timeline)

    doc.build(story)
    return buffer.getvalue()
