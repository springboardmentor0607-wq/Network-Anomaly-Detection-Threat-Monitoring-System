import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.alert_service import create_alert_from_prediction
from app.services.websocket_manager import ws_manager


def test_websocket_connection_and_broadcasting():
    """Test that WebSocket client connects and receives NEW_ALERT broadcast events."""
    with TestClient(app) as client:
        with client.websocket_connect("/api/v1/ws/alerts") as websocket:
            # 1. Connection welcome message
            initial_data = websocket.receive_json()
            assert initial_data["type"] == "CONNECTED"

            # 2. Trigger auto-alert generation from prediction
            packet = {
                "source_ip": "10.0.0.99",
                "destination_ip": "192.168.1.1",
            }
            pred = {
                "attack_type": "DDoS",
                "confidence": 0.97,
                "risk_score": 92,
                "severity": "Critical"
            }

            # Create alert and broadcast
            alert_res = create_alert_from_prediction(pred, packet)
            assert alert_res is not None

            # 3. Receive broadcast message via WebSocket
            message = websocket.receive_json()
            assert message["type"] == "NEW_ALERT"
            assert message["data"]["attack_type"] == "DDoS"
            assert message["data"]["source_ip"] == "10.0.0.99"
            assert message["data"]["severity"] == "Critical"
            assert message["data"]["confidence"] == 0.97
