import os
import sys
import json
import io

# Setup path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import fetch_one, execute_query

def run_tests():
    client = app.test_client()
    
    print("\n=== Testing NetShield AI API Endpoints ===")
    
    # 1. Test /status (Public)
    res = client.get('/status')
    print(f"GET /status: {res.status_code}")
    assert res.status_code == 200
    status_data = json.loads(res.data)
    print(f" - Project: {status_data.get('project')}")
    print(f" - DB Connection: {status_data.get('database_connection')}")
    print(f" - Model Loaded: {status_data.get('model_loaded')}")
    print(f" - Classes: {status_data.get('attack_classes')}")
    
    # Also test /api/status
    res_api = client.get('/api/status')
    assert res_api.status_code == 200
    print(f"GET /api/status: {res_api.status_code} [OK]")
    
    # 2. Test /system-monitor (Public)
    res_sys = client.get('/system-monitor')
    assert res_sys.status_code == 200
    sys_data = json.loads(res_sys.data)
    print(f"GET /system-monitor: {res_sys.status_code} [OK] (CPU: {sys_data['cpu']['usage_percent']}%, RAM: {sys_data['memory']['usage_percent']}%)")
    
    # 3. Test Authentication Login
    res_login = client.post('/api/auth/login', json={
        'email': 'admin@netshield.ai',
        'password': 'Admin@123'
    })
    print(f"POST /api/auth/login: {res_login.status_code}")
    assert res_login.status_code == 200
    login_data = json.loads(res_login.data)
    token = login_data['token']
    headers = {'Authorization': f'Bearer {token}'}
    print(f" - Logged in as: {login_data['user']['name']} ({login_data['user']['role']})")
    
    # 4. Test /upload with sample CSV
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dataset', 'sample_network_traffic.csv')
    if os.path.exists(csv_path):
        with open(csv_path, 'rb') as f:
            file_content = f.read()
        
        data = {
            'file': (io.BytesIO(file_content), 'test_sample.csv')
        }
        res_upload = client.post('/api/upload', data=data, content_type='multipart/form-data', headers=headers)
        print(f"POST /api/upload: {res_upload.status_code}")
        assert res_upload.status_code in (200, 201)
        up_data = json.loads(res_upload.data)
        print(f" - Upload processed: {up_data.get('summary', {}).get('total_analyzed')} rows, {up_data.get('summary', {}).get('threats_detected')} threats detected.")
        print(f" - Evaluation metrics: Accuracy: {up_data.get('evaluation', {}).get('accuracy')}%")
    
    # 5. Test /dashboard-data
    res_dash = client.get('/api/dashboard-data', headers=headers)
    print(f"GET /api/dashboard-data: {res_dash.status_code}")
    assert res_dash.status_code == 200
    dash_data = json.loads(res_dash.data)
    print(f" - Total Traffic: {dash_data['kpi']['total_traffic']}")
    print(f" - Threats: {dash_data['kpi']['threats_detected']}")
    print(f" - Benign: {dash_data['kpi']['benign_traffic']}")
    print(f" - Attack Distribution: {len(dash_data['attack_distribution'])} categories")
    
    # 6. Test /predictions
    res_preds = client.get('/api/predictions?limit=5', headers=headers)
    print(f"GET /api/predictions: {res_preds.status_code}")
    assert res_preds.status_code == 200
    preds_data = json.loads(res_preds.data)
    print(f" - Total predictions in DB: {preds_data['total']}, returned: {len(preds_data['predictions'])}")
    
    # 7. Test /threats
    res_threats = client.get('/api/threats?limit=5', headers=headers)
    print(f"GET /api/threats: {res_threats.status_code}")
    assert res_threats.status_code == 200
    threats_data = json.loads(res_threats.data)
    print(f" - Total threats in DB: {threats_data['total']}, returned: {len(threats_data['threats'])}")
    
    # 8. Test /alerts and updating alert
    res_alerts = client.get('/api/alerts', headers=headers)
    print(f"GET /api/alerts: {res_alerts.status_code}")
    assert res_alerts.status_code == 200
    alerts_data = json.loads(res_alerts.data)
    print(f" - Alerts count: {alerts_data['count']}")
    
    if alerts_data['alerts']:
        a_id = alerts_data['alerts'][0]['id']
        res_up_alert = client.put(f'/api/alerts/{a_id}', json={'status': 'INVESTIGATING'}, headers=headers)
        print(f"PUT /api/alerts/{a_id}: {res_up_alert.status_code}")
        assert res_up_alert.status_code == 200
    
    # 9. Test /incidents, creating incident and updating incident
    res_inc = client.get('/api/incidents', headers=headers)
    print(f"GET /api/incidents: {res_inc.status_code}")
    assert res_inc.status_code == 200
    
    res_create_inc = client.post('/api/incidents', json={
        'title': 'Test Escalated DDoS Incident',
        'description': 'Automated test incident tracking',
        'priority': 'CRITICAL'
    }, headers=headers)
    print(f"POST /api/incidents: {res_create_inc.status_code}")
    assert res_create_inc.status_code == 201
    created_inc_id = json.loads(res_create_inc.data)['incident']['id']
    
    res_resolve_inc = client.put(f'/api/incidents/{created_inc_id}', json={
        'status': 'RESOLVED',
        'resolution': 'Blocked source IPs on border firewall and mitigation completed.'
    }, headers=headers)
    print(f"PUT /api/incidents/{created_inc_id} (Resolve): {res_resolve_inc.status_code}")
    assert res_resolve_inc.status_code == 200
    
    # 10. Test /notifications and mark as read
    res_notif = client.get('/api/notifications', headers=headers)
    print(f"GET /api/notifications: {res_notif.status_code}")
    assert res_notif.status_code == 200
    
    res_read_all = client.put('/api/notifications/read-all', headers=headers)
    print(f"PUT /api/notifications/read-all: {res_read_all.status_code}")
    assert res_read_all.status_code == 200
    
    # 11. Test /reports and generating report
    res_gen_report = client.post('/api/reports', json={
        'report_type': 'Threat Detection Security Report'
    }, headers=headers)
    print(f"POST /api/reports: {res_gen_report.status_code}")
    assert res_gen_report.status_code == 201
    
    res_reports = client.get('/api/reports', headers=headers)
    print(f"GET /api/reports: {res_reports.status_code}")
    assert res_reports.status_code == 200
    
    # 12. Test /threat-intelligence
    res_intel = client.get('/api/threat-intelligence', headers=headers)
    print(f"GET /api/threat-intelligence: {res_intel.status_code}")
    assert res_intel.status_code == 200
    intel_data = json.loads(res_intel.data)
    print(f" - Threat Intel Profiles: {len(intel_data.get('intelligence', []))}")
    
    # 13. Test /attack-visualization
    res_vis = client.get('/api/attack-visualization', headers=headers)
    print(f"GET /attack-visualization: {res_vis.status_code}")
    assert res_vis.status_code == 200
    vis_data = json.loads(res_vis.data)
    print(f" - Visualization classes: {len(vis_data.get('attack_classes', []))}")
    print(f" - Radar data points: {len(vis_data.get('radar_data', []))}")
    
    # 14. Test /weekly-security-trends
    res_trends = client.get('/api/weekly-security-trends', headers=headers)
    print(f"GET /api/weekly-security-trends: {res_trends.status_code}")
    assert res_trends.status_code == 200
    trends_data = json.loads(res_trends.data)
    print(f" - Total Threats: {trends_data['summary']['total_threats']}")
    print(f" - Daily trend points: {len(trends_data['daily_attack_trend'])}")
    print(f" - Weekday activity points: {len(trends_data['threat_activity_by_day'])}")
    print(f" - Most detected attack: {trends_data['weekly_summary']['most_detected_attack']}")
    
    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")

if __name__ == '__main__':
    run_tests()
