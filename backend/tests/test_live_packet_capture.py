import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.packet_feature_extractor import extract_features_from_packet
from app.services.live_packet_capture import live_capture_service
from app.auth.handler import create_access_token


def test_packet_feature_extractor():
    """Test mapping raw packet dictionary to CICIDS2017 ML features."""
    raw_packet = {
        "src_ip": "192.168.1.100",
        "dst_ip": "10.0.0.1",
        "dst_port": 80,
        "src_port": 54321,
        "protocol": "TCP",
        "length": 512
    }

    feat = extract_features_from_packet(raw_packet)

    assert feat["source_ip"] == "192.168.1.100"
    assert feat["destination_ip"] == "10.0.0.1"
    assert feat["Destination Port"] == 80
    assert feat["source_port"] == 54321
    assert feat["protocol"] == "TCP"
    assert feat["Total Length of Fwd Packets"] == 512
    assert feat["Max Packet Length"] == 512


@pytest.mark.asyncio
async def test_live_packet_capture_service_lifecycle():
    """Test starting and stopping live packet capture service."""
    status_before = live_capture_service.get_status()
    assert "is_capturing" in status_before
    assert "tshark_available" in status_before

    start_res = await live_capture_service.start_capture(duration=2)
    assert start_res["status"]["is_capturing"] is True

    # Allow simulation to run briefly
    import asyncio
    await asyncio.sleep(0.6)

    stop_res = await live_capture_service.stop_capture()
    assert stop_res["status"]["is_capturing"] is False


def test_live_capture_api_endpoints():
    """Integration test for live capture REST management endpoints."""
    with TestClient(app) as client:
        test_token = create_access_token("507f1f77bcf86cd799439011")
        headers = {"Authorization": f"Bearer {test_token}"}

        # 1. Get status
        res_status = client.get("/api/v1/network/live-capture/status", headers=headers)
        assert res_status.status_code == 200
        assert "is_capturing" in res_status.json()

        # 2. Start capture
        res_start = client.post("/api/v1/network/live-capture/start", json={"duration": 5}, headers=headers)
        assert res_start.status_code == 200
        assert res_start.json()["status"]["is_capturing"] is True

        # 3. Stop capture
        res_stop = client.post("/api/v1/network/live-capture/stop", headers=headers)
        assert res_stop.status_code == 200
        assert res_stop.json()["status"]["is_capturing"] is False
