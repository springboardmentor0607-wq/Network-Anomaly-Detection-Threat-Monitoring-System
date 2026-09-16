from flask import Blueprint, request, jsonify
from services.live_monitor import live_monitor_service

live_monitoring_bp = Blueprint("live_monitoring", __name__)

# Start route (with aliases)
@live_monitoring_bp.route("/live-monitoring/start", methods=["POST"])
@live_monitoring_bp.route("/live/start", methods=["POST"])
@live_monitoring_bp.route("/api/live/start", methods=["POST"])
def start_live_monitoring():
    """Starts background real network packet capture non-blockingly."""
    print("[BACKEND LOG] START REQUEST received")
    try:
        data = request.get_json(silent=True) or {}
        interface = data.get("interface") or data.get("iface")
        print(f"[BACKEND LOG] Request interface parameter: '{interface}'")

        validated_iface = live_monitor_service.validate_interface(interface)
        print(f"[BACKEND LOG] INTERFACE VALIDATED: '{validated_iface}'")

        print("[BACKEND LOG] WORKER STARTING")
        success, message, status_info = live_monitor_service.start_worker(interface=validated_iface)
        print("[BACKEND LOG] RETURNING START RESPONSE")

        return jsonify({
            "status": "success" if success else "error",
            "message": message,
            "requires_npcap": status_info.get("requires_npcap", False),
            "details": status_info
        }), 200
    except Exception as e:
        print(f"[BACKEND LOG] Exception in start_live_monitoring: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Failed to start live monitoring: {str(e)}",
            "requires_npcap": False
        }), 500

# Stop route (with aliases)
@live_monitoring_bp.route("/live-monitoring/stop", methods=["POST"])
@live_monitoring_bp.route("/live/stop", methods=["POST"])
@live_monitoring_bp.route("/api/live/stop", methods=["POST"])
def stop_live_monitoring():
    """Stops background real network packet capture cleanly."""
    print("[BACKEND LOG] STOP REQUEST received")
    try:
        success, message, status_info = live_monitor_service.stop()
        print(f"[BACKEND LOG] STOP EXECUTED: success={success}")
        return jsonify({
            "status": "success" if success else "error",
            "message": message,
            "details": status_info
        }), 200
    except Exception as e:
        print(f"[BACKEND LOG] Exception in stop_live_monitoring: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to stop live monitoring: {str(e)}"
        }), 500

# Status route (with aliases)
@live_monitoring_bp.route("/live-monitoring/status", methods=["GET"])
@live_monitoring_bp.route("/live/status", methods=["GET"])
@live_monitoring_bp.route("/api/live/status", methods=["GET"])
def get_live_monitoring_status():
    """Returns current live network monitoring status and aggregate metrics."""
    try:
        status_info = live_monitor_service.get_status()
        return jsonify(status_info), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch live monitoring status: {str(e)}"
        }), 500

# Flows route (with aliases)
@live_monitoring_bp.route("/live-monitoring/flows", methods=["GET"])
@live_monitoring_bp.route("/live/flows", methods=["GET"])
@live_monitoring_bp.route("/api/live/flows", methods=["GET"])
def get_live_monitoring_flows():
    """Returns live flow records and updated metrics."""
    try:
        limit = request.args.get("limit", default=50, type=int)
        data = live_monitor_service.get_flows(limit=limit)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch live flows: {str(e)}"
        }), 500

# Interfaces route (with aliases)
@live_monitoring_bp.route("/live-monitoring/interfaces", methods=["GET"])
@live_monitoring_bp.route("/live/interfaces", methods=["GET"])
@live_monitoring_bp.route("/api/live/interfaces", methods=["GET"])
def get_live_monitoring_interfaces():
    """Returns list of cross-platform host network interfaces."""
    try:
        ifaces = live_monitor_service.get_available_interfaces()
        return jsonify({"interfaces": ifaces}), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to list network interfaces: {str(e)}"
        }), 500
