# tests/test_ml_service.py — Unit Tests for NetShield MLService
# ============================================================
#  Tests the ML prediction engine directly (not through HTTP).
#  Run with: pytest tests/test_ml_service.py -v
# ============================================================

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.ml_service import MLService


@pytest.fixture(scope="module")
def ml_svc():
    """Load ML service with the correct model directory."""
    model_dir = os.path.join(os.path.dirname(__file__), "..", "app", "models")
    return MLService(base_model_dir=model_dir)


@pytest.fixture(scope="module")
def benign_features():
    return {
        "Destination Port": 443,
        "Flow Duration": 500000,
        "Total Fwd Packets": 8,
        "Total Backward Packets": 6,
        "Total Length of Fwd Packets": 1200,
        "Total Length of Bwd Packets": 800,
        "Fwd Packet Length Max": 300,
        "Fwd Packet Length Min": 50,
        "Fwd Packet Length Mean": 150.0,
        "Fwd Packet Length Std": 60.0,
        "Bwd Packet Length Max": 200,
        "Bwd Packet Length Min": 30,
        "Bwd Packet Length Mean": 133.0,
        "Bwd Packet Length Std": 45.0,
        "Flow Bytes/s": 4000.0,
        "Flow Packets/s": 28.0,
        "Flow IAT Mean": 35714.0,
        "Flow IAT Std": 20000.0,
        "Flow IAT Max": 100000.0,
        "Flow IAT Min": 1000.0,
        "Fwd IAT Total": 250000.0,
        "Fwd IAT Mean": 35714.0,
        "Fwd IAT Std": 20000.0,
        "Fwd IAT Max": 100000.0,
        "Fwd IAT Min": 1000.0,
        "Bwd IAT Total": 200000.0,
        "Bwd IAT Mean": 40000.0,
        "Bwd IAT Std": 15000.0,
        "Bwd IAT Max": 80000.0,
        "Bwd IAT Min": 5000.0,
        "FIN Flag Count": 1,
        "SYN Flag Count": 1,
        "RST Flag Count": 0,
        "PSH Flag Count": 3,
        "ACK Flag Count": 12,
        "URG Flag Count": 0,
        "Init_Win_bytes_forward": 65535,
        "Init_Win_bytes_backward": 65535,
    }


class TestModelLoading:
    """Verify both ML models load correctly."""

    def test_cicids_model_loaded(self, ml_svc):
        assert ml_svc.models["CICIDS2017"]["is_loaded"] is True, (
            "CICIDS2017 model failed to load — check app/models/cicids/"
        )

    def test_unswnb15_model_loaded(self, ml_svc):
        assert ml_svc.models["UNSW-NB15"]["is_loaded"] is True, (
            "UNSW-NB15 model failed to load — check app/models/unswnb15/"
        )

    def test_cicids_has_required_components(self, ml_svc):
        model = ml_svc.models["CICIDS2017"]
        required = ["iso_forest", "xgb_model", "scaler", "label_encoder", "feature_names"]
        for key in required:
            assert key in model, f"Missing component: {key}"

    def test_cicids_feature_names_is_list(self, ml_svc):
        feature_names = ml_svc.models["CICIDS2017"]["feature_names"]
        assert isinstance(feature_names, list)
        assert len(feature_names) > 0


class TestPrediction:
    """Test the predict() method for correctness."""

    def test_predict_returns_dict(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="CICIDS2017")
        assert isinstance(result, dict)

    def test_predict_has_required_keys(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="CICIDS2017")
        required_keys = ["is_anomaly", "threat_class", "confidence", "risk_score", "status"]
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_predict_status_success(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="CICIDS2017")
        assert result["status"] == "success"

    def test_predict_is_anomaly_is_bool(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="CICIDS2017")
        assert isinstance(result["is_anomaly"], bool)

    def test_predict_confidence_in_range(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="CICIDS2017")
        assert 0.0 <= result["confidence"] <= 1.0, (
            f"Confidence {result['confidence']} is out of [0, 1] range"
        )

    def test_predict_risk_score_in_range(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="CICIDS2017")
        assert 0 <= result["risk_score"] <= 100, (
            f"Risk score {result['risk_score']} is out of [0, 100] range"
        )

    def test_predict_threat_class_is_string(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="CICIDS2017")
        assert isinstance(result["threat_class"], str)
        assert len(result["threat_class"]) > 0

    def test_predict_empty_features_graceful(self, ml_svc):
        """Empty features dict should return a valid prediction (0-filled)."""
        result = ml_svc.predict({}, dataset="CICIDS2017")
        # Should not crash — model handles missing values
        assert "status" in result

    def test_predict_unknown_dataset_returns_error(self, ml_svc, benign_features):
        result = ml_svc.predict(benign_features, dataset="INVALID_DATASET")
        assert result["status"] == "failed"
        assert "error" in result


class TestRiskScoreComputation:
    """Unit tests for the compute_risk_score() method."""

    def test_benign_no_anomaly_score_is_zero(self, ml_svc):
        score = ml_svc.compute_risk_score(
            is_anomaly=False, threat_class="BENIGN", threat_prob=0.99
        )
        assert score == 0

    def test_anomaly_only_score_is_40(self, ml_svc):
        """Anomaly without threat classification adds 40 points."""
        score = ml_svc.compute_risk_score(
            is_anomaly=True, threat_class="BENIGN", threat_prob=0.99
        )
        assert score == 40

    def test_high_confidence_attack_scores_high(self, ml_svc):
        score = ml_svc.compute_risk_score(
            is_anomaly=True, threat_class="DDoS", threat_prob=1.0
        )
        assert score == 100  # 40 (anomaly) + 60 (max threat prob)

    def test_moderate_attack_medium_score(self, ml_svc):
        score = ml_svc.compute_risk_score(
            is_anomaly=False, threat_class="Port Scan", threat_prob=0.5
        )
        assert score == 30  # 0 + (0.5 * 60)

    def test_score_never_exceeds_100(self, ml_svc):
        score = ml_svc.compute_risk_score(
            is_anomaly=True, threat_class="DDoS", threat_prob=2.0
        )
        assert score == 100  # Capped at 100

    def test_score_never_below_zero(self, ml_svc):
        score = ml_svc.compute_risk_score(
            is_anomaly=False, threat_class="BENIGN", threat_prob=0.0
        )
        assert score == 0
