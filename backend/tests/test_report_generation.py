import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.report_generator import (
    generate_report_data,
    generate_threat_report_csv,
    generate_threat_report_pdf,
)
from app.auth.handler import create_access_token


@pytest.mark.asyncio
async def test_report_generation_content():
    """Test that CSV and PDF content include total attacks, model accuracy, threat distribution, confidence, risk distribution, and attack timeline."""
    data = await generate_report_data()
    
    assert "kpis" in data
    assert "model_metrics" in data
    assert "attack_distribution" in data
    assert "risk_score_distribution" in data
    assert "timeline" in data

    # 1. Test CSV generation
    csv_str = generate_threat_report_csv(data)
    assert "EXECUTIVE THREAT INTELLIGENCE REPORT" in csv_str
    assert "Total Attacks Detected" in csv_str
    assert "AI Model Accuracy" in csv_str
    assert "Model Precision" in csv_str
    assert "Model Recall" in csv_str
    assert "THREAT CATEGORY DISTRIBUTION" in csv_str
    assert "RISK SCORE BINNED DISTRIBUTION" in csv_str
    assert "DETAILED ATTACK TIMELINE" in csv_str

    # 2. Test PDF generation
    pdf_bytes = generate_threat_report_pdf(data)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF")


def test_reports_api_endpoints():
    """Integration test for /api/v1/reports/pdf and /api/v1/reports/csv REST endpoints."""
    with TestClient(app) as client:
        test_token = create_access_token("507f1f77bcf86cd799439011")
        headers = {"Authorization": f"Bearer {test_token}"}

        # 1. PDF Download Endpoint
        res_pdf = client.get("/api/v1/reports/pdf", headers=headers)
        assert res_pdf.status_code == 200
        assert res_pdf.headers["content-type"] == "application/pdf"
        assert "attachment; filename=NetShield_Threat_Report.pdf" in res_pdf.headers["content-disposition"]
        assert res_pdf.content.startswith(b"%PDF")

        # 2. CSV Download Endpoint
        res_csv = client.get("/api/v1/reports/csv", headers=headers)
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]
        assert "attachment; filename=NetShield_Threat_Report.csv" in res_csv.headers["content-disposition"]
        assert "NETSHIELD AI EXECUTIVE THREAT INTELLIGENCE REPORT" in res_csv.text
