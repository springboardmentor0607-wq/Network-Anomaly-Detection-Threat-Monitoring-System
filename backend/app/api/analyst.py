from fastapi import APIRouter, Depends, Request
from app.auth.handler import RoleChecker
from app.services.audit_logger import log_audit_event

router = APIRouter()

# Enforce Analyst or Admin Role for all routes in this router
analyst_only = RoleChecker(["Security Administrator", "Security Analyst"])

@router.get("/dashboard")
async def view_dashboard(request: Request, current_user: dict = Depends(analyst_only)):
    """Mock endpoint to view the security dashboard. Restricted to Security Analyst and Admin."""
    await log_audit_event(request, current_user, "Dashboard Access", "Analyst")
    return {"message": "Analyst area: Security dashboard", "user": current_user["email"]}

@router.get("/monitoring")
async def view_monitoring(request: Request, current_user: dict = Depends(analyst_only)):
    """Mock endpoint to view monitoring data. Restricted to Security Analyst and Admin."""
    await log_audit_event(request, current_user, "Monitoring Access", "Analyst")
    return {"message": "Analyst area: Live monitoring", "user": current_user["email"]}
