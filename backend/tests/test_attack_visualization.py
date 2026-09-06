import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.threat_analytics_service import compute_threat_intelligence_analytics
from app.auth.handler import create_access_token


@pytest.mark.asyncio
async def test_compute_threat_intelligence_analytics_with_filters():
    """Test filtered compute_threat_intelligence_analytics execution."""
    res_critical = await compute_threat_intelligence_analytics(severity_filter="Critical")
    assert "top_attacker_ips" in res_critical
    assert "risk_heatmap" in res_critical
    assert "protocol_distribution" in res_critical
    assert "traffic_flow" in res_critical

    res_ddos = await compute_threat_intelligence_analytics(attack_type_filter="DDoS")
    assert "kpis" in res_ddos
    assert isinstance(res_ddos["top_attacker_ips"], list)


def test_attack_visualization_filtered_api_endpoint():
    """Integration test for /api/v1/threat-intelligence/analytics with query parameters."""
    with TestClient(app) as client:
        test_token = create_access_token("507f1f77bcf86cd799439011")
        headers = {"Authorization": f"Bearer {test_token}"}

        # Filter by severity and attack type
        params = {
            "severity": "High",
            "attack_type": "DDoS"
        }
        res = client.get("/api/v1/threat-intelligence/analytics", params=params, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "top_attacker_ips" in data
        assert "risk_heatmap" in data
        assert "protocol_distribution" in data
        assert "traffic_flow" in data
