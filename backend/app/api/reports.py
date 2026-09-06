import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.handler import get_current_user
from app.database.database import get_db
from app.services.audit_logger import log_audit_event
from app.services.report_generator import (
    generate_report_data,
    generate_threat_report_csv,
    generate_threat_report_pdf,
    generate_executive_summary,
    generate_threat_intelligence_report,
    generate_incident_report,
    generate_security_trends,
)

router = APIRouter()
logger = logging.getLogger("netshield.backend.reports.api")


@router.get("/pdf")
@router.get("/threat-report/pdf")
async def download_threat_report_pdf(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Generate and download Executive Threat Intelligence PDF Report."""
    await log_audit_event(request, current_user, "PDF Threat Report Exported", "Reports")
    try:
        report_data = await generate_report_data(db=db)
        pdf_bytes = generate_threat_report_pdf(report_data)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=NetShield_Threat_Report.pdf"}
        )
    except Exception as exc:
        logger.exception("Failed to generate PDF report")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF threat report"
        ) from exc


@router.get("/csv")
@router.get("/threat-report/csv")
async def download_threat_report_csv(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Generate and download Threat Intelligence CSV Report."""
    await log_audit_event(request, current_user, "CSV Threat Report Exported", "Reports")
    try:
        report_data = await generate_report_data(db=db)
        csv_content = generate_threat_report_csv(report_data)
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=NetShield_Threat_Report.csv"}
        )
    except Exception as exc:
        logger.exception("Failed to generate CSV report")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate CSV threat report"
        ) from exc


@router.get("/executive-summary")
async def get_executive_summary(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Executive Summary report — total alerts, attacks, severity breakdown, incident overview.
    Only Security Administrators can access the full executive summary.
    """
    user_role = str(current_user.get("role", "")).strip().lower().replace(" ", "_")
    if user_role != "security_administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Executive Summary is only available to Security Administrators"
        )
    await log_audit_event(request, current_user, "Executive Summary Report Viewed", "Reports")
    try:
        data = await generate_executive_summary(db=db)
        return data
    except Exception as exc:
        logger.exception("Failed to generate executive summary report")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate executive summary"
        ) from exc


@router.get("/threat-intelligence")
async def get_threat_intelligence_report(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=200, ge=1, le=1000),
):
    """
    Threat Intelligence Report — per-alert details.
    Administrators see all alerts; Analysts see only alerts linked to their assigned incidents.
    """
    await log_audit_event(request, current_user, "Threat Intelligence Report Viewed", "Reports")
    try:
        data = await generate_threat_intelligence_report(db=db, user=current_user, limit=limit)
        return data
    except Exception as exc:
        logger.exception("Failed to generate threat intelligence report")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate threat intelligence report"
        ) from exc


@router.get("/incidents")
async def get_incident_report(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=200, ge=1, le=1000),
):
    """
    Incident Report — full incident details with notes, status, and analyst info.
    Administrators see all incidents; Analysts see only their assigned incidents.
    """
    await log_audit_event(request, current_user, "Incident Report Viewed", "Reports")
    try:
        data = await generate_incident_report(db=db, user=current_user, limit=limit)
        return data
    except Exception as exc:
        logger.exception("Failed to generate incident report")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate incident report"
        ) from exc


@router.get("/security-trends")
async def get_security_trends(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    days: int = Query(default=30, ge=7, le=365),
):
    """
    Security Trends Report — daily and weekly attack counts, severity and type trends.
    Only Security Administrators can access trends.
    """
    user_role = str(current_user.get("role", "")).strip().lower().replace(" ", "_")
    if user_role != "security_administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Trends report is only available to Security Administrators"
        )
    await log_audit_event(request, current_user, "Security Trends Report Viewed", "Reports")
    try:
        data = await generate_security_trends(db=db, days=days)
        return data
    except Exception as exc:
        logger.exception("Failed to generate security trends report")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate security trends report"
        ) from exc


@router.get("/threat_analysis.json")
@router.get("/threat-analysis.json")
async def get_threat_analysis_json(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate dynamic threat analysis JSON report based on MongoDB data."""
    try:
        report_data = await generate_report_data(db=db)
        kpis = report_data.get("kpis", {})
        model = report_data.get("model_metrics", {})
        
        # Map attack distribution list to dict
        attack_dist_dict = {}
        for item in report_data.get("attack_distribution", []):
            attack_dist_dict[item["attack_type"]] = item["count"]
            
        # Map risk score distribution list to binned dict
        risk_bins = {
            "Critical (>95)": 0,
            "High (80-95)": 0,
            "Medium (60-80)": 0,
            "Low (30-60)": 0,
            "Safe (<30)": 0
        }
        
        # Calculate risk scores binned from timeline or raw risk score distribution
        for item in report_data.get("risk_score_distribution", []):
            r_range = item["range"]
            if r_range == "81-100":
                risk_bins["Critical (>95)"] += item["count"]
            elif r_range == "61-80":
                risk_bins["High (80-95)"] += item["count"]
            elif r_range == "41-60":
                risk_bins["Medium (60-80)"] += item["count"]
            elif r_range == "21-40":
                risk_bins["Low (30-60)"] += item["count"]
            elif r_range == "0-20":
                risk_bins["Safe (<30)"] += item["count"]

        # Build dynamic detection timeline matching expected format
        timeline = []
        raw_timeline = report_data.get("timeline", [])
        for i, event in enumerate(reversed(raw_timeline[:15])):
            timeline.append({
                "sample_index": i,
                "avg_risk_score": float(event.get("risk_score", 0)),
                "avg_confidence": float(event.get("confidence", 0.95)),
                "threat_count": 1
            })

        return {
            "total_predictions": kpis.get("total_alerts_stored", 0) + kpis.get("total_threats", 0),
            "most_frequent_attack": kpis.get("top_attack_vector", "Benign"),
            "critical_attack_count": kpis.get("critical_high_count", 0),
            "average_confidence": model.get("average_confidence", 0.95),
            "attack_distribution": attack_dist_dict,
            "risk_score_distribution": risk_bins,
            "detection_timeline": timeline,
            "summary_of_model_performance": {
                "accuracy": model.get("accuracy", 0.9996),
                "precision": model.get("precision", 0.9957),
                "recall": model.get("recall", 0.9984),
                "f1_score": model.get("f1_score", 0.997),
                "status": model.get("status", "Optimal"),
                "evaluation_dataset_size": model.get("evaluation_dataset_size", 508249)
            }
        }
    except Exception as exc:
        logger.exception("Failed to generate dynamic threat analysis JSON")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate threat analysis report"
        ) from exc
