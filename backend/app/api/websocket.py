import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager

router = APIRouter()
logger = logging.getLogger("netshield.backend.websocket.api")


@router.websocket("/alerts")
@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time security threat notifications stream.
    """
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "CONNECTED",
            "message": "Connected to NetShield AI Threat Notification Stream"
        })
        while True:
            # Maintain active connection; handle incoming pings/messages from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.warning(f"WebSocket session error: {exc}")
        ws_manager.disconnect(websocket)
