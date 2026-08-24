import asyncio
import datetime
import logging
import os
import shutil
import time
from typing import Any, Dict, List, Optional

from app.services.network_monitoring import predict_network_traffic
from app.services.packet_feature_extractor import extract_features_from_packet
from app.services.websocket_manager import ws_manager
from app.config import settings

logger = logging.getLogger("netshield.backend.live_packet_capture")


class LivePacketCaptureService:
    def __init__(self):
        self.is_capturing: bool = False
        self.packet_count: int = 0
        self.threats_detected: int = 0
        # Load interface directly from settings class
        self.active_interface: str = settings.NETSHIELD_CAPTURE_INTERFACE
        self.tshark_available: bool = False
        self._capture_task: Optional[asyncio.Task] = None
        self._recent_live_packets: List[Dict[str, Any]] = []
        self._recent_live_alerts: List[Dict[str, Any]] = []

        # Check if tshark is installed on PATH or default Windows Wireshark folder
        self._check_tshark()

    def get_recent_live_alerts(self, limit: int = 500) -> List[Dict[str, Any]]:
        """Return recent live threat alerts captured from real-time network monitoring."""
        return list(self._recent_live_alerts[:limit])

    def _check_tshark(self):
        """Check if TShark executable is present using a robust discovery strategy."""
        # 1. Check direct setting path
        setting_path = settings.NETSHIELD_TSHARK_PATH
        if setting_path and os.path.exists(setting_path):
            self.tshark_available = True
            tshark_dir = os.path.dirname(setting_path)
            if tshark_dir not in os.environ["PATH"]:
                os.environ["PATH"] += os.pathsep + tshark_dir
            logger.info(f"TShark detected: {setting_path}")
            return

        # 2. Environment/configured TShark path check
        env_paths = [os.getenv("NETSHIELD_TSHARK_PATH"), os.getenv("TSHARK_PATH")]
        for p in env_paths:
            if p and os.path.exists(p):
                self.tshark_available = True
                tshark_dir = os.path.dirname(p)
                if tshark_dir not in os.environ["PATH"]:
                    os.environ["PATH"] += os.pathsep + tshark_dir
                logger.info(f"TShark detected: {p}")
                return

        # 3. Preferred search locations
        candidates = [
            r"E:\Wireshark\tshark.exe",
            r"C:\Program Files\Wireshark\tshark.exe",
            r"C:\Program Files (x86)\Wireshark\tshark.exe",
        ]
        for path in candidates:
            if os.path.exists(path):
                self.tshark_available = True
                tshark_dir = os.path.dirname(path)
                if tshark_dir not in os.environ["PATH"]:
                    os.environ["PATH"] += os.pathsep + tshark_dir
                logger.info(f"TShark detected: {path}")
                return

        # 4. PATH lookup using shutil.which
        which_path = shutil.which("tshark")
        if which_path:
            self.tshark_available = True
            logger.info(f"TShark detected: {which_path}")
            return

        self.tshark_available = False
        logger.warning("TShark could not be detected. Live packet capture is disabled.")

    def get_status(self) -> Dict[str, Any]:
        """Return current live packet capture service status."""
        return {
            "is_capturing": self.is_capturing,
            "packet_count": self.packet_count,
            "threats_detected": self.threats_detected,
            "live_alerts_count": len(self._recent_live_alerts),
            "active_interface": self.active_interface,
            "tshark_available": self.tshark_available,
            "mode": "PyShark/TShark Live" if self.tshark_available else "Live Capture Simulation (Fallback)"
        }

    async def start_capture(self, interface: Optional[str] = None, duration: int = 60) -> Dict[str, Any]:
        """Start background live packet capture."""
        logger.info("[LiveCapture] Requested start")
        if self.is_capturing:
            logger.warning("[LiveCapture] Capture already running. Skipping duplicate thread creation.")
            return {"message": "Live capture already running", "status": self.get_status()}

        if interface:
            self.active_interface = interface

        self.is_capturing = True
        logger.info(f"[LiveCapture] Capture interface: {self.active_interface}")
        
        # Determine tshark path for logging
        tshark_exec = shutil.which("tshark") or r"E:\Wireshark\tshark.exe"
        logger.info(f"[LiveCapture] TShark path: {tshark_exec}")
        logger.info(f"[LiveCapture] TShark available: {self.tshark_available}")
        
        self._capture_task = asyncio.create_task(self._run_capture_loop(duration))
        logger.info("[LiveCapture] Capture started")
        
        return {
            "message": "Live packet capture started",
            "status": self.get_status()
        }

    async def stop_capture(self) -> Dict[str, Any]:
        """Stop background live packet capture."""
        self.is_capturing = False
        if self._capture_task and not self._capture_task.done():
            self._capture_task.cancel()
            try:
                await self._capture_task
            except asyncio.CancelledError:
                pass
        self._capture_task = None
        logger.info("[LiveCapture] Stopped live packet capture")
        return {"message": "Live packet capture stopped", "status": self.get_status()}

    async def _run_capture_loop(self, duration: int):
        """Background async loop capturing and processing live packets."""
        start_time = time.time()

        if self.tshark_available:
            try:
                import pyshark
                from pyshark.capture.capture import StopCapture
                interface_arg = str(self.active_interface)
                
                # Determine TShark executable path for PyShark parameter
                tshark_exec = None
                env_paths = [os.getenv("NETSHIELD_TSHARK_PATH"), os.getenv("TSHARK_PATH")]
                for p in env_paths:
                    if p and os.path.exists(p):
                        tshark_exec = p
                        break
                if not tshark_exec:
                    candidates = [
                        r"E:\Wireshark\tshark.exe",
                        r"C:\Program Files\Wireshark\tshark.exe",
                        r"C:\Program Files (x86)\Wireshark\tshark.exe",
                    ]
                    for path in candidates:
                        if os.path.exists(path):
                            tshark_exec = path
                            break
                if not tshark_exec:
                    tshark_exec = shutil.which("tshark")
                
                logger.info(f"[LiveCapture] Initializing PyShark LiveCapture on interface: {interface_arg} with tshark_path: {tshark_exec}")
                capture = pyshark.LiveCapture(interface=interface_arg, tshark_path=tshark_exec)
                logger.info("[LiveCapture] PyShark initialization successful")
                
                def packet_callback(packet):
                    if not self.is_capturing or (time.time() - start_time > duration):
                        raise StopCapture()
                    asyncio.create_task(self._process_packet(packet))

                # Use async packet retriever method to run on current event loop without nesting loops
                await capture.packets_from_tshark(packet_callback)
            except Exception as exc:
                logger.error(f"[LiveCapture] PyShark live capture encountered error: {exc}")
                ws_manager.broadcast_sync({
                    "type": "LIVE_CAPTURE_ERROR",
                    "data": {"error": f"Live packet capture failed: {str(exc)}"}
                })
        else:
            logger.error("[LiveCapture] TShark is not available. Live capture loop cannot run.")
            ws_manager.broadcast_sync({
                "type": "LIVE_CAPTURE_ERROR",
                "data": {"error": "TShark/Wireshark is not installed or available on this system."}
            })

        self.is_capturing = False

    async def _process_packet(self, packet_obj: Any):
        """Process extracted packet features through ML prediction pipeline."""
        logger.info("[LiveCapture] Packet captured")
        feat_dict = extract_features_from_packet(packet_obj)
        logger.info("[LiveCapture] Feature extraction successful")
        self.packet_count += 1
        logger.info("LIVE PACKET CAPTURED")

        # Check for attack testing override or run ML threat prediction pipeline
        override_attack = None
        if isinstance(packet_obj, dict) and packet_obj.get("force_attack"):
            override_attack = str(packet_obj.get("attack_type") or "DoS Hulk")

        pred_result = predict_network_traffic(feat_dict)
        logger.info("[LiveCapture] ML prediction successful")

        if override_attack:
            atk_type = override_attack
            is_attack = True
            risk_score = float(packet_obj.get("risk_score") or 92.5)
            severity = str(packet_obj.get("severity") or "High")
            pred_result["attack_type"] = atk_type
            pred_result["severity"] = severity
            pred_result["risk_score"] = risk_score
            pred_result["confidence"] = 0.95
        else:
            atk_type = str(pred_result.get("attack_type", "")).strip()
            is_attack = atk_type.lower() not in ("benign", "normal", "safe")
            risk_score = float(pred_result.get("risk_score", 0.0))
            severity = str(pred_result.get("severity") or "Low").strip()

        live_alert = None
        if is_attack:
            self.threats_detected += 1
            logger.info(f"LIVE PREDICTION: {atk_type}")
            logger.info(f"LIVE RISK SCORE: {risk_score}")
            logger.info(f"LIVE SEVERITY: {severity}")

            alert_id = f"LIVE-ALT-{self.packet_count}-{int(time.time())}"
            live_alert = {
                "alert_id": alert_id,
                "timestamp": pred_result.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "source": "Live Network",
                "dataset": "LIVE NETWORK",
                "dataset_name": "LIVE NETWORK",
                "source_ip": feat_dict.get("source_ip") or "192.168.1.100",
                "destination_ip": feat_dict.get("destination_ip") or "10.0.0.1",
                "src_port": int(feat_dict.get("source_port", 49152)),
                "dst_port": int(feat_dict.get("destination_port", 80)),
                "source_port": int(feat_dict.get("source_port", 49152)),
                "destination_port": int(feat_dict.get("destination_port", 80)),
                "protocol": feat_dict.get("protocol") or "TCP",
                "attack_type": atk_type,
                "traffic_label": atk_type,
                "severity": severity,
                "threat_level": severity,
                "risk_score": risk_score,
                "confidence": float(pred_result.get("confidence", 0.95)),
                "prediction": "Attack",
                "is_live": True,
                "status": "Open",
            }
            self._recent_live_alerts.insert(0, live_alert)
            if len(self._recent_live_alerts) > 1000:
                self._recent_live_alerts.pop()

            logger.info(f"LIVE ALERT CREATED: {alert_id}")

            # Store in the same MongoDB "alerts" collection used by /network/traffic
            try:
                from app.database.database import db_connection
                if db_connection.database is not None:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        mongo_doc = dict(live_alert)
                        async def save_alert(doc):
                            await db_connection.database["alerts"].insert_one(doc)
                        loop.create_task(save_alert(mongo_doc))
            except Exception as exc:
                logger.warning(f"Could not persist live alert to MongoDB 'alerts' collection: {exc}")

            # Broadcast NEW_ALERT WebSocket event immediately
            try:
                alert_payload = dict(live_alert)
                alert_payload.pop("_id", None)
                ws_manager.broadcast_sync({
                    "type": "NEW_ALERT",
                    "data": alert_payload
                })
                logger.info(f"LIVE NEW_ALERT WebSocket broadcast successful")
            except Exception as exc:
                logger.warning(f"Could not broadcast live capture NEW_ALERT event: {exc}")
        else:
            logger.info("LIVE PREDICTION: BENIGN")
            logger.info("NO SECURITY ALERT CREATED")

        # Live WebSocket broadcast of packet prediction and threat alert
        event_payload = {
            "type": "LIVE_PACKET",
            "data": {
                "packet_number": self.packet_count,
                "timestamp": pred_result.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "source": "Live Network",
                "dataset": "LIVE NETWORK",
                "dataset_name": "LIVE NETWORK",
                "source_ip": feat_dict.get("source_ip"),
                "destination_ip": feat_dict.get("destination_ip"),
                "src_port": feat_dict.get("source_port"),
                "dst_port": feat_dict.get("destination_port"),
                "source_port": feat_dict.get("source_port"),
                "destination_port": feat_dict.get("destination_port"),
                "protocol": feat_dict.get("protocol"),
                "attack_type": atk_type,
                "traffic_label": atk_type,
                "severity": severity,
                "threat_level": severity,
                "confidence": float(pred_result.get("confidence", 0.95)),
                "risk_score": risk_score,
                "prediction": "Attack" if is_attack else "Normal",
                "is_live": True,
                "is_attack": is_attack,
            }
        }
        ws_manager.broadcast_sync(event_payload)


# Singleton instance
live_capture_service = LivePacketCaptureService()
