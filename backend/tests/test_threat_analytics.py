import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.threat_analytics_service import compute_threat_intelligence_analytics
from app.auth.handler import create_access_token


@pytest.mark.asyncio
async def test_compute_threat_intelligence_analytics_structure():
    """Test structure and keys returned by compute_threat_intelligence_analytics service."""
    res = await compute_threat_intelligence_analytics()
    assert "kpis" in res
    assert "attack_distribution" in res
    assert "threat_trend" in res
    assert "risk_score_distribution" in res
    assert "most_common_attacks" in res
    assert "detection_timeline" in res

    # Verify KPI keys
    kpis = res["kpis"]
    assert "total_threats" in kpis
    assert "critical_high_count" in kpis
    assert "avg_risk_score" in kpis
    assert "top_attack_vector" in kpis
    assert "active_incidents" in kpis

    # Verify risk_score_distribution bins
    ranges = [b["range"] for b in res["risk_score_distribution"]]
    assert "0-20" in ranges
    assert "81-100" in ranges


def test_threat_intelligence_analytics_api_endpoint():
    """Integration test for /api/v1/threat-intelligence/analytics REST endpoint."""
    with TestClient(app) as client:
        test_token = create_access_token("507f1f77bcf86cd799439011")
        headers = {"Authorization": f"Bearer {test_token}"}

        res = client.get("/api/v1/threat-intelligence/analytics", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "kpis" in data
        assert "attack_distribution" in data
        assert "threat_trend" in data
        assert "risk_score_distribution" in data
        assert "most_common_attacks" in data
        assert "detection_timeline" in data
