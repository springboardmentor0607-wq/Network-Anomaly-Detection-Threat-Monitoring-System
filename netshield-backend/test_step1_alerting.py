import json
import pandas as pd
from app import app
from db import init_db_tables

def run_tests():
    print("==================================================")
    print("NETSHIELD AI - MILESTONE 3 STEP 1 VERIFICATION TEST")
    print("==================================================")

    # 1. Initialize DB tables
    init_success = init_db_tables()
    print(f"[DB INIT] PostgreSQL initialization: {'SUCCESS' if init_success else 'OFFLINE/FALLBACK'}")

    client = app.test_client()

    # Load manual test samples
    manual_samples_path = "../dataset/manual_test_samples.csv"
    try:
        df = pd.read_csv(manual_samples_path)
        print(f"[DATASET] Loaded {len(df)} samples from {manual_samples_path}")
    except Exception as e:
        print(f"[ERROR] Could not load manual_test_samples.csv: {e}")
        return

    # TEST 1 — NORMAL TRAFFIC
    print("\n--------------------------------------------------")
    print("TEST 1 — NORMAL TRAFFIC")
    print("--------------------------------------------------")
    normal_rows = df[df["expected_attack"].astype(str).str.strip().str.lower() == "normal"]
    if not normal_rows.empty:
        sample = normal_rows.iloc[0].to_dict()
        sample["source_ip"] = "192.168.1.10"
        sample["dest_ip"] = "10.0.0.1"

        res = client.post("/predict", data=json.dumps(sample), content_type="application/json")
        data = res.get_json()
        print("Prediction:", data.get("prediction"))
        print("Is Anomaly:", data.get("is_anomaly"))
        print("Alert Generated:", data.get("alert_generated"))

        assert data.get("is_anomaly") == False, "Normal traffic should NOT be marked as anomaly"
        assert data.get("alert_generated") == False, "Normal traffic should NOT generate a security alert"
        print("[PASS] TEST 1 — Normal Traffic passed successfully!")

    # TEST 2 — DoS TRAFFIC
    print("\n--------------------------------------------------")
    print("TEST 2 — DoS TRAFFIC SAMPLE EVALUATION")
    print("--------------------------------------------------")
    dos_rows = df[df["expected_attack"].astype(str).str.strip().str.lower() == "dos"]
    evaluated_dos = False
    for idx, row in dos_rows.iterrows():
        sample = row.to_dict()
        sample["source_ip"] = "185.220.101.5"
        sample["dest_ip"] = "10.0.4.15"

        res = client.post("/predict", data=json.dumps(sample), content_type="application/json")
        data = res.get_json()
        print(f"Sample #{sample.get('sample_id')} -> Predicted Attack Type: {data.get('attack_type')}, Threat Level: {data.get('threat_level')}, Alert Generated: {data.get('alert_generated')}, Alert ID: {data.get('alert_id')}")

        assert data.get("is_anomaly") == True, "Anomalous traffic should generate an anomaly flag"
        assert data.get("alert_generated") == True, "Anomalous traffic MUST generate a security alert"
        assert data.get("alert_status") == "New", "Newly generated alert status should be 'New'"
        if data.get("attack_type") == "DoS":
            assert data.get("threat_level") == "Critical", "DoS threat level must be Critical"
            evaluated_dos = True

    print("[PASS] TEST 2 — DoS Traffic sample evaluation passed successfully!")

    # TEST 3 — RECONNAISSANCE TRAFFIC
    print("\n--------------------------------------------------")
    print("TEST 3 — RECONNAISSANCE TRAFFIC")
    print("--------------------------------------------------")
    recon_rows = df[df["expected_attack"].astype(str).str.strip().str.lower() == "reconnaissance"]
    for idx, row in recon_rows.iterrows():
        sample = row.to_dict()
        sample["source_ip"] = "192.168.1.105"
        sample["dest_ip"] = "10.0.0.2"

        res = client.post("/predict", data=json.dumps(sample), content_type="application/json")
        data = res.get_json()
        print(f"Sample #{sample.get('sample_id')} -> Predicted Attack Type: {data.get('attack_type')}, Threat Level: {data.get('threat_level')}, Alert Generated: {data.get('alert_generated')}")

        assert data.get("alert_generated") == True, "Reconnaissance traffic MUST generate a security alert"
        if data.get("attack_type") == "Reconnaissance":
            assert data.get("threat_level") == "Medium", "Reconnaissance threat level must be Medium"

    print("[PASS] TEST 3 — Reconnaissance Traffic passed successfully!")

    # TEST 4 — EXPLOITS TRAFFIC
    print("\n--------------------------------------------------")
    print("TEST 4 — EXPLOITS TRAFFIC")
    print("--------------------------------------------------")
    exploit_rows = df[df["expected_attack"].astype(str).str.strip().str.lower() == "exploits"]
    for idx, row in exploit_rows.iterrows():
        sample = row.to_dict()
        sample["source_ip"] = "192.168.1.110"
        sample["dest_ip"] = "10.0.0.5"

        res = client.post("/predict", data=json.dumps(sample), content_type="application/json")
        data = res.get_json()
        print(f"Sample #{sample.get('sample_id')} -> Predicted Attack Type: {data.get('attack_type')}, Threat Level: {data.get('threat_level')}, Alert Generated: {data.get('alert_generated')}")

        assert data.get("alert_generated") == True, "Exploits traffic MUST generate a security alert"
        if data.get("attack_type") == "Exploits":
            assert data.get("threat_level") == "High", "Exploits threat level must be High"

    print("[PASS] TEST 4 — Exploits Traffic passed successfully!")

    # TEST 5 — ALERT LIST & ACKNOWLEDGEMENT API (GET /alerts, PATCH /alerts/<id>)
    print("\n--------------------------------------------------")
    print("TEST 5 — ALERT LIST & ACKNOWLEDGEMENT API")
    print("--------------------------------------------------")
    res_list = client.get("/alerts")
    alerts_list = res_list.get_json()
    print("Total alerts retrieved from GET /alerts:", len(alerts_list))
    assert res_list.status_code == 200, "GET /alerts failed"
    assert len(alerts_list) > 0, "GET /alerts should return alerts"

    first_alert = alerts_list[0]
    target_id = first_alert.get("alert_id") or first_alert.get("id")
    print(f"Testing PATCH /alerts/{target_id} (Acknowledge)...")
    res_patch = client.patch(f"/alerts/{target_id}", data=json.dumps({"acknowledged": True, "status": "Acknowledged"}), content_type="application/json")
    print("PATCH status code:", res_patch.status_code)
    patch_data = res_patch.get_json()
    print("Updated alert acknowledge status:", patch_data.get("acknowledged"))
    assert patch_data.get("acknowledged") == True, "Alert acknowledgement status should be True after PATCH"
    print("[PASS] TEST 5 — Alert APIs passed successfully!")

    print("\n==================================================")
    print("ALL MILESTONE 3 STEP 1 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
