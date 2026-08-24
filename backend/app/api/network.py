import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request

from app.auth.handler import get_current_user
from app.services.network_monitoring import (
    EMPTY_ANALYTICS,
    ensure_dataset_loaded_async,
    get_cached_analytics,
    get_cached_dataset_state,
    get_dataset_status,
    query_traffic_page,
)
from app.services.audit_logger import log_audit_event

router = APIRouter()
logger = logging.getLogger("netshield.backend.network")


def _loading_payload(message: str) -> Dict[str, Any]:
    return {
        "dataset_status": "loading",
        "message": message,
    }


@router.get("/traffic")
async def get_network_traffic(
    request: Request,
    current_user: dict = Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=100),
    page_size: int | None = Query(default=None, ge=1, le=100),
    search: str = Query(default=""),
    protocol: str = Query(default=""),
    threat_level: str = Query(default=""),
    dataset_name: str = Query(default=""),
    source: str = Query(default="all"),
    alerts_only: bool = Query(default=True),
):
    """Return paginated processed traffic records for the monitoring dashboard and security alerts feed."""
    await log_audit_event(request, current_user, "Network Traffic Viewed", "Network")
    effective_limit = page_size or limit

    try:
        records, total_records, total_ingested, dataset_status = await query_traffic_page(
            page=page,
            limit=effective_limit,
            search=search,
            protocol=protocol,
            threat_level=threat_level,
            dataset_name=dataset_name,
            source_type=source,
            alerts_only=alerts_only,
        )
    except Exception as exc:
        logger.exception("Failed to load processed network traffic")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Network traffic data is temporarily unavailable",
        ) from exc

    if dataset_status == "loading":
        return {
            **_loading_payload("Dataset preprocessing is still running. Please retry shortly."),
            "page": page,
            "limit": effective_limit,
            "total_records": 0,
            "total_ingested": 0,
            "data": [],
        }

    if dataset_status == "failed":
        state = get_cached_dataset_state()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=state.get("error") or "Dataset preprocessing failed",
        )

    return {
        "dataset_status": dataset_status,
        "page": page,
        "limit": effective_limit,
        "total_records": total_records,
        "total_ingested": total_ingested,
        "data": records,
    }


@router.get("/statistics")
async def get_network_statistics(request: Request, current_user: dict = Depends(get_current_user)):
    """Return cached startup statistics for the loaded dataset pipeline."""
    await log_audit_event(request, current_user, "Network Statistics Viewed", "Network")
    try:
        dataset_status = await ensure_dataset_loaded_async()
        state = get_cached_dataset_state()
    except Exception as exc:
        logger.exception("Failed to load network dataset statistics")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Network statistics are temporarily unavailable",
        ) from exc

    summary = state.get("summary", {})
    return {
        "dataset_status": dataset_status,
        "datasets_loaded": summary.get("datasets_loaded", 0),
        "rows_loaded": summary.get("rows_loaded", 0),
        "rows_after_preprocessing": summary.get("rows_after_preprocessing", 0),
        "duplicates_removed": summary.get("duplicates_removed", 0),
        "missing_values_removed": summary.get("missing_values_removed", 0),
        "rows_per_dataset": summary.get("rows_per_dataset", []),
        "protocols_detected": summary.get("protocols_detected", []),
        "threat_levels": summary.get("threat_levels", []),
        "traffic_labels": summary.get("traffic_labels", []),
        "startup_time_seconds": summary.get("startup_time_seconds", 0),
        "memory_usage_mb": summary.get("memory_usage_mb", 0),
        "files_failed": summary.get("files_failed", state.get("files_failed", [])),
    }


@router.get("/analytics")
async def get_network_analytics(request: Request, current_user: dict = Depends(get_current_user)):
    """Return analytics summaries for the processed network traffic dataset."""
    await log_audit_event(request, current_user, "Network Analytics Viewed", "Network")
    try:
        dataset_status = await ensure_dataset_loaded_async()
        analytics = get_cached_analytics()
    except Exception as exc:
        logger.exception("Failed to load processed network traffic analytics")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Network analytics are temporarily unavailable",
        ) from exc

    if dataset_status == "loading":
        return {
            **_loading_payload("Dataset preprocessing is still running. Analytics will be available shortly."),
            **EMPTY_ANALYTICS,
        }

    if dataset_status == "failed":
        state = get_cached_dataset_state()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=state.get("error") or "Dataset preprocessing failed",
        )

    return {
        "dataset_status": dataset_status,
        **analytics,
    }


@router.get("/insights")
async def get_realtime_threat_insights(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Return real-time threat detection insights and dashboard statistics."""
    await log_audit_event(request, current_user, "Realtime Threat Insights Viewed", "Network")
    from app.services.threat_insights import get_threat_insights
    return get_threat_insights()


@router.get("/predictions/history")
async def get_prediction_history_route(
    request: Request,
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=100, ge=1, le=1000)
):
    """Return recent prediction history log (timestamp, attack_type, confidence, severity, risk_score)."""
    await log_audit_event(request, current_user, "Prediction History Viewed", "Network")
    from app.services.threat_insights import get_prediction_history
    return {
        "total": len(get_prediction_history(limit)),
        "history": get_prediction_history(limit)
    }


@router.post("/predict")
async def predict_traffic(
    packet_data: dict,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate model prediction for an incoming packet payload,
    automatically recording real-time threat insights.
    """
    await log_audit_event(request, current_user, "Traffic Prediction Executed", "Network")
    from app.services.network_monitoring import predict_network_traffic
    return predict_network_traffic(packet_data)


@router.post("/live-capture/start")
async def start_live_capture(
    request: Request,
    payload: dict = None,
    current_user: dict = Depends(get_current_user)
):
    """Start PyShark / TShark live network packet capture."""
    await log_audit_event(request, current_user, "Live Packet Capture Started", "Network")
    from app.services.live_packet_capture import live_capture_service
    
    # Task 9 Logs
    username = current_user.get("email") or current_user.get("full_name") or "Unknown"
    logger.info("[LiveCapture] Requested start")
    logger.info(f"[LiveCapture] Authenticated user: {username}")
    logger.info(f"[LiveCapture] TShark available: {live_capture_service.tshark_available}")

    if not live_capture_service.tshark_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TShark/Wireshark is not installed or available on this system's PATH. Live packet capture is disabled."
        )
    interface = (payload or {}).get("interface")
    duration = int((payload or {}).get("duration", 60))
    return await live_capture_service.start_capture(interface=interface, duration=duration)


@router.post("/live-capture/stop")
async def stop_live_capture(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Stop live network packet capture."""
    await log_audit_event(request, current_user, "Live Packet Capture Stopped", "Network")
    from app.services.live_packet_capture import live_capture_service
    return await live_capture_service.stop_capture()


@router.get("/live-capture/status")
async def get_live_capture_status(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get status of live network packet capture service."""
    await log_audit_event(request, current_user, "Live Packet Capture Status Viewed", "Network")
    from app.services.live_packet_capture import live_capture_service
    return live_capture_service.get_status()


