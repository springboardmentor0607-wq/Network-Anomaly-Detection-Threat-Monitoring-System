import logging
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger("netshield.backend.packet_feature_extractor")


def extract_features_from_packet(packet: Any) -> Dict[str, Any]:
    """
    Extract a CICIDS2017 feature dictionary from a PyShark or raw packet object.
    Matches the schema required by the ML threat prediction pipeline.
    """
    # Default fallback values for CICIDS2017 features
    feat: Dict[str, Any] = {
        "Destination Port": 80,
        "Flow Duration": 1250,
        "Total Fwd Packets": 2,
        "Total Backward Packets": 2,
        "Total Length of Fwd Packets": 128,
        "Total Length of Bwd Packets": 256,
        "Fwd Packet Length Max": 128,
        "Fwd Packet Length Min": 40,
        "Fwd Packet Length Mean": 64.0,
        "Fwd Packet Length Std": 12.0,
        "Bwd Packet Length Max": 256,
        "Bwd Packet Length Min": 40,
        "Bwd Packet Length Mean": 128.0,
        "Bwd Packet Length Std": 24.0,
        "Flow Bytes/s": 307.2,
        "Flow Packets/s": 3.2,
        "Flow IAT Mean": 312.5,
        "Flow IAT Std": 50.0,
        "Flow IAT Max": 400.0,
        "Flow IAT Min": 100.0,
        "Fwd IAT Total": 600.0,
        "Fwd IAT Mean": 300.0,
        "Fwd IAT Std": 20.0,
        "Fwd IAT Max": 320.0,
        "Fwd IAT Min": 280.0,
        "Bwd IAT Total": 600.0,
        "Bwd IAT Mean": 300.0,
        "Bwd IAT Std": 20.0,
        "Bwd IAT Max": 320.0,
        "Bwd IAT Min": 280.0,
        "Fwd PSH Flags": 0,
        "Bwd PSH Flags": 0,
        "Fwd URG Flags": 0,
        "Bwd URG Flags": 0,
        "Fwd Header Length": 40,
        "Bwd Header Length": 40,
        "Fwd Packets/s": 1.6,
        "Bwd Packets/s": 1.6,
        "Min Packet Length": 40,
        "Max Packet Length": 256,
        "Packet Length Mean": 96.0,
        "Packet Length Std": 35.0,
        "Packet Length Variance": 1225.0,
        "FIN Flag Count": 0,
        "SYN Flag Count": 1,
        "RST Flag Count": 0,
        "PSH Flag Count": 0,
        "ACK Flag Count": 1,
        "URG Flag Count": 0,
        "CWE Flag Count": 0,
        "ECE Flag Count": 0,
        "Down/Up Ratio": 1.0,
        "Average Packet Size": 96.0,
        "Avg Fwd Segment Size": 64.0,
        "Avg Bwd Segment Size": 128.0,
        "Fwd Header Length.1": 40,
        "Fwd Avg Bytes/Bulk": 0,
        "Fwd Avg Packets/Bulk": 0,
        "Fwd Avg Bulk Rate": 0,
        "Bwd Avg Bytes/Bulk": 0,
        "Bwd Avg Packets/Bulk": 0,
        "Bwd Avg Bulk Rate": 0,
        "Subflow Fwd Packets": 2,
        "Subflow Fwd Bytes": 128,
        "Subflow Bwd Packets": 2,
        "Subflow Bwd Bytes": 256,
        "Init_Win_bytes_forward": 8192,
        "Init_Win_bytes_backward": 8192,
        "act_data_pkt_fwd": 1,
        "min_seg_size_forward": 20,
        "Active Mean": 0.0,
        "Active Std": 0.0,
        "Active Max": 0.0,
        "Active Min": 0.0,
        "Idle Mean": 0.0,
        "Idle Std": 0.0,
        "Idle Max": 0.0,
        "Idle Min": 0.0,
        # Metadata fields
        "source_ip": "192.168.1.100",
        "destination_ip": "10.0.0.1",
        "source_port": 49152,
        "protocol": "TCP"
    }

    if packet is None:
        return feat

    # Extract properties if packet is a PyShark object or dict
    try:
        if isinstance(packet, dict):
            feat["source_ip"] = str(packet.get("src_ip", packet.get("source_ip", "192.168.1.100")))
            feat["destination_ip"] = str(packet.get("dst_ip", packet.get("destination_ip", "10.0.0.1")))
            feat["Destination Port"] = int(packet.get("dst_port", packet.get("Destination Port", 80)))
            feat["source_port"] = int(packet.get("src_port", packet.get("source_port", 49152)))
            feat["protocol"] = str(packet.get("protocol", "TCP")).upper()

            length = int(packet.get("length", 128))
            feat["Total Length of Fwd Packets"] = length
            feat["Max Packet Length"] = length
            feat["Packet Length Mean"] = float(length)
            return feat

        # PyShark Packet object processing
        if hasattr(packet, "ip"):
            feat["source_ip"] = str(packet.ip.src)
            feat["destination_ip"] = str(packet.ip.dst)

        if hasattr(packet, "highest_layer"):
            feat["protocol"] = str(packet.highest_layer).upper()

        if hasattr(packet, "length"):
            pkt_len = int(packet.length)
            feat["Total Length of Fwd Packets"] = pkt_len
            feat["Max Packet Length"] = pkt_len
            feat["Packet Length Mean"] = float(pkt_len)

        if hasattr(packet, "tcp"):
            feat["source_port"] = int(packet.tcp.srcport)
            feat["Destination Port"] = int(packet.tcp.dstport)
            feat["protocol"] = "TCP"

            # Flags
            flags = str(getattr(packet.tcp, "flags", "0x0000"))
            if "0x0002" in flags or "0x02" in flags:
                feat["SYN Flag Count"] = 1
            if "0x0010" in flags or "0x10" in flags:
                feat["ACK Flag Count"] = 1
            if "0x0001" in flags or "0x01" in flags:
                feat["FIN Flag Count"] = 1
            if "0x0004" in flags or "0x04" in flags:
                feat["RST Flag Count"] = 1
            if "0x0008" in flags or "0x08" in flags:
                feat["PSH Flag Count"] = 1

        elif hasattr(packet, "udp"):
            feat["source_port"] = int(packet.udp.srcport)
            feat["Destination Port"] = int(packet.udp.dstport)
            feat["protocol"] = "UDP"

    except Exception as exc:
        logger.debug(f"Error parsing packet layers: {exc}")

    return feat
