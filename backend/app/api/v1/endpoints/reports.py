import uuid
import math
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Response, Query, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User
from app.core.permissions import require_roles, get_current_user
from app.models.role import RoleEnum
from io import BytesIO, StringIO
import csv

router = APIRouter(prefix="/reports", tags=["Reports"])

# ============ Schemas ============

class ReportResponse(BaseModel):
    id: str
    title: str
    type: str
    generated_at: datetime
    author: str
    total_threats_detected: int
    critical_incidents: int
    average_risk_score: float
    summary: str

class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# ============ Sample Reports Data ============

SAMPLE_REPORTS = [
    {
        "id": "RPT-2026-0810",
        "title": "Daily Executive Security Telemetry & Anomaly Briefing",
        "type": "DAILY",
        "generated_at": datetime.now() - timedelta(days=0),
        "author": "NetShield Automated Engine",
        "total_threats_detected": 142,
        "critical_incidents": 2,
        "average_risk_score": 34.2,
        "summary": "Over the past 24 hours, NetShield AI processed 4,892,100 network packets. 142 threat anomalies were flagged, primarily consisting of TCP SYN floods targeting edge API endpoints and automated SSH password spraying against internal jump hosts. Risk posture remains ELEVATED."
    },
    {
        "id": "RPT-2026-0803",
        "title": "Weekly Threat Intelligence & Intrusion Trends",
        "type": "WEEKLY",
        "generated_at": datetime.now() - timedelta(days=7),
        "author": "Sarah Connor (SOC Lead)",
        "total_threats_detected": 984,
        "critical_incidents": 9,
        "average_risk_score": 28.5,
        "summary": "Weekly analysis indicates a 14.2% increase in external reconnaissance scanning from known TOR exit nodes. All identified malicious IPs were automatically ingested into local firewall blocklists."
    },
    {
        "id": "RPT-2026-0731",
        "title": "Monthly AI Model Validation & False Positive Audit",
        "type": "MONTHLY",
        "generated_at": datetime.now() - timedelta(days=30),
        "author": "ML Ops Team",
        "total_threats_detected": 4120,
        "critical_incidents": 34,
        "average_risk_score": 31.0,
        "summary": "Monthly evaluation of XGBoost v2.4.1 classifier demonstrated 98.42% accuracy with a 1.2% false positive rate across CICIDS2017 validation holdout data."
    }
]

# ============ Endpoints ============

@router.get("", response_model=ReportListResponse)
def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    report_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST, RoleEnum.VIEWER]))
) -> Any:
    """List all reports with pagination and filtering"""
    reports = SAMPLE_REPORTS.copy()
    
    # Filter by type
    if report_type:
        reports = [r for r in reports if r["type"] == report_type.upper()]
    
    # Sort by date (newest first)
    reports.sort(key=lambda x: x["generated_at"], reverse=True)
    
    total = len(reports)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    offset = (page - 1) * page_size
    items = reports[offset:offset + page_size]
    
    return ReportListResponse(
        items=[ReportResponse(**item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST, RoleEnum.VIEWER]))
) -> Any:
    """Get report details"""
    for report in SAMPLE_REPORTS:
        if report["id"] == report_id:
            return ReportResponse(**report)
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

@router.post("/generate")
def generate_report(
    report_type: str = Query(...),
    time_range: str = Query("7d"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER]))
) -> Any:
    """Generate a new report"""
    
    report_id = f"RPT-{datetime.now().strftime('%Y-%m%d')}"
    
    new_report = {
        "id": report_id,
        "title": f"{report_type.upper()} Report - {time_range}",
        "type": report_type.upper(),
        "generated_at": datetime.now(),
        "author": current_user.full_name,
        "total_threats_detected": 150,
        "critical_incidents": 3,
        "average_risk_score": 32.5,
        "summary": f"Generated {report_type} report for {time_range} time range."
    }
    
    return {"message": "Report generated successfully", "report": ReportResponse(**new_report)}

@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    format: str = Query("pdf"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST, RoleEnum.VIEWER]))
) -> Response:
    """Download report in specified format"""
    
    # Find report
    report = None
    for r in SAMPLE_REPORTS:
        if r["id"] == report_id:
            report = r
            break
    
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    if format.lower() == "csv":
        # Generate CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["Field", "Value"])
        writer.writerow(["Report ID", report["id"]])
        writer.writerow(["Title", report["title"]])
        writer.writerow(["Type", report["type"]])
        writer.writerow(["Generated At", report["generated_at"]])
        writer.writerow(["Author", report["author"]])
        writer.writerow(["Total Threats Detected", report["total_threats_detected"]])
        writer.writerow(["Critical Incidents", report["critical_incidents"]])
        writer.writerow(["Average Risk Score", report["average_risk_score"]])
        writer.writerow(["Summary", report["summary"]])
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_id}.csv"}
        )
    
    elif format.lower() == "json":
        # Generate JSON
        json_data = json.dumps(report, indent=2, default=str)
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={report_id}.json"}
        )
    
    elif format.lower() == "pdf":
        # Generate simple PDF content
        pdf_content = f"""
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 12 Tf
50 750 Td
(NetShield AI - Security Report) Tj
0 -30 Td
(Report ID: {report['id']}) Tj
0 -20 Td
(Title: {report['title']}) Tj
0 -20 Td
(Type: {report['type']}) Tj
0 -20 Td
(Generated: {report['generated_at']}) Tj
0 -20 Td
(Author: {report['author']}) Tj
0 -20 Td
(Threats Detected: {report['total_threats_detected']}) Tj
0 -20 Td
(Critical Incidents: {report['critical_incidents']}) Tj
0 -20 Td
(Average Risk Score: {report['average_risk_score']}) Tj
0 -30 Td
(Summary:) Tj
0 -20 Td
({report['summary']}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000797 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
876
%%EOF
"""
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={report_id}.pdf"}
        )
    
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported format: {format}")

@router.get("/statistics/summary")
def get_report_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.SOC_MANAGER]))
) -> Any:
    """Get report statistics"""
    
    total_reports = len(SAMPLE_REPORTS)
    total_threats = sum(r["total_threats_detected"] for r in SAMPLE_REPORTS)
    total_incidents = sum(r["critical_incidents"] for r in SAMPLE_REPORTS)
    avg_risk = sum(r["average_risk_score"] for r in SAMPLE_REPORTS) / len(SAMPLE_REPORTS) if SAMPLE_REPORTS else 0
    
    # Count by type
    type_counts = {}
    for r in SAMPLE_REPORTS:
        type_counts[r["type"]] = type_counts.get(r["type"], 0) + 1
    
    return {
        "total_reports": total_reports,
        "total_threats_detected": total_threats,
        "total_critical_incidents": total_incidents,
        "average_risk_score": round(avg_risk, 2),
        "reports_by_type": type_counts
    }
