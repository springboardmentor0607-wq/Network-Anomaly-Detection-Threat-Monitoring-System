from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.alerts import router as alerts_router
from app.routes.monitoring import router as monitoring_router

from app.services.live_monitor import start_monitor


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="NetShield AI",
    description="AI-Powered Network Security Operations Center",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# ROUTES
# ============================================================

# Authentication
app.include_router(
    auth_router
)


# Alerts
#
# IMPORTANT:
# All routes inside alerts.py will now start with:
#
# /alerts
#
# Therefore:
#
# @router.get("/")
# becomes:
# GET /alerts/
#
# @router.get("/{alert_id}")
# becomes:
# GET /alerts/{alert_id}
#
# @router.put("/{alert_id}/workflow")
# becomes:
# PUT /alerts/{alert_id}/workflow

app.include_router(
    alerts_router,
    prefix="/alerts",
    tags=["Alerts"]
)


# Monitoring / Reports
app.include_router(
    monitoring_router
)


# ============================================================
# START LIVE MONITOR
# ============================================================

@app.on_event("startup")
def startup_event():

    print(
        "[NETSHIELD AI] Starting Live Network Monitor..."
    )

    start_monitor()


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {
        "message":
            "NetShield AI Live Monitoring Running",
        "status":
            "online"
    }