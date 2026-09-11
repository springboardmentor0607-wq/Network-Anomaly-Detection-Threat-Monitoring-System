from flask import Blueprint, request, jsonify
from models.incident_service import (
    get_incidents,
    get_incident_by_id,
    update_incident
)

incidents_bp = Blueprint("incidents", __name__)

@incidents_bp.route("/incidents", methods=["GET"])
def list_incidents():
    """
    Returns list of incidents with optional search & filter parameters.
    """
    try:
        status_filter = request.args.get("status")
        severity_filter = request.args.get("severity")
        attack_type_filter = request.args.get("attack_type")
        search_term = request.args.get("search")

        incidents = get_incidents(
            status_filter=status_filter,
            severity_filter=severity_filter,
            attack_type_filter=attack_type_filter,
            search_term=search_term
        )
        return jsonify(incidents), 200
    except Exception as e:
        return jsonify({"message": f"Error retrieving incidents: {str(e)}"}), 500

@incidents_bp.route("/incidents/<incident_id>", methods=["GET"])
def get_incident(incident_id):
    """
    Returns complete details of a specific incident, including its audit history.
    """
    try:
        incident = get_incident_by_id(incident_id)
        if not incident:
            return jsonify({"message": "Incident not found"}), 404
        return jsonify(incident), 200
    except Exception as e:
        return jsonify({"message": f"Error retrieving incident details: {str(e)}"}), 500

@incidents_bp.route("/incidents/<incident_id>", methods=["PATCH", "PUT"])
def update_incident_details(incident_id):
    """
    Updates incident status, investigation details, action taken, resolution details, or responsible analyst.
    Records an entry in incident_history.
    """
    try:
        data = request.get_json() or {}
        updated_incident, err = update_incident(incident_id, data)
        if err:
            return jsonify({"message": err}), 404 if "not found" in err.lower() else 400
        return jsonify(updated_incident), 200
    except Exception as e:
        return jsonify({"message": f"Error updating incident: {str(e)}"}), 500

@incidents_bp.route("/incidents/<incident_id>/notes", methods=["POST"])
def add_incident_note(incident_id):
    """
    Adds investigation or resolution notes to an incident.
    """
    try:
        data = request.get_json() or {}
        note = data.get("note") or data.get("notes") or ""
        responsible_user = data.get("responsible_user") or data.get("user") or "Security Analyst"
        note_type = data.get("type", "investigation")  # investigation, action, resolution

        if not note:
            return jsonify({"message": "Note content cannot be empty"}), 400

        update_payload = {
            "responsible_user": responsible_user,
            "notes": note
        }
        if note_type == "resolution":
            update_payload["resolution_details"] = note
            update_payload["status"] = "Resolved"
        elif note_type == "action":
            update_payload["action_taken"] = note
            update_payload["status"] = "Action Required"
        else:
            update_payload["investigation_details"] = note
            update_payload["status"] = "Investigating"

        updated_incident, err = update_incident(incident_id, update_payload)
        if err:
            return jsonify({"message": err}), 400
        return jsonify(updated_incident), 200
    except Exception as e:
        return jsonify({"message": f"Error adding note to incident: {str(e)}"}), 500
