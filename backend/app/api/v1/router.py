from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    traffic,
    anomalies,
    threats,
    alerts,
    incidents,
    analytics,
    models,
    datasets,
    reports,
    intelligence,
    audit_logs,
    settings,
)

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(traffic.router)
api_v1_router.include_router(anomalies.router)
api_v1_router.include_router(threats.router)
api_v1_router.include_router(alerts.router)
api_v1_router.include_router(incidents.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(models.router)
api_v1_router.include_router(datasets.router)
api_v1_router.include_router(reports.router)
api_v1_router.include_router(intelligence.router)
api_v1_router.include_router(audit_logs.router)
api_v1_router.include_router(settings.router)
