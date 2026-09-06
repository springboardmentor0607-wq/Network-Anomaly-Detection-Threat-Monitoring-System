import os
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime

logger = logging.getLogger(__name__)

def parse_zeek_log_file(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f'Zeek log file not found at: {file_path}')
        
    records = []
    headers = []
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line_str = line.strip()
            if not line_str:
                continue
                
            # JSON format
            if line_str.startswith('{') and line_str.endswith('}'):
                try:
                    records.append(json.loads(line_str))
                except Exception:
                    continue
            # Standard Zeek TSV format with header directives
            elif line_str.startswith('#fields'):
                headers = line_str.split('	')[1:]
            elif not line_str.startswith('#') and headers:
                parts = line_str.split('	')
                if len(parts) == len(headers):
                    row = {}
                    for h, p in zip(headers, parts):
                        row[h] = None if p == '-' or p == '(empty)' else p
                    records.append(row)
                    
    return records

def process_zeek_conn_logs(zeek_records):
    if not zeek_records:
        return pd.DataFrame(), []
        
    flow_records = []
    metadata_list = []
    
    for r in zeek_records:
        src_ip = r.get('id.orig_h', r.get('orig_h', '192.168.1.100'))
        dst_ip = r.get('id.resp_h', r.get('resp_h', '10.0.0.1'))
        src_port = int(r.get('id.orig_p', r.get('orig_p', 0)) or 0)
        dst_port = int(r.get('id.resp_p', r.get('resp_p', 80)) or 80)
        proto = str(r.get('proto', 'tcp')).upper()
        
        duration_sec = float(r.get('duration', 0.05) or 0.05)
        duration_us = duration_sec * 1e6
        
        orig_pkts = int(r.get('orig_pkts', 1) or 1)
        resp_pkts = int(r.get('resp_pkts', 0) or 0)
        orig_bytes = int(r.get('orig_bytes', r.get('orig_ip_bytes', 100)) or 100)
        resp_bytes = int(r.get('resp_bytes', r.get('resp_ip_bytes', 0)) or 0)
        
        flow_bytes_s = (orig_bytes + resp_bytes) / max(0.0001, duration_sec)
        flow_pkts_s = (orig_pkts + resp_pkts) / max(0.0001, duration_sec)
        
        history = str(r.get('history', 'ShAdDaR'))
        syn_count = 1 if 'S' in history or 's' in history else 0
        ack_count = 1 if 'A' in history or 'a' in history else 0
        fin_count = 1 if 'F' in history or 'f' in history else 0
        rst_count = 1 if 'R' in history or 'r' in history else 0
        psh_count = 1 if 'D' in history or 'd' in history else 0
        
        record = {
            'Destination Port': dst_port,
            'Flow Duration': duration_us,
            'Total Fwd Packets': orig_pkts,
            'Total Backward Packets': resp_pkts,
            'Total Length of Fwd Packets': orig_bytes,
            'Total Length of Bwd Packets': resp_bytes,
            'Fwd Packet Length Max': orig_bytes / max(1, orig_pkts),
            'Fwd Packet Length Min': 40,
            'Fwd Packet Length Mean': orig_bytes / max(1, orig_pkts),
            'Fwd Packet Length Std': 0,
            'Bwd Packet Length Max': resp_bytes / max(1, resp_pkts) if resp_pkts else 0,
            'Bwd Packet Length Min': 0,
            'Bwd Packet Length Mean': resp_bytes / max(1, resp_pkts) if resp_pkts else 0,
            'Bwd Packet Length Std': 0,
            'Flow Bytes/s': flow_bytes_s,
            'Flow Packets/s': flow_pkts_s,
            'Flow IAT Mean': duration_us / max(1, orig_pkts + resp_pkts),
            'Flow IAT Std': 0,
            'Flow IAT Max': duration_us,
            'Flow IAT Min': 0,
            'Fwd IAT Total': duration_us,
            'Fwd IAT Mean': duration_us / max(1, orig_pkts),
            'Fwd IAT Std': 0,
            'Fwd IAT Max': duration_us,
            'Fwd IAT Min': 0,
            'Bwd IAT Total': 0,
            'Bwd IAT Mean': 0,
            'Bwd IAT Std': 0,
            'Bwd IAT Max': 0,
            'Bwd IAT Min': 0,
            'Fwd PSH Flags': psh_count,
            'Bwd PSH Flags': 0,
            'Fwd URG Flags': 0,
            'Bwd URG Flags': 0,
            'Fwd Header Length': orig_pkts * 20,
            'Bwd Header Length': resp_pkts * 20,
            'Fwd Packets/s': orig_pkts / max(0.0001, duration_sec),
            'Bwd Packets/s': resp_pkts / max(0.0001, duration_sec),
            'Min Packet Length': 40,
            'Max Packet Length': max(orig_bytes, resp_bytes),
            'Packet Length Mean': (orig_bytes + resp_bytes) / max(1, orig_pkts + resp_pkts),
            'Packet Length Std': 0,
            'Packet Length Variance': 0,
            'FIN Flag Count': fin_count,
            'SYN Flag Count': syn_count,
            'RST Flag Count': rst_count,
            'PSH Flag Count': psh_count,
            'ACK Flag Count': ack_count,
            'URG Flag Count': 0,
            'CWE Flag Count': 0,
            'ECE Flag Count': 0,
            'Down/Up Ratio': resp_pkts / max(1, orig_pkts),
            'Average Packet Size': (orig_bytes + resp_bytes) / max(1, orig_pkts + resp_pkts),
            'Avg Fwd Segment Size': orig_bytes / max(1, orig_pkts),
            'Avg Bwd Segment Size': resp_bytes / max(1, resp_pkts) if resp_pkts else 0,
            'Fwd Header Length.1': orig_pkts * 20,
            'Fwd Avg Bytes/Bulk': 0,
            'Fwd Avg Packets/Bulk': 0,
            'Fwd Avg Bulk Rate': 0,
            'Bwd Avg Bytes/Bulk': 0,
            'Bwd Avg Packets/Bulk': 0,
            'Bwd Avg Bulk Rate': 0,
            'Subflow Fwd Packets': orig_pkts,
            'Subflow Fwd Bytes': orig_bytes,
            'Subflow Bwd Packets': resp_pkts,
            'Subflow Bwd Bytes': resp_bytes,
            'Init_Win_bytes_forward': 8192,
            'Init_Win_bytes_backward': 8192 if resp_pkts else 0,
            'act_data_pkt_fwd': orig_pkts,
            'min_seg_size_forward': 20,
            'Active Mean': 0,
            'Active Std': 0,
            'Active Max': 0,
            'Active Min': 0,
            'Idle Mean': 0,
            'Idle Std': 0,
            'Idle Max': 0,
            'Idle Min': 0
        }
        flow_records.append(record)
        metadata_list.append({
            'source_ip': src_ip,
            'destination_ip': dst_ip,
            'source_port': src_port,
            'destination_port': dst_port,
            'protocol': proto,
            'flow_duration': duration_us,
            'conn_state': r.get('conn_state', 'SF'),
            'service': r.get('service', '-')
        })
        
    df = pd.DataFrame(flow_records)
    return df, metadata_list
