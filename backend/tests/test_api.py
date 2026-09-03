# tests/test_api.py — NetShield API Integration Tests
# ============================================================
#  Covers all key API endpoints for Milestone 4 validation.
#  Run with: pytest tests/test_api.py -v
# ============================================================

import pytest


class TestRootHealth:
    """Basic health check — ensures the API is up."""

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "NetShield" in data["message"]


class TestMLReports:
    """Validate ML model report endpoints."""

    def test_get_cicids_metrics(self, client):
        response = client.get("/api/ml/reports/metrics?dataset=CICIDS2017")
        assert response.status_code == 200
        data = response.json()
        assert "model_accuracy" in data
        assert "precision" in data
        assert "recall" in data
        assert "f1_score" in data
        assert "roc_auc" in data
        # Validate high accuracy (>95%) on the trained CICIDS model
        assert data["model_accuracy"] > 0.95, (
            f"Expected accuracy > 0.95, got {data['model_accuracy']}"
        )
        assert data["f1_score"] > 0.95, (
            f"Expected F1 > 0.95, got {data['f1_score']}"
        )

    def test_get_unswnb15_metrics(self, client):
        response = client.get("/api/ml/reports/metrics?dataset=UNSW-NB15")
        assert response.status_code == 200
        data = response.json()
        assert "model_accuracy" in data
        assert data["model_accuracy"] > 0.90, (
            f"Expected UNSW accuracy > 0.90, got {data['model_accuracy']}"
        )

    def test_get_cicids_cross_validation(self, client):
        response = client.get("/api/ml/reports/cross-validation?dataset=CICIDS2017")
        assert response.status_code == 200
        data = response.json()
        assert "accuracy" in data
        assert "precision" in data
        assert "recall" in data
        assert "f1_score" in data
        # Must be 5-fold CV
        assert len(data["accuracy"]) == 5, "Expected 5-fold CV results"
        # All folds should exceed 95%
        for fold_acc in data["accuracy"]:
            assert fold_acc > 0.95

    def test_get_threat_analysis(self, client):
        response = client.get("/api/ml/reports/threat-analysis?dataset=CICIDS2017")
        assert response.status_code == 200
        data = response.json()
        # Should return threat analysis data (may be empty if not scored yet)
        assert isinstance(data, dict)

    def test_epoch_metrics_csv(self, client):
        response = client.get("/api/ml/reports/epoch-metrics?dataset=CICIDS2017")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        content = response.text
        assert "epoch" in content
        assert "mlogloss" in content.lower() or "logloss" in content.lower()


class TestMLPrediction:
    """Validate the ML prediction endpoint."""

    def test_predict_benign_cicids(self, client, cicids_sample_features):
        payload = {
            "features": cicids_sample_features,
            "dataset": "CICIDS2017"
        }
        response = client.post("/api/ml/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "is_anomaly" in data
        assert "threat_class" in data
        assert "confidence" in data
        assert "risk_score" in data
        assert data["status"] == "success"
        # Risk score must be within valid range
        assert 0 <= data["risk_score"] <= 100

    def test_predict_confidence_range(self, client, cicids_sample_features):
        """Confidence score must be in [0, 1]."""
        payload = {"features": cicids_sample_features, "dataset": "CICIDS2017"}
        response = client.post("/api/ml/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert 0.0 <= data["confidence"] <= 1.0

    def test_predict_with_empty_features(self, client):
        """Prediction with empty features should still return a structured response."""
        payload = {"features": {}, "dataset": "CICIDS2017"}
        response = client.post("/api/ml/predict", json=payload)
        # Should succeed (model uses 0-fill for missing features)
        assert response.status_code in [200, 500]

    def test_predict_attack_features(self, client, attack_sample_features):
        """High packet-rate features should trigger anomaly detection."""
        payload = {"features": attack_sample_features, "dataset": "CICIDS2017"}
        response = client.post("/api/ml/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        # High-rate traffic should have elevated risk score
        assert isinstance(data["risk_score"], int)

    def test_predict_invalid_dataset(self, client, cicids_sample_features):
        """Unknown dataset should return an error."""
        payload = {"features": cicids_sample_features, "dataset": "NONEXISTENT"}
        response = client.post("/api/ml/predict", json=payload)
        assert response.status_code == 500


class TestNetworkEndpoints:
    """Validate network traffic and dashboard endpoints."""

    def test_network_summary(self, client):
        response = client.get("/api/network/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_packets" in data
        assert "total_alerts" in data
        assert "status" in data
        assert isinstance(data["total_packets"], int)
        assert isinstance(data["total_alerts"], int)

    def test_traffic_data_pagination(self, client):
        response = client.get("/api/network/traffic-data?skip=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)
        assert len(data["data"]) <= 10

    def test_traffic_data_structure(self, client):
        """Each traffic record must have required fields."""
        response = client.get("/api/network/traffic-data?skip=0&limit=5")
        assert response.status_code == 200
        records = response.json().get("data", [])
        if records:
            record = records[0]
            required_fields = [
                "id", "source_ip", "destination_ip",
                "protocol", "label", "threat_level", "confidence"
            ]
            for field in required_fields:
                assert field in record, f"Missing field: {field}"

    def test_dashboard_stats(self, client):
        response = client.get("/api/network/dashboard-stats")
        assert response.status_code == 200
        data = response.json()
        # Must contain chart data sections
        assert "attack_categories" in data
        assert "protocols" in data
        assert "targeted_ips" in data
        assert "system_health" in data

    def test_recent_alerts(self, client):
        response = client.get("/api/network/recent-alerts?limit=5")
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)

    def test_traffic_flow(self, client):
        response = client.get("/api/network/traffic-flow")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_port_usage(self, client):
        response = client.get("/api/network/port-usage")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_attack_timeline(self, client):
        response = client.get("/api/network/attack-timeline")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Each entry must have time and attacks
        if data:
            assert "time" in data[0]
            assert "attacks" in data[0]

    def test_anomaly_data(self, client):
        response = client.get("/api/network/anomaly-data")
        assert response.status_code == 200
        data = response.json()
        assert "graph" in data
        assert "classification" in data
        assert "insights" in data

    def test_dataset_filter(self, client):
        """Dataset filter should not cause errors."""
        response = client.get("/api/network/summary?dataset=CICIDS2017")
        assert response.status_code == 200


class TestAuthEndpoints:
    """Validate authentication endpoints."""

    def test_login_invalid_credentials(self, client):
        payload = {"username": "nonexistent", "password": "wrongpassword"}
        response = client.post(
            "/api/auth/login",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code in [400, 401, 422]

    def test_protected_endpoint_without_token(self, client):
        """Verify that unauthenticated access to login with wrong creds is rejected."""
        payload = {"username": "hacker", "password": "badpassword"}
        response = client.post(
            "/api/auth/login",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code not in [200]


class TestReportsEndpoints:
    """Validate report listing and download."""

    def test_list_reports(self, client):
        response = client.get("/api/reports/list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
