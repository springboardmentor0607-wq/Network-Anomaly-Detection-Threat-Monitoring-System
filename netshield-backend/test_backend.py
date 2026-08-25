import sys
import os
import joblib
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from db import get_db_connection, init_db_tables
from models.predict import predict_attack

def run_tests():
    print("==================================================")
    print("        NETSHIELD AI - BACKEND VERIFICATION        ")
    print("==================================================")

    # Test 1: Flask app initialization and routes
    print("\n1. Testing Flask Application and Blueprints...")
    client = app.test_client()
    
    # Test Home endpoint
    res_home = client.get("/")
    assert res_home.status_code == 200, f"Home endpoint failed: {res_home.status_code}"
    print("   [PASS] GET / ->", res_home.get_json()["message"])

    # Test /model-info endpoint
    res_info = client.get("/model-info")
    assert res_info.status_code == 200, f"/model-info failed: {res_info.status_code}"
    info_json = res_info.get_json()
    print("   [PASS] GET /model-info -> Model:", info_json["model_name"], "| Accuracy:", info_json["training_accuracy"])

    # Test /predict endpoint
    res_pred = client.post("/predict", json={"proto": "tcp", "service": "http", "state": "FIN"})
    assert res_pred.status_code == 200, f"/predict failed: {res_pred.status_code}"
    pred_json = res_pred.get_json()
    print("   [PASS] POST /predict -> Prediction:", pred_json["prediction"], "| Confidence:", pred_json["confidence"])

    # Test /analyze endpoint
    res_an = client.get("/analyze")
    assert res_an.status_code == 200, f"/analyze failed: {res_an.status_code}"
    an_json = res_an.get_json()
    print("   [PASS] GET /analyze -> Total Records:", an_json["total_records"], "| Model Engine:", an_json["model_engine"])

    # Test /reports endpoint
    res_rep = client.get("/reports")
    assert res_rep.status_code == 200, f"/reports failed: {res_rep.status_code}"
    print("   [PASS] GET /reports -> Reports returned:", len(res_rep.get_json()))

    # Test 2: Database Initialization
    print("\n2. Testing PostgreSQL Table Initialization...")
    db_ok = init_db_tables()
    print(f"   DB Table Init Status: {db_ok}")

    # Test 3: Random Forest Prediction Direct Test
    print("\n3. Testing Random Forest Model Direct Inference...")
    sample = {"proto": "tcp", "service": "http", "state": "FIN", "dur": 0.12, "spkts": 10, "dpkts": 8}
    direct_res = predict_attack(sample)
    print("   Prediction Output:", direct_res["prediction"])
    print("   Attack Category  :", direct_res["attack_type"])
    print("   Confidence Score :", direct_res["confidence"])
    print("   Model Engine     :", direct_res["model_engine"])
    assert direct_res["model_engine"] == "Random Forest Classifier", f"Unexpected model engine: {direct_res['model_engine']}"

    # Test 4: Check metrics.pkl structure if exists
    metrics_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "saved_model", "metrics.pkl")
    if os.path.exists(metrics_path):
        print("\n4. Verifying metrics.pkl Contents...")
        m = joblib.load(metrics_path)
        required_keys = [
            "framework", "algorithm", "training_accuracy", "validation_accuracy", "test_accuracy",
            "precision", "recall", "f1_score", "confusion_matrix", "classes", "num_features",
            "num_classes", "training_samples", "testing_samples", "feature_importances"
        ]
        for key in required_keys:
            assert key in m, f"Missing key in metrics.pkl: {key}"
            print(f"   - {key}: present")

    print("\n==================================================")
    print("   [PASS] ALL BACKEND SYSTEM TESTS PASSED SUCCESSFULLY ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

