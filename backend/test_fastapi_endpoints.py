from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def check_endpoint(
    name,
    method,
    url,
    expected_statuses=[200],
    json_body=None,
    headers=None
):
    try:
        if method == "GET":
            resp = client.get(url, headers=headers)
        elif method == "POST":
            resp = client.post(url, json=json_body, headers=headers)
        elif method == "PUT":
            resp = client.put(url, json=json_body, headers=headers)
        elif method == "DELETE":
            resp = client.delete(url, headers=headers)
        else:
            print(f"[FAIL] Unsupported HTTP method: {method}")
            return False, None

        status = resp.status_code
        passed = status in expected_statuses

        indicator = "[PASS]" if passed else "[FAIL]"
        print(f"{indicator} {method:6} {url:35} -> HTTP {status}")

        if not passed:
            print(f"       Error body: {resp.text[:200]}")

        return passed, resp

    except Exception as e:
        print(f"[FAIL] {method:6} {url:35} -> Exception: {e}")
        return False, None


def run_all_tests():
    print("=" * 70)
    print("NETSHIELD AI FASTAPI SUITE - INTEGRATION TEST RUNNER")
    print("=" * 70)

    from auth import create_access_token

    token = create_access_token({
        "id": 1,
        "email": "admin@netshield.ai",
        "role": "ADMIN",
        "name": "SOC Lead Analyst"
    })

    auth_headers = {
        "Authorization": f"Bearer {token}"
    }

    results = []

    # ============================================================
    # 1. SYSTEM & HEALTH
    # ============================================================

    results.append(
        check_endpoint(
            "Health Check",
            "GET",
            "/api/health"
        )
    )

    results.append(
        check_endpoint(
            "System Status",
            "GET",
            "/api/status"
        )
    )

    results.append(
        check_endpoint(
            "System Info",
            "GET",
            "/api/system-info"
        )
    )

    results.append(
        check_endpoint(
            "SIEM Status",
            "GET",
            "/api/siem/status"
        )
    )

    # ============================================================
    # 2. AUTHENTICATION & PROFILE
    # ============================================================

    results.append(
        check_endpoint(
            "Auth Me",
            "GET",
            "/api/auth/me",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Login",
            "POST",
            "/api/auth/login",
            expected_statuses=[200, 401],
            json_body={
                "email": "admin@netshield.ai",
                "password": "AdminPassword123!"
            }
        )
    )

    # ============================================================
    # 3. DASHBOARD
    # ============================================================

    results.append(
        check_endpoint(
            "Dashboard Data",
            "GET",
            "/api/dashboard-data",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Dashboard Root",
            "GET",
            "/api/dashboard",
            headers=auth_headers
        )
    )

    # ============================================================
    # 4. ANALYTICS & THREAT INTELLIGENCE
    # ============================================================

    results.append(
        check_endpoint(
            "Threat Intelligence",
            "GET",
            "/api/threat-intelligence",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Weekly Trends",
            "GET",
            "/api/weekly-security-trends",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Security Analytics",
            "GET",
            "/api/security-analytics",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Threat IP Lookup",
            "GET",
            "/api/threat-intelligence/lookup?ip=192.168.1.105",
            headers=auth_headers
        )
    )

    # ============================================================
    # 5. NETWORK & THREATS
    # ============================================================

    results.append(
        check_endpoint(
            "Network Monitor",
            "GET",
            "/api/network-monitor",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Threats List",
            "GET",
            "/api/threats",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Alerts List",
            "GET",
            "/api/alerts",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Incidents List",
            "GET",
            "/api/incidents",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Attack Visualization",
            "GET",
            "/api/attack-visualization",
            headers=auth_headers
        )
    )

    # ============================================================
    # 6. DATASETS & SAMPLES
    # ============================================================

    results.append(
        check_endpoint(
            "Dataset History",
            "GET",
            "/api/datasets/history",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Dataset Samples",
            "GET",
            "/api/datasets/samples",
            headers=auth_headers
        )
    )

    # ============================================================
    # 7. NOTIFICATIONS, AUDIT, REPORTS & USERS
    # ============================================================

    results.append(
        check_endpoint(
            "Notifications",
            "GET",
            "/api/notifications",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Audit Logs",
            "GET",
            "/api/audit-logs",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Reports List",
            "GET",
            "/api/reports",
            headers=auth_headers
        )
    )

    results.append(
        check_endpoint(
            "Users List",
            "GET",
            "/api/users",
            headers=auth_headers
        )
    )

    # ============================================================
    # FINAL RESULT
    # ============================================================

    passed_count = sum(
        1 for passed, _ in results if passed
    )

    total_count = len(results)

    failed_count = total_count - passed_count

    print("=" * 70)
    print(
        f"TEST RESULTS: {passed_count}/{total_count} PASSED "
        f"({passed_count / total_count * 100:.1f}%)"
    )
    print(f"FAILED: {failed_count}")
    print("=" * 70)

    # Make pytest fail if even one endpoint fails
    assert passed_count == total_count, (
        f"{failed_count} endpoint test(s) failed."
    )

    return results


# ================================================================
# PYTEST ENTRY POINT
# ================================================================

def test_all_api_endpoints():
    run_all_tests()


# ================================================================
# MANUAL EXECUTION
# ================================================================

if __name__ == "__main__":
    run_all_tests()