import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db import get_db_connection

register_bp = Blueprint("register", __name__)

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

@register_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "").strip()

    if not full_name:
        return jsonify({"message": "Full Name is required"}), 400

    if not email:
        return jsonify({"message": "Email address is required"}), 400

    if not re.match(EMAIL_REGEX, email):
        return jsonify({"message": "Invalid email address format"}), 400

    if not password:
        return jsonify({"message": "Password is required"}), 400

    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long"}), 400

    if not role:
        return jsonify({"message": "Security Role selection is required"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection offline"}), 503

    cursor = conn.cursor()

    try:
        # Check for duplicate email addresses
        cursor.execute("""
            SELECT email FROM users WHERE LOWER(email) = LOWER(%s)
        """, (email,))

        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({
                "message": "Email address is already registered"
            }), 409

        # Generate hashed password
        hashed_password = generate_password_hash(password)

        # Derive username from email prefix if frontend does not specify username
        derived_username = data.get("username", "").strip() or email.split("@")[0]

        cursor.execute("""
            INSERT INTO users(full_name, username, email, password, role)
            VALUES (%s, %s, %s, %s, %s)
        """, (full_name, derived_username, email, hashed_password, role))

        conn.commit()

        return jsonify({
            "message": "User Registered Successfully!"
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({
            "message": f"Database registration failed: {str(e)}"
        }), 500

    finally:
        cursor.close()