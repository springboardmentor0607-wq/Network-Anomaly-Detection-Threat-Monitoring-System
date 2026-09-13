import asyncio
import json
import random
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

PROTOCOLS = ["TCP", "UDP", "HTTP", "HTTPS", "DNS", "SSH", "ICMP"]
SOURCE_IPS = ["192.168.1.45", "192.168.1.102", "42.112.98.14", "185.220.101.5", "194.26.29.112", "10.0.4.12", "172.16.0.8"]
DEST_IPS = ["192.168.1.100", "192.168.1.250", "192.168.1.105", "192.168.1.2", "8.8.8.8"]
ATTACK_TYPES = ["Normal", "DoS SYN Flood", "SSH Brute Force", "DNS Tunneling", "Port Scan", "SQL Injection", "XSS Attack"]

@router.websocket("/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(2)
            src_ip = random.choice(SOURCE_IPS)
            dst_ip = random.choice(DEST_IPS)
            protocol = random.choice(PROTOCOLS)
            packets = random.randint(10, 4500)
            bytes_transferred = packets * random.randint(64, 1500)
            attack_type = random.choices(ATTACK_TYPES, weights=[70, 8, 7, 5, 5, 3, 2])[0]
            
            is_anomaly = attack_type != "Normal"
            anomaly_score = round(random.uniform(0.72, 0.99), 2) if is_anomaly else round(random.uniform(0.01, 0.25), 2)
            risk_score = random.randint(65, 98) if is_anomaly else random.randint(5, 25)
            
            telemetry_event = {
                "event_type": "TELEMETRY_PACKET",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "source_ip": src_ip,
                "destination_ip": dst_ip,
                "protocol": protocol,
                "packets": packets,
                "bytes": bytes_transferred,
                "attack_type": attack_type,
                "is_anomaly": is_anomaly,
                "anomaly_score": anomaly_score,
                "risk_score": risk_score,
                "demo_mode": True
            }
            await websocket.send_json(telemetry_event)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
