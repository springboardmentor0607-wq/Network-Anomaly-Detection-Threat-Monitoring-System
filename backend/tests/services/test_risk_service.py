import pytest
from app.services.risk_service import RiskService
from app.models.risk import SeverityBand

def test_risk_calculation_low():
    score, severity, explanation = RiskService.calculate_risk(
        anomaly_score=0.10,
        predicted_class="BENIGN",
        confidence=0.95,
        dst_ip="192.168.1.100",
        dst_port=8080
    )
    assert score < 30
    assert severity == SeverityBand.LOW
    assert explanation["final_score"] == score
    assert "formula" in explanation

def test_risk_calculation_critical():
    score, severity, explanation = RiskService.calculate_risk(
        anomaly_score=0.92,
        predicted_class="DoS SYN Flood",
        confidence=0.98,
        dst_ip="10.0.0.5",
        dst_port=443
    )
    assert score >= 80
    assert severity == SeverityBand.CRITICAL
    assert explanation["severity_weight_input"] == 100
    assert explanation["asset_criticality_weight"] == 90
