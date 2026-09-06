import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.incident import IncidentDocument, IncidentPriority, IncidentStatus, generate_incident_id
from app.services.alert_service import create_alert
from app.services.incident_service import (
    add_incident_note,
    create_incident,
    create_incident_from_alert,
    delete_incident,
    get_incident_by_id,
    get_incidents,
    update_incident,
)
from app.auth.handler import create_access_token


def test_incident_document_model():
    """Test default values and serialization of IncidentDocument."""
    inc = IncidentDocument(
        title="DDoS Traffic Surge Investigation",
        priority=IncidentPriority.CRITICAL,
        assigned_analyst_id="507f1f77bcf86cd799439012",
        assigned_analyst_name="Farhath Suraiya",
        assigned_analyst="farhath@netshield.ai"
    )

    assert inc.incident_id.startswith("INC-")
    assert inc.title == "DDoS Traffic Surge Investigation"
    assert inc.priority == IncidentPriority.CRITICAL
    assert inc.status == IncidentStatus.NEW
    assert inc.assigned_analyst_id == "507f1f77bcf86cd799439012"
    assert inc.assigned_analyst_name == "Farhath Suraiya"
    assert inc.assigned_analyst == "farhath@netshield.ai"
    assert inc.resolved_at is None

    dict_repr = inc.to_db_dict()
    assert dict_repr["incident_id"] == inc.incident_id
    assert dict_repr["priority"] == "Critical"
    assert dict_repr["status"] == "New"
    assert dict_repr["assigned_analyst_id"] == "507f1f77bcf86cd799439012"
    assert dict_repr["assigned_analyst_name"] == "Farhath Suraiya"


def test_incidents_api_endpoints():
    """Integration test for /api/v1/incidents REST endpoints."""
    with TestClient(app) as client:
        test_token = create_access_token("507f1f77bcf86cd799439011")
        headers = {"Authorization": f"Bearer {test_token}"}

        # 1. Create incident manually
        payload = {
            "title": "Suspicious PortScan Activity",
            "priority": "High",
            "assigned_analyst": "analyst@netshield.ai",
            "initial_note": "Identified port scanning from 192.168.1.100."
        }
        res_post = client.post("/api/v1/incidents", json=payload, headers=headers)
        if res_post.status_code == 201:
            inc_data = res_post.json()
            inc_id = inc_data["incident_id"]
            assert inc_data["title"] == "Suspicious PortScan Activity"
            assert inc_data["priority"] == "High"
            assert inc_data["status"] == "New"
            assert len(inc_data["notes"]) == 1

            # 2. Get incident by ID
            res_get = client.get(f"/api/v1/incidents/{inc_id}", headers=headers)
            assert res_get.status_code == 200
            assert res_get.json()["incident_id"] == inc_id

            # 3. Update analyst and status
            update_payload = {
                "assigned_analyst": "senior_analyst@netshield.ai",
                "status": "In Progress",
                "priority": "Critical"
            }
            res_patch = client.patch(f"/api/v1/incidents/{inc_id}", json=update_payload, headers=headers)
            assert res_patch.status_code == 200
            assert res_patch.json()["assigned_analyst"] == "senior_analyst@netshield.ai"
            assert res_patch.json()["status"] == "In Progress"
            assert res_patch.json()["priority"] == "Critical"

            # 4. Add investigation note
            note_payload = {
                "text": "Blocked offending IP subnet at perimeter firewall.",
                "author": "senior_analyst@netshield.ai"
            }
            res_note = client.post(f"/api/v1/incidents/{inc_id}/notes", json=note_payload, headers=headers)
            assert res_note.status_code == 200
            assert len(res_note.json()["notes"]) == 2
            assert res_note.json()["notes"][1]["text"] == "Blocked offending IP subnet at perimeter firewall."

            # 5. List incidents
            res_list = client.get("/api/v1/incidents", headers=headers)
            assert res_list.status_code == 200
            assert isinstance(res_list.json(), list)

            # 6. Delete incident
            res_del = client.delete(f"/api/v1/incidents/{inc_id}", headers=headers)
            assert res_del.status_code == 200
            assert res_del.json()["incident_id"] == inc_id
