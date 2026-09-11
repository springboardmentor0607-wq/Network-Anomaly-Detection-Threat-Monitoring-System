import time
import requests
import numpy as np

BASE_URL = "http://localhost:8000"

def run_performance_audit():
    print("==================================================")
    print("      NETSHIELD AI - MILESTONE 4 AUDIT SUITE      ")
    print("==================================================")

    # 1. System Latency & Dashboard Response Time
    endpoints = [
        ("Dashboard Trends", "/api/alerts/trends", "GET", None),
        ("Threat Context", "/api/alerts/context/192.168.1.105", "GET", None),
        ("Analyst Directory", "/api/users", "GET", None),
        ("Threat Report Export", "/api/alerts/export", "GET", None)
    ]
    
    latencies = []
    for name, path, method, payload in endpoints:
        t0 = time.perf_counter()
        try:
            res = requests.get(f"{BASE_URL}{path}", timeout=2) if method == "GET" else requests.post(f"{BASE_URL}{path}", json=payload, timeout=2)
            ms = (time.perf_counter() - t0) * 1000
            latencies.append(ms)
            status = "PASS" if res.status_code == 200 and ms < 100 else "WARN"
            print(f"[{status}] {name:25} | Latency: {ms:6.2f} ms | Code: {res.status_code}")
        except Exception as e:
            print(f"[FAIL] {name:25} | Error: {str(e)}")

    avg_resp = np.mean(latencies) if latencies else 0
    print(f"\n>> Average Dashboard Response Time: {avg_resp:.2f} ms (Target: < 50 ms)")

    # 2. ML Inference & Alert Latency
    sample_packet = {"features": [0.05, 512, 12, 0, 1, 0, 80, 443, 0, 0.01]}
    inference_times = []
    for _ in range(50):
        t0 = time.perf_counter()
        requests.post(f"{BASE_URL}/api/predict", json=sample_packet)
        inference_times.append((time.perf_counter() - t0) * 1000)

    print(f">> ML Inference & Alert Latency:   {np.mean(inference_times):.2f} ms (Target: < 15 ms)")
    print("==================================================")

if __name__ == "__main__":
    run_performance_audit()