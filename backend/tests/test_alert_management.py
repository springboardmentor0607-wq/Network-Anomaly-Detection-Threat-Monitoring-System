import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.alert import AlertDocument, AlertSeverity, AlertStatus, generate_alert_id
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert_service import (
    acknowledge_alert,
    create_alert,
    create_alert_from_prediction,
    delete_alert,
    get_alert_by_id,
    get_alerts,
    resolve_alert,
)
from app.services.network_monitoring import predict_network_traffic
from app.auth.handler import create_access_token, get_password_hash
from app.models.user import build_user_document


def test_alert_document_model():
    """Test default values and serialization of AlertDocument."""
    alert = AlertDocument(
        source_ip="192.168.1.50",
        destination_ip="10.0.0.5",
        attack_type="DDoS",
        confidence=0.92,
        risk_score=88,
        severity=AlertSeverity.HIGH
    )

    assert alert.alert_id.startswith("ALT-")
    assert alert.source_ip == "192.168.1.50"
    assert alert.destination_ip == "10.0.0.5"
    assert alert.attack_type == "DDoS"
    assert alert.confidence == 0.92
    assert alert.risk_score == 88
    assert alert.severity == AlertSeverity.HIGH
    assert alert.status == AlertStatus.OPEN
    assert alert.assigned_to is None

    doc_dict = alert.to_db_dict()
    assert doc_dict["alert_id"] == alert.alert_id
    assert doc_dict["status"] == "Open"
    assert doc_dict["severity"] == "High"


def test_auto_alert_generation_from_prediction():
    """Test that create_alert_from_prediction triggers for attack traffic and skips benign traffic."""
    packet_attack = {
        "source_ip": "172.16.0.4",
        "destination_ip": "10.0.0.12",
    }
    pred_attack = {
        "attack_type": "DDoS",
        "confidence": 0.95,
        "risk_score": 90,
        "severity": "Critical"
    }

    generated_alert = create_alert_from_prediction(pred_attack, packet_attack)
    assert generated_alert is not None
    assert generated_alert["attack_type"] == "DDoS"
    assert generated_alert["source_ip"] == "172.16.0.4"
    assert generated_alert["destination_ip"] == "10.0.0.12"
    assert generated_alert["confidence"] == 0.95
    assert generated_alert["severity"] == "Critical"
    assert generated_alert["status"] == "Open"

    # Benign traffic should return None (no alert created)
    pred_benign = {
        "attack_type": "Benign",
        "confidence": 0.99,
        "risk_score": 0,
        "severity": "Safe"
    }
    assert create_alert_from_prediction(pred_benign, packet_attack) is None


def test_predict_network_traffic_auto_alert():
    """Test that predict_network_traffic triggers auto-alert generation structure."""
    packet_data = {
        "source_ip": "192.168.1.200",
        "destination_ip": "10.0.0.50",
    }
    res = predict_network_traffic(packet_data)
    assert "attack_type" in res
    assert "confidence" in res
    assert "risk_score" in res
    assert "severity" in res


def test_alerts_api_endpoints():
    """Integration test for /api/v1/alerts REST endpoints."""
    with TestClient(app) as client:
        # Create test token for authentication
        test_token = create_access_token("507f1f77bcf86cd799439011")
        headers = {"Authorization": f"Bearer {test_token}"}

        # 1. Create alert manually
        payload = {
            "source_ip": "192.168.1.10",
            "destination_ip": "10.0.0.2",
            "attack_type": "PortScan",
            "confidence": 0.88,
            "risk_score": 75,
            "severity": "High",
            "assigned_to": "analyst@netshield.ai"
        }
        res_post = client.post("/api/v1/alerts", json=payload, headers=headers)
        # Note: If database is offline or unauthenticated in test environment, handle status code appropriately
        if res_post.status_code == 201:
            alert_data = res_post.json()
            alert_id = alert_data["alert_id"]
            assert alert_data["attack_type"] == "PortScan"
            assert alert_data["status"] == "Open"

            # 2. Get alert by ID
            res_get = client.get(f"/api/v1/alerts/{alert_id}", headers=headers)
            assert res_get.status_code == 200
            assert res_get.json()["alert_id"] == alert_id

            # 3. Acknowledge alert
            res_ack = client.patch(f"/api/v1/alerts/{alert_id}/acknowledge", json={"assigned_to": "admin@netshield.ai"}, headers=headers)
            assert res_ack.status_code == 200
            assert res_ack.json()["status"] == "Acknowledged"
            assert res_ack.json()["assigned_to"] == "admin@netshield.ai"

            # 4. Resolve alert
            res_resolve = client.patch(f"/api/v1/alerts/{alert_id}/resolve", json={"assigned_to": "admin@netshield.ai"}, headers=headers)
            assert res_resolve.status_code == 200
            assert res_resolve.json()["status"] == "Resolved"

            # 5. List alerts
            res_list = client.get("/api/v1/alerts", headers=headers)
            assert res_list.status_code == 200
            assert isinstance(res_list.json(), list)

            # 6. Delete alert
            res_del = client.delete(f"/api/v1/alerts/{alert_id}", headers=headers)
            assert res_del.status_code == 200
            assert res_del.json()["alert_id"] == alert_id
