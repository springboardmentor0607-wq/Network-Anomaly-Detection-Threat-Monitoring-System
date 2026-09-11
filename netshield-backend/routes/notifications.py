from flask import Blueprint, request, jsonify
from models.notification_service import (
    get_notifications,
    get_unread_notification_count,
    mark_notification_as_read,
    mark_all_notifications_as_read
)

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/notifications", methods=["GET"])
def list_notifications():
    """
    Fetches list of security notifications with optional status filter.
    """
    try:
        status_filter = request.args.get("status")
        limit = int(request.args.get("limit", 50))
        notifications = get_notifications(limit=limit, status_filter=status_filter)
        return jsonify(notifications), 200
    except Exception as e:
        return jsonify({"message": f"Error retrieving notifications: {str(e)}"}), 500

@notifications_bp.route("/notifications/unread-count", methods=["GET"])
def unread_count():
    """
    Returns total number of unread security notifications.
    """
    try:
        count = get_unread_notification_count()
        return jsonify({"unread_count": count}), 200
    except Exception as e:
        return jsonify({"message": f"Error retrieving unread count: {str(e)}"}), 500

@notifications_bp.route("/notifications/<notification_id>/read", methods=["PATCH", "POST"])
def mark_read(notification_id):
    """
    Marks a single notification as read.
    """
    try:
        mark_notification_as_read(notification_id)
        return jsonify({"message": "Notification marked as read", "notification_id": notification_id}), 200
    except Exception as e:
        return jsonify({"message": f"Error marking notification as read: {str(e)}"}), 500

@notifications_bp.route("/notifications/mark-all-read", methods=["POST"])
def mark_all_read():
    """
    Marks all notifications as read.
    """
    try:
        mark_all_notifications_as_read()
        return jsonify({"message": "All notifications marked as read"}), 200
    except Exception as e:
        return jsonify({"message": f"Error marking all notifications as read: {str(e)}"}), 500
