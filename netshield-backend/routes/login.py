import re
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from db import get_db_connection

login_bp = Blueprint("login", __name__)

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

@login_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    # Validation: Email presence
    if not email:
        return jsonify({
            "message": "Email address is required"
        }), 400

    # Validation: Email format
    if not re.match(EMAIL_REGEX, email):
        return jsonify({
            "message": "Invalid email address format"
        }), 400

    # Validation: Password presence
    if not password:
        return jsonify({
            "message": "Password is required"
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({
            "message": "Database connection offline"
        }), 503

    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT email, password, role, full_name, username
            FROM users
            WHERE LOWER(email) = LOWER(%s)
        """, (email,))

        user = cursor.fetchone()

        if user is None:
            return jsonify({
                "message": "User not found"
            }), 404

        db_email, db_password, db_role, db_full_name, db_username = user

        if check_password_hash(db_password, password):
            return jsonify({
                "message": "Login Successful!",
                "role": db_role,
                "email": db_email,
                "full_name": db_full_name or db_email.split('@')[0],
                "username": db_username or db_email.split('@')[0]
            }), 200
        else:
            return jsonify({
                "message": "Incorrect password"
            }), 401

    except Exception as e:
        conn.rollback()
        return jsonify({
            "message": f"Database query failed: {str(e)}"
        }), 500

    finally:
        cursor.close()