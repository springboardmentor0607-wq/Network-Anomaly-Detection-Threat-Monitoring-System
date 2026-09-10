import math
import random
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import HTTPException, status
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.traffic import TrafficFlow
from app.models.user import User
from app.models.audit_log import AuditLog
from app.services.risk_service import RiskService
from app.schemas.alert import AlertResponse, AlertListResponse

class AlertService:
    @staticmethod
    def evaluate_flow_rules_and_generate_alerts(db: Session) -> int:
        # Find flows that don't have alerts generated yet
        flows = db.query(TrafficFlow).filter(~TrafficFlow.alerts.any()).all()

        alert_count = 0
        for flow in flows:
            # Ensure risk and anomaly models evaluated flow
            risk_obj = db.query(flow.risk_scores.property.mapper.class_).filter_by(flow_id=flow.id).first() if hasattr(flow, 'risk_scores') else None

            # Calculate risk if not present
            if not flow.risk_scores:
                risk_obj = RiskService.evaluate_and_persist_flow_risk(db, flow)
            else:
                risk_obj = flow.risk_scores[0]

            score = risk_obj.score
            anomaly_score = flow.anomalies[0].anomaly_score if flow.anomalies else 0.0
            predicted_class = flow.predictions[0].predicted_class if flow.predictions else "BENIGN"

            # Alert Generation Rule: RiskScore >= 60 OR AnomalyScore >= 0.75
            if score >= 60 or anomaly_score >= 0.75:
                count_total = db.query(Alert).count() + 1
                alert_id_str = f"ALT-2026-{count_total:04d}"

                if score >= 80:
                    sev = AlertSeverity.CRITICAL
                elif score >= 60:
                    sev = AlertSeverity.HIGH
                elif score >= 30:
                    sev = AlertSeverity.MEDIUM
                else:
                    sev = AlertSeverity.LOW

                alert_title = f"Potential {predicted_class} Attack Detected" if predicted_class.upper() != "BENIGN" else "High Anomaly Flow Deviation"

                alert = Alert(
                    alert_id=alert_id_str,
                    title=alert_title,
                    alert_type=predicted_class,
                    severity=sev,
                    status=AlertStatus.NEW,
                    risk_score=score,
                    flow_id=flow.id,
                    notes=f"Auto-generated alert by Alert Rules Engine. Risk score: {score}/100, Anomaly score: {anomaly_score}."
                )
                db.add(alert)
                alert_count += 1

        if alert_count > 0:
            db.commit()

        return alert_count

    @staticmethod
    def get_paginated_alerts(
        db: Session,
        page: int = 1,
        page_size: int = 10,
        status_filter: Optional[str] = None,
        severity_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> AlertListResponse:
        # Trigger rules engine for any unassigned flows
        AlertService.evaluate_flow_rules_and_generate_alerts(db)

        query = db.query(Alert).join(TrafficFlow)

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Alert.status == status_filter.upper())

        if severity_filter and severity_filter.upper() != "ALL":
            query = query.filter(Alert.severity == severity_filter.upper())

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (Alert.alert_id.ilike(pattern)) |
                (Alert.title.ilike(pattern)) |
                (TrafficFlow.source_ip.ilike(pattern)) |
                (TrafficFlow.destination_ip.ilike(pattern))
            )

        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        new_count = db.query(Alert).filter(Alert.status == AlertStatus.NEW).count()
        critical_count = db.query(Alert).filter(Alert.severity == AlertSeverity.CRITICAL).count()

        offset = (page - 1) * page_size
        items = query.order_by(desc(Alert.created_at)).offset(offset).limit(page_size).all()

        return AlertListResponse(
            items=[AlertResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            new_alerts_count=new_count,
            critical_alerts_count=critical_count
        )

    @staticmethod
    def acknowledge_alert(db: Session, alert: Alert, user: User) -> Alert:
        alert.status = AlertStatus.ACKNOWLEDGED
        if not alert.assigned_to_id:
            alert.assigned_to_id = user.id

        audit = AuditLog(
            user_email=user.email,
            action="ALERT_ACKNOWLEDGE",
            resource=f"ALERT:{alert.alert_id}",
            status_result="SUCCESS",
            details={"status": AlertStatus.ACKNOWLEDGED.value}
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def assign_alert(db: Session, alert: Alert, assignee: User, current_user: User) -> Alert:
        alert.assigned_to_id = assignee.id
        if alert.status == AlertStatus.NEW:
            alert.status = AlertStatus.INVESTIGATING

        audit = AuditLog(
            user_email=current_user.email,
            action="ALERT_ASSIGN",
            resource=f"ALERT:{alert.alert_id}",
            status_result="SUCCESS",
            details={"assigned_to": assignee.email}
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert: Alert, user: User, notes: Optional[str] = None) -> Alert:
        alert.status = AlertStatus.RESOLVED
        if notes:
            alert.notes = f"{alert.notes or ''}\n[RESOLVED by {user.email}]: {notes}"

        audit = AuditLog(
            user_email=user.email,
            action="ALERT_RESOLVE",
            resource=f"ALERT:{alert.alert_id}",
            status_result="SUCCESS",
            details={"status": AlertStatus.RESOLVED.value, "notes": notes}
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def mark_false_positive(db: Session, alert: Alert, user: User, notes: Optional[str] = None) -> Alert:
        alert.status = AlertStatus.FALSE_POSITIVE
        if notes:
            alert.notes = f"{alert.notes or ''}\n[FALSE_POSITIVE by {user.email}]: {notes}"

        audit = AuditLog(
            user_email=user.email,
            action="ALERT_FALSE_POSITIVE",
            resource=f"ALERT:{alert.alert_id}",
            status_result="SUCCESS",
            details={"status": AlertStatus.FALSE_POSITIVE.value, "reason": notes}
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert
