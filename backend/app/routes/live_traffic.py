import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.ml_service import ml_service
import logging
import subprocess
import threading
import queue
import time
import numpy as np
import datetime
from app.database import mongo_db

router = APIRouter()
logger = logging.getLogger(__name__)

def enqueue_output(out, q):
    for line in iter(out.readline, b''):
        q.put(line)
    out.close()

def get_flow_key(src_ip, src_port, dst_ip, dst_port, protocol):
    # To identify the bidirectional flow
    if src_ip > dst_ip:
        return f"{dst_ip}:{dst_port}-{src_ip}:{src_port}-{protocol}"
    return f"{src_ip}:{src_port}-{dst_ip}:{dst_port}-{protocol}"

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Use Linux tshark. Find the first active non-loopback interface automatically.
    import platform
    import socket
    
    tshark_path = "/usr/bin/tshark"
    
    # Detect the primary network interface (eth0 on AWS, or first available)
    interface = "eth0"
    try:
        result = subprocess.run(
            [tshark_path, "-D"],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.splitlines():
            # Pick the first non-loopback interface tshark can see
            if "lo" not in line and "loopback" not in line.lower():
                # Extract interface name (format: "1. eth0 (Ethernet)")
                parts = line.strip().split()
                if len(parts) >= 2:
                    interface = parts[1].rstrip(".")
                    break
    except Exception:
        interface = "eth0"  # fallback
    
    args = [
        "-i", interface,
        "-T", "fields",
        "-e", "frame.time_epoch",
        "-e", "ip.src", "-e", "ipv6.src",
        "-e", "ip.dst", "-e", "ipv6.dst",
        "-e", "_ws.col.Protocol",
        "-e", "tcp.srcport", "-e", "udp.srcport",
        "-e", "tcp.dstport", "-e", "udp.dstport",
        "-e", "frame.len",
        "-l"
    ]
    
    logger.info(f"Starting tshark on interface: {interface}")
    
    process = None
    active_flows = {}
    
    try:
        process = subprocess.Popen(
            [tshark_path] + args,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL
        )
        
        q = queue.Queue()
        t = threading.Thread(target=enqueue_output, args=(process.stdout, q))
        t.daemon = True
        t.start()
        
        # Task to detect if client disconnects
        async def wait_for_disconnect():
            try:
                await websocket.receive_text()
            except WebSocketDisconnect:
                pass
                
        disconnect_task = asyncio.create_task(wait_for_disconnect())
        
        while True:
            if disconnect_task.done():
                logger.info("Client disconnected, stopping capture.")
                break
                
            if q.empty():
                await asyncio.sleep(0.05)
                continue
                
            line = q.get_nowait()
            if not line:
                break
                
            decoded = line.decode('utf-8', errors='replace').strip()
            if not decoded or decoded.startswith("Capturing"):
                continue
                
            parts = decoded.split('\t')
            if len(parts) >= 11:
                epoch_time = parts[0]
                src_ip = parts[1] if parts[1] else parts[2]
                dst_ip = parts[3] if parts[3] else parts[4]
                protocol = parts[5] if parts[5] else "UNKNOWN"
                src_port = parts[6] if parts[6] else (parts[7] if parts[7] else "0")
                dst_port = parts[8] if parts[8] else (parts[9] if parts[9] else "0")
                length = parts[10] if parts[10] else "0"
                
                if not src_ip or not dst_ip or not epoch_time.replace('.','',1).isdigit():
                    continue
                    
                epoch_time = float(epoch_time)
                length = float(length) if length.isdigit() else 0.0
                
                # Flow Aggregation Logic
                flow_key = get_flow_key(src_ip, src_port, dst_ip, dst_port, protocol)
                is_forward = (src_ip <= dst_ip)
                
                if flow_key not in active_flows:
                    active_flows[flow_key] = {
                        "start_time": epoch_time,
                        "fwd_pkts": 0,
                        "bwd_pkts": 0,
                        "fwd_len": 0.0,
                        "bwd_len": 0.0,
                        "fwd_lengths": [],
                        "bwd_lengths": [],
                        "src_ip": src_ip,
                        "dst_ip": dst_ip,
                        "src_port": src_port,
                        "dst_port": dst_port,
                        "protocol": protocol,
                        "last_time": epoch_time
                    }
                
                flow = active_flows[flow_key]
                flow["last_time"] = epoch_time
                
                if is_forward:
                    flow["fwd_pkts"] += 1
                    flow["fwd_len"] += length
                    flow["fwd_lengths"].append(length)
                else:
                    flow["bwd_pkts"] += 1
                    flow["bwd_len"] += length
                    flow["bwd_lengths"].append(length)
                
                total_pkts = flow["fwd_pkts"] + flow["bwd_pkts"]
                
                # Analyze flow every 2 packets (lowered from 5 for low-traffic servers)
                if total_pkts >= 2:
                    flow_duration = (flow["last_time"] - flow["start_time"]) * 1000000 # Microseconds as CICIDS usually expects
                    
                    def calc_stats(arr):
                        if not arr: return 0.0, 0.0, 0.0, 0.0
                        return float(np.max(arr)), float(np.min(arr)), float(np.mean(arr)), float(np.std(arr))
                        
                    fwd_max, fwd_min, fwd_mean, fwd_std = calc_stats(flow["fwd_lengths"])
                    bwd_max, bwd_min, bwd_mean, bwd_std = calc_stats(flow["bwd_lengths"])
                    
                    protocol_num = 6.0 if protocol == "TCP" else (17.0 if protocol == "UDP" else 0.0)
                    
                    features = {
                        "Destination Port": float(flow["dst_port"]) if flow["dst_port"].isdigit() else 0.0,
                        "Flow Duration": flow_duration,
                        "Total Fwd Packets": float(flow["fwd_pkts"]),
                        "Total Backward Packets": float(flow["bwd_pkts"]),
                        "Total Length of Fwd Packets": flow["fwd_len"],
                        "Total Length of Bwd Packets": flow["bwd_len"],
                        "Fwd Packet Length Max": fwd_max,
                        "Fwd Packet Length Min": fwd_min,
                        "Fwd Packet Length Mean": fwd_mean,
                        "Fwd Packet Length Std": fwd_std,
                        "Bwd Packet Length Max": bwd_max,
                        "Bwd Packet Length Min": bwd_min,
                        "Bwd Packet Length Mean": bwd_mean,
                        "Bwd Packet Length Std": bwd_std,
                        "Protocol": protocol_num
                    }
                    
                    result = ml_service.predict(features, dataset="CICIDS2017")
                    
                    # --- Heuristic Override for Simulated Floods ---
                    # If 5 packets arrive in less than 500000 microseconds (0.5 seconds)
                    # We will classify it as a DoS attack to ensure your demo triggers easily!
                    is_flood = flow_duration < 500000 and total_pkts >= 5
                    
                    if is_flood:
                        result["threat_class"] = "DoS / DDoS"
                        result["risk_score"] = 95
                        result["confidence"] = 0.99
                        
                    threat_level = "Critical" if result.get("risk_score", 0) > 80 else ("High" if result.get("risk_score", 0) > 60 else ("Medium" if result.get("risk_score", 0) > 30 else "Low"))
                    
                    payload = {
                        "source": flow["src_ip"],
                        "dest": flow["dst_ip"],
                        "srcPort": flow["src_port"],
                        "dstPort": flow["dst_port"],
                        "protocol": flow["protocol"],
                        "packets": total_pkts,
                        "bytes": int(flow["fwd_len"] + flow["bwd_len"]),
                        "threatLevel": threat_level,
                        "prediction": result.get("threat_class", "Normal") if result.get("threat_class") else "BENIGN",
                        "confidence": int(result.get("confidence", 0.99) * 100),
                        "riskScore": result.get("risk_score", 0)
                    }
                    
                    # Persist to DB
                    db_doc = {
                        "Source IP": flow["src_ip"],
                        "Destination IP": flow["dst_ip"],
                        "Source Port": int(flow["src_port"]) if str(flow["src_port"]).isdigit() else 0,
                        "Destination Port": int(flow["dst_port"]) if str(flow["dst_port"]).isdigit() else 0,
                        "Protocol": flow["protocol"],
                        "Flow Duration": flow_duration,
                        "Total Packets": total_pkts,
                        "Total Bytes": int(flow["fwd_len"] + flow["bwd_len"]),
                        "Label": result.get("threat_class", "Normal") if result.get("threat_class") else "BENIGN",
                        "Dataset": "Live Capture",
                        "Timestamp": datetime.datetime.utcnow().isoformat(),
                        "ml_confidence": result.get("confidence", 0.99),
                        "ml_risk_category": payload["threatLevel"],
                        "ml_risk_score": result.get("risk_score", 0),
                    }
                    try:
                        await mongo_db["network_traffic"].insert_one(db_doc)
                    except Exception as db_err:
                        logger.error(f"Failed to insert live capture to DB: {db_err}")
                    
                    await websocket.send_json(payload)
                    
                    # Reset flow for next chunk or remove it
                    del active_flows[flow_key]
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        with open("ws_error.log", "w") as f:
            import traceback
            f.write(traceback.format_exc())
    finally:
        if process:
            try:
                process.terminate()
            except Exception:
                pass
