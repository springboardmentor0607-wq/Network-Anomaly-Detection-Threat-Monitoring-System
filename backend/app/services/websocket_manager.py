import asyncio
import datetime
import logging
from typing import Any, Dict, List
from fastapi import WebSocket
from bson import ObjectId

logger = logging.getLogger("netshield.backend.websocket")


def clean_json_serializable(data: Any) -> Any:
    """Recursively convert ObjectId and other non-serializable objects to string/serializable values."""
    if isinstance(data, dict):
        return {k: clean_json_serializable(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_json_serializable(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, datetime.datetime):
        return data.isoformat()
    return data


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total active connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast a JSON message payload to all active WebSocket connections."""
        if not self.active_connections:
            return

        cleaned_message = clean_json_serializable(message)
        disconnected: List[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(cleaned_message)
            except Exception as e:
                logger.warning(f"Error transmitting to WebSocket client: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    def broadcast_sync(self, message: Dict[str, Any]) -> None:
        """Schedule asynchronous broadcast execution from synchronous context if event loop is active."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.broadcast(message))
        except Exception as e:
            logger.warning(f"Could not schedule WebSocket broadcast: {e}")


ws_manager = ConnectionManager()
