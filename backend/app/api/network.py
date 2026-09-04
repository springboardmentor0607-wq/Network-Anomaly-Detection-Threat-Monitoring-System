import psutil
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Network & System"])

@router.get("/network/status")
def get_network_status():
    return {
        "network_health": "98.2%",
        "connected_devices": 4847,
        "total_packets": "142.8 M",
        "bandwidth_usage": "3.4 Gbps",
        "average_latency": "14 ms",
        "active_connections": 1284,
        "suspicious_connections": 18,
        "blocked_connections": 142
    }

@router.get("/system/status")
def get_system_status():
    return {
        "cpu_usage": f"{psutil.cpu_percent()}%",
        "memory_usage": f"{psutil.virtual_memory().percent}%",
        "api_status": "Online (200 OK)",
        "database_status": "Connected (SQLite/WAL)",
        "ml_inference_engine": "Ready",
        "uptime": "99.98%"
    }