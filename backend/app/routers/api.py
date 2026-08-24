from fastapi import APIRouter
from app.api import health

api_router = APIRouter()

# Include health router
api_router.include_router(health.router, prefix="", tags=["system"])

from app.api import auth, admin, analyst, network, alerts, websocket, incidents, threat_analytics, reports

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(analyst.router, prefix="/analyst", tags=["analyst"])
api_router.include_router(network.router, prefix="/network", tags=["network"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(threat_analytics.router, prefix="/threat-intelligence", tags=["threat-intelligence"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

# Expose /dashboard directly on api_router under prefix /api/v1
from app.api.analyst import view_dashboard
api_router.get("/dashboard", tags=["analyst"])(view_dashboard)
