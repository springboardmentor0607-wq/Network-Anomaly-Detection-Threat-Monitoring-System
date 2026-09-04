import io
import csv
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from ..database.connection import get_db
from ..database.models import (
    Alert, Notification, Incident, IncidentAuditLog,
    IncidentNoteRecord, ThreatIndicator
)
from ..schemas.schemas import (
    IncidentCreateRequest, IncidentStateTransitionRequest, IncidentNoteRequest
)

router = APIRouter(prefix="/api", tags=["Milestone 3 SOC Operations"])

STRICT_STATE_TRANSITIONS = {
    "OPEN": ["ACKNOWLEDGED"],
    "ACKNOWLEDGED": ["INVESTIGATING"],
    "INVESTIGATING": ["CONTAINED"],
    "CONTAINED": ["RESOLVED"],
    "RESOLVED": ["CLOSED"],
    "CLOSED": []
}


@router.get("/alerts")
def get_alerts(
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity and severity != "All":
        query = query.filter(Alert.severity == severity.upper())
    if status_filter and status_filter != "All":
        query = query.filter(Alert.status == status_filter.upper())
    if search:
        term = f"%{search}%"
        query = query.filter((Alert.source_ip.like(term)) | (Alert.attack_type.like(term)))

    total = query.count()
    alerts = query.order_by(desc(Alert.last_seen)).offset((page - 1) * limit).limit(limit).all()

    counts = {
        "total": db.query(Alert).count(),
        "critical": db.query(Alert).filter(Alert.severity == "CRITICAL").count(),
        "high": db.query(Alert).filter(Alert.severity == "HIGH").count(),
        "medium": db.query(Alert).filter(Alert.severity == "MEDIUM").count(),
        "low": db.query(Alert).filter(Alert.severity == "LOW").count(),
        "unresolved": db.query(Alert).filter(Alert.status.notin_(["RESOLVED", "CLOSED"])).count(),
        "resolved": db.query(Alert).filter(Alert.status.in_(["RESOLVED", "CLOSED"])).count()
    }

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "alerts": [{
            "id": a.id,
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "first_seen": a.first_seen.strftime("%Y-%m-%d %H:%M:%S") if a.first_seen else None,
            "last_seen": a.last_seen.strftime("%Y-%m-%d %H:%M:%S") if a.last_seen else None,
            "source_ip": a.source_ip,
            "destination_ip": a.destination_ip,
            "target_port": a.target_port,
            "protocol": a.protocol,
            "attack_type": a.attack_type,
            "severity": a.severity,
            "risk_score": a.risk_score,
            "confidence": a.confidence,
            "occurrences": a.occurrences,
            "status": a.status,
            "recommended_action": a.recommended_action
        } for a in alerts],
        "stats": counts
    }


@router.get("/notifications")
def list_notifications(db: Session = Depends(get_db)):
    notifications = db.query(Notification).order_by(desc(Notification.timestamp)).limit(50).all()
    unread_count = db.query(Notification).filter(Notification.is_read == False).count()
    return {
        "unread_count": unread_count,
        "notifications": [{
            "id": n.id,
            "alert_id": n.alert_id,
            "title": n.title,
            "message": n.message,
            "severity": n.severity,
            "source_ip": n.source_ip,
            "attack_type": n.attack_type,
            "risk_score": n.risk_score,
            "is_read": n.is_read,
            "timestamp": n.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        } for n in notifications]
    }


@router.get("/notifications/unread-count")
def get_unread_count(db: Session = Depends(get_db)):
    return {"unread_count": db.query(Notification).filter(Notification.is_read == False).count()}


@router.put("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/incidents")
def list_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(desc(Incident.created_at)).all()
    return [{
        "id": i.id,
        "incident_id": i.incident_id,
        "title": i.title,
        "severity": i.severity,
        "priority": i.priority,
        "status": i.status,
        "assigned_analyst": i.assigned_analyst,
        "linked_alert_id": i.linked_alert_id,
        "created_at": i.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "acknowledged_at": i.acknowledged_at.strftime("%Y-%m-%d %H:%M:%S") if i.acknowledged_at else None,
        "resolved_at": i.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if i.resolved_at else None,
        "audit_logs": [{
            "previous_state": l.previous_state,
            "new_state": l.new_state,
            "analyst": l.analyst,
            "action_note": l.action_note,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        } for l in i.audit_logs],
        "notes": [{
            "analyst": n.analyst,
            "note": n.note,
            "timestamp": n.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        } for n in i.notes]
    } for i in incidents]


@router.post("/incidents", status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreateRequest, db: Session = Depends(get_db)):
    count = db.query(Incident).count()
    inc_code = f"INC-{str(count + 1001).zfill(4)}"

    incident = Incident(
        incident_id=inc_code,
        title=payload.title,
        severity=payload.severity.upper(),
        priority=payload.priority or "P2 - High",
        status="OPEN",
        assigned_analyst=payload.analyst or "SOC Analyst",
        linked_alert_id=payload.alert_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(incident)
    db.flush()

    audit = IncidentAuditLog(
        incident_id=incident.id,
        previous_state="NONE",
        new_state="OPEN",
        analyst=payload.analyst or "SOC Analyst",
        action_note="Incident Escalation"
    )
    db.add(audit)
    db.commit()
    return {"message": "Incident created", "incident_id": inc_code, "id": incident.id}


@router.put("/incidents/{inc_id}/status")
def transition_incident(inc_id: int, payload: IncidentStateTransitionRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == inc_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")

    target_state = payload.new_state.upper()
    allowed_next = STRICT_STATE_TRANSITIONS.get(incident.status, [])

    if target_state not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Strict State Machine Violation: Cannot jump from {incident.status} to {target_state}. Required next state: {allowed_next[0] if allowed_next else 'None (Terminal)'}"
        )

    prev_state = incident.status
    incident.status = target_state
    incident.updated_at = datetime.utcnow()

    if target_state == "ACKNOWLEDGED" and not incident.acknowledged_at:
        incident.acknowledged_at = datetime.utcnow()
    if target_state in ["RESOLVED", "CLOSED"] and not incident.resolved_at:
        incident.resolved_at = datetime.utcnow()

    audit = IncidentAuditLog(
        incident_id=incident.id,
        previous_state=prev_state,
        new_state=target_state,
        analyst=payload.analyst or "SOC Analyst",
        action_note=payload.action_note or "State Transition"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Incident transitioned to {target_state}"}


@router.post("/incidents/{inc_id}/notes")
def add_incident_note(inc_id: int, payload: IncidentNoteRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == inc_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    note = IncidentNoteRecord(
        incident_id=incident.id,
        analyst=payload.analyst or "SOC Analyst",
        note=payload.note,
        timestamp=datetime.utcnow()
    )
    db.add(note)
    db.commit()
    return {"message": "Note recorded"}


@router.get("/threat-intelligence")
def list_threat_intel(db: Session = Depends(get_db)):
    indicators = db.query(ThreatIndicator).order_by(desc(ThreatIndicator.max_risk_score)).all()
    return [{
        "id": ind.id,
        "source_ip": ind.source_ip,
        "indicator_type": ind.indicator_type,
        "attack_vector": ind.attack_vector,
        "occurrence_count": ind.occurrence_count,
        "max_risk_score": ind.max_risk_score,
        "severity": ind.severity,
        "source": ind.source,
        "first_seen": ind.first_seen.strftime("%Y-%m-%d %H:%M:%S") if ind.first_seen else None,
        "last_seen": ind.last_seen.strftime("%Y-%m-%d %H:%M:%S") if ind.last_seen else None
    } for ind in indicators]


@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total_alerts = db.query(Alert).count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL").count()
    high_alerts = db.query(Alert).filter(Alert.severity == "HIGH").count()
    medium_alerts = db.query(Alert).filter(Alert.severity == "MEDIUM").count()
    low_alerts = db.query(Alert).filter(Alert.severity == "LOW").count()
    resolved_alerts = db.query(Alert).filter(Alert.status.in_(["RESOLVED", "CLOSED"])).count()
    unresolved_alerts = db.query(Alert).filter(Alert.status.notin_(["RESOLVED", "CLOSED"])).count()

    critical_rate = f"{((critical_alerts / total_alerts) * 100):.2f}%" if total_alerts > 0 else "0.00%"

    ack_incidents = db.query(Incident).filter(Incident.acknowledged_at.isnot(None)).all()
    if ack_incidents:
        total_mtta = sum((i.acknowledged_at - i.created_at).total_seconds() for i in ack_incidents)
        mtta_str = f"{round(total_mtta / len(ack_incidents) / 60.0, 1)} mins"
    else:
        mtta_str = "N/A"

    res_incidents = db.query(Incident).filter(Incident.resolved_at.isnot(None)).all()
    if res_incidents:
        total_mttr = sum((i.resolved_at - i.created_at).total_seconds() for i in res_incidents)
        mttr_str = f"{round(total_mttr / len(res_incidents) / 60.0, 1)} mins"
    else:
        mttr_str = "N/A"

    dist_rows = db.query(
        Alert.attack_type, func.sum(Alert.occurrences).label("hits")
    ).group_by(Alert.attack_type).all()
    attack_distribution = [{"attack_vector": r[0], "count": int(r[1])} for r in dist_rows]

    timeline_rows = db.query(
        func.strftime("%H:00", Alert.timestamp).label("hour"),
        func.sum(Alert.occurrences).label("total")
    ).group_by("hour").order_by("hour").all()
    timeline = [{"time": r[0], "total": int(r[1])} for r in timeline_rows]

    return {
        "mtta": mtta_str,
        "mttr": mttr_str,
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "high_alerts": high_alerts,
        "medium_alerts": medium_alerts,
        "low_alerts": low_alerts,
        "resolved_alerts": resolved_alerts,
        "unresolved_alerts": unresolved_alerts,
        "critical_alert_rate": critical_rate,
        "attack_distribution": attack_distribution,
        "timeline": timeline
    }


@router.get("/reports/json")
def export_report_json(db: Session = Depends(get_db)):
    summary = get_analytics_summary(db)
    top_sources = db.query(ThreatIndicator).order_by(desc(ThreatIndicator.max_risk_score)).limit(10).all()
    incidents = db.query(Incident).order_by(desc(Incident.created_at)).limit(20).all()

    return {
        "report_title": "NetShield AI - SOC Threat Analytics Report",
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "metrics_summary": summary,
        "top_threat_sources": [{
            "source_ip": t.source_ip,
            "attack_vector": t.attack_vector,
            "max_risk_score": t.max_risk_score,
            "severity": t.severity,
            "occurrence_count": t.occurrence_count
        } for t in top_sources],
        "recent_incidents": [{
            "incident_id": i.incident_id,
            "title": i.title,
            "severity": i.severity,
            "status": i.status,
            "created_at": i.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for i in incidents]
    }


@router.get("/reports/csv")
def export_report_csv(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(desc(Alert.last_seen)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Alert_ID", "Timestamp", "Source_IP", "Target_Port", "Protocol", "Attack_Type", "Severity", "Risk_Score", "Occurrences", "Status"])
    for a in alerts:
        writer.writerow([a.id, a.timestamp.strftime("%Y-%m-%d %H:%M:%S"), a.source_ip, a.target_port, a.protocol, a.attack_type, a.severity, a.risk_score, a.occurrences, a.status])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=netshield_soc_report.csv"}
    )


@router.get("/reports/pdf")
def export_report_pdf(db: Session = Depends(get_db)):
    summary = get_analytics_summary(db)
    alerts = db.query(Alert).order_by(desc(Alert.last_seen)).limit(15).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        name="TitleStyle",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=10
    )
    elements.append(Paragraph("NetShield AI — Executive SOC Security Report", title_style))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Platform: Enterprise SOC", styles["Normal"]))
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("<b>1. SOC Operations Summary (Real Metrics)</b>", styles["Heading2"]))
    metrics_data = [
        ["Metric", "Value", "Metric", "Value"],
        ["Total Alerts", str(summary["total_alerts"]), "Critical Alerts", str(summary["critical_alerts"])],
        ["Critical Rate", summary["critical_alert_rate"], "Resolved Alerts", str(summary["resolved_alerts"])],
        ["Mean Time to Acknowledge", summary["mtta"], "Mean Time to Resolve", summary["mttr"]]
    ]
    t1 = Table(metrics_data, colWidths=[135, 135, 135, 135])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t1)
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("<b>2. Recent Correlated Threat Alerts</b>", styles["Heading2"]))
    alert_headers = ["ID", "Timestamp", "Source IP", "Attack Type", "Severity", "Risk", "Hits"]
    alert_rows = [alert_headers]
    for a in alerts:
        alert_rows.append([
            str(a.id),
            a.timestamp.strftime("%m-%d %H:%M"),
            a.source_ip,
            a.attack_type,
            a.severity,
            f"{a.risk_score:.0f}",
            str(a.occurrences)
        ])
    t2 = Table(alert_rows, colWidths=[30, 85, 105, 110, 70, 45, 45])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t2)

    doc.build(elements)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=netshield_soc_report.pdf"}
    )
