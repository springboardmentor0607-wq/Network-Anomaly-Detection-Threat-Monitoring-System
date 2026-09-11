from fastapi import APIRouter, HTTPException
from bson import ObjectId
import bcrypt
from datetime import datetime
from app.schemas.user import UserRegister, UserLogin
from app.database.mongodb import (
    users_collection,
    predictions_collection,
    audit_collection
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# ==========================================
# REGISTER
# ==========================================

@router.post("/register")
def register(user: UserRegister):

    existing = users_collection.find_one(
        {"email": user.email}
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt()
    )

    users_collection.insert_one({

        "name": user.name,

        "email": user.email,

        "password": hashed_password,

        "role": user.role,

        "department": "General",

        "status": "Active"

    })

    return {

        "message": "Registration Successful"

    }


# ==========================================
# LOGIN
# ==========================================

@router.post("/login")
def login(user: UserLogin):

    db_user = users_collection.find_one(
        {"email": user.email}
    )

    if db_user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    password_ok = bcrypt.checkpw(

        user.password.encode("utf-8"),

        db_user["password"]

    )

    if not password_ok:

        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    return {

        "message": "Login Successful",

        "name": db_user["name"],

        "email": db_user["email"],

        "role": db_user["role"]

    }


# ==========================================
# GET ALL USERS
# ==========================================

@router.get("/users")
def get_users():

    users = []

    for user in users_collection.find():

        users.append({

            "id": str(user["_id"]),

            "name": user["name"],

            "email": user["email"],

            "role": user["role"],

            "department": user.get(
                "department",
                "General"
            ),

            "status": user.get(
                "status",
                "Active"
            )

        })

    return users


# ==========================================
# DELETE USER
# ==========================================

@router.delete("/users/{id}")
def delete_user(id: str):

    result = users_collection.delete_one(
        {"_id": ObjectId(id)}
    )

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {

        "message": "User Deleted Successfully"

    }


# ==========================================
# ROLE SUMMARY
# ==========================================

@router.get("/roles")
def get_roles():

    role_master = [

        {
            "role": "Administrator",
            "permissions": "Full Access"
        },

        {
            "role": "Security Analyst",
            "permissions": "Threat Analysis"
        },

        {
            "role": "SOC Operator",
            "permissions": "Monitoring"
        }

    ]

    result = []

    for role in role_master:

        count = users_collection.count_documents(
            {
                "role": role["role"]
            }
        )

        result.append({

            "role": role["role"],

            "users": count,

            "permissions": role["permissions"],

            "status": "Active"

        })

    return result

# ==========================================
# ORGANIZATION INFORMATION
# ==========================================

@router.get("/organization")
def get_organization():

    total_users = users_collection.count_documents({})

    administrators = users_collection.count_documents(
        {"role": "Administrator"}
    )

    analysts = users_collection.count_documents(
        {"role": "Security Analyst"}
    )

    operators = users_collection.count_documents(
        {"role": "SOC Operator"}
    )

    departments = [

        {
            "id": 1,
            "name": "Administration",
            "manager": "System Administrator",
            "employees": administrators,
            "status": "Active"
        },

        {
            "id": 2,
            "name": "Cyber Security",
            "manager": "Lead Security Analyst",
            "employees": analysts,
            "status": "Active"
        },

        {
            "id": 3,
            "name": "SOC Operations",
            "manager": "SOC Team Lead",
            "employees": operators,
            "status": "Active"
        }

    ]

    return {

        "organization": "NetShield AI Technologies",

        "location": "Hyderabad, India",

        "industry": "Cyber Security & AI",

        "established": "2026",

        "total_users": total_users,

        "departments": departments

    }
    
    # ==========================================
# THREAT ALERTS
# ==========================================

@router.get("/alerts")
def get_alerts():

    alerts = []

    index = 100

    for prediction in predictions_collection.find().sort("created_at", -1):

        summary = prediction.get("summary", {})

        if len(summary) == 0:
            continue

        threat = max(summary, key=summary.get)

        if threat.lower() == "normal":

            severity = "Low"

        elif "dos" in threat.lower() or "ddos" in threat.lower():

            severity = "Critical"

        elif "brute" in threat.lower():

            severity = "High"

        else:

            severity = "Medium"

        alerts.append({

            "id": index,

            "threat": threat,

            "severity": severity,

            "assigned": "AI Engine",

            "status": "Detected",

            "time": prediction["created_at"].strftime("%d-%m-%Y %H:%M")

        })

        index += 1

    return alerts

# ==========================================
# GET AUDIT LOGS
# ==========================================

@router.get("/audit")
def get_audit_logs():

    logs = []

    for log in audit_collection.find().sort("time", -1):

        logs.append({

            "id": str(log["_id"]),

            "user": log["user"],

            "action": log["action"],

            "module": log["module"],

            "time": log["time"].strftime("%d-%m-%Y %H:%M"),

            "status": log["status"]

        })

    return logs


# ==========================================
# ADD AUDIT LOG
# ==========================================

@router.post("/audit")
def add_audit_log(log: dict):

    audit_collection.insert_one({

        "user": log["user"],

        "action": log["action"],

        "module": log["module"],

        "status": log["status"],

        "time": datetime.now()

    })

    return {

        "message": "Audit Log Added"

    }