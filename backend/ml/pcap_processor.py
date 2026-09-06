import os
import logging
import numpy as np
import pandas as pd
from datetime import datetime

logger = logging.getLogger(__name__)

def process_pcap_file(pcap_path, max_packets=5000):
    if not os.path.exists(pcap_path):
        raise FileNotFoundError(f'PCAP file not found at: {pcap_path}')
        
    try:
        from scapy.all import rdpcap, IP, TCP, UDP, ICMP
        packets = rdpcap(pcap_path)
    except Exception as e:
        logger.error(f'Error reading PCAP with Scapy: {str(e)}')
        raise e
        
    if not packets:
        return pd.DataFrame(), []
        
    flows = {}
    packet_count = 0
    
    for pkt in packets:
        if not pkt.haslayer(IP):
            continue
            
        packet_count += 1
        if packet_count > max_packets:
            break
            
        ip_layer = pkt[IP]
        src_ip = ip_layer.src
        dst_ip = ip_layer.dst
        proto_num = ip_layer.proto
        proto_str = 'TCP' if proto_num == 6 else ('UDP' if proto_num == 17 else ('ICMP' if proto_num == 1 else 'OTHER'))
        
        src_port = 0
        dst_port = 0
        tcp_flags = 0
        window_size = 0
        
        if pkt.haslayer(TCP):
            tcp = pkt[TCP]
            src_port = tcp.sport
            dst_port = tcp.dport
            tcp_flags = int(tcp.flags)
            window_size = tcp.window
        elif pkt.haslayer(UDP):
            udp = pkt[UDP]
            src_port = udp.sport
            dst_port = udp.dport
            
        pkt_time = float(pkt.time)
        pkt_len = len(pkt)
        
        fwd_key = (src_ip, dst_ip, src_port, dst_port, proto_str)
        bwd_key = (dst_ip, src_ip, dst_port, src_port, proto_str)
        
        if fwd_key in flows:
            flow = flows[fwd_key]
            flow['packets'].append((pkt_time, pkt_len, True, tcp_flags, window_size))
        elif bwd_key in flows:
            flow = flows[bwd_key]
            flow['packets'].append((pkt_time, pkt_len, False, tcp_flags, window_size))
        else:
            flows[fwd_key] = {
                'src_ip': src_ip,
                'dst_ip': dst_ip,
                'src_port': src_port,
                'dst_port': dst_port,
                'protocol': proto_str,
                'start_time': pkt_time,
                'packets': [(pkt_time, pkt_len, True, tcp_flags, window_size)]
            }
            
    flow_records = []
    metadata_list = []
    
    for key, flow in flows.items():
        pkts = sorted(flow['packets'], key=lambda x: x[0])
        times = [p[0] for p in pkts]
        lengths = [p[1] for p in pkts]
        fwd_lengths = [p[1] for p in pkts if p[2]]
        bwd_lengths = [p[1] for p in pkts if not p[2]]
        
        duration = max(1.0, (times[-1] - times[0]) * 1e6)
        duration_sec = max(0.0001, times[-1] - times[0])
        
        total_fwd_pkts = len(fwd_lengths) or 1
        total_bwd_pkts = len(bwd_lengths)
        tot_fwd_len = sum(fwd_lengths)
        tot_bwd_len = sum(bwd_lengths)
        
        flow_bytes_s = (tot_fwd_len + tot_bwd_len) / duration_sec
        flow_pkts_s = len(pkts) / duration_sec
        
        iats = [times[i] - times[i-1] for i in range(1, len(times))] if len(times) > 1 else [0]
        iat_us = [i * 1e6 for i in iats]
        
        syn_count = sum(1 for p in pkts if (p[3] & 0x02) != 0)
        fin_count = sum(1 for p in pkts if (p[3] & 0x01) != 0)
        rst_count = sum(1 for p in pkts if (p[3] & 0x04) != 0)
        psh_count = sum(1 for p in pkts if (p[3] & 0x08) != 0)
        ack_count = sum(1 for p in pkts if (p[3] & 0x10) != 0)
        urg_count = sum(1 for p in pkts if (p[3] & 0x20) != 0)
        
        init_win_fwd = next((p[4] for p in pkts if p[2]), 8192)
        init_win_bwd = next((p[4] for p in pkts if not p[2]), 0)
        
        record = {
            'Destination Port': flow['dst_port'],
            'Flow Duration': duration,
            'Total Fwd Packets': total_fwd_pkts,
            'Total Backward Packets': total_bwd_pkts,
            'Total Length of Fwd Packets': tot_fwd_len,
            'Total Length of Bwd Packets': tot_bwd_len,
            'Fwd Packet Length Max': max(fwd_lengths) if fwd_lengths else 0,
            'Fwd Packet Length Min': min(fwd_lengths) if fwd_lengths else 0,
            'Fwd Packet Length Mean': float(np.mean(fwd_lengths)) if fwd_lengths else 0,
            'Fwd Packet Length Std': float(np.std(fwd_lengths)) if fwd_lengths else 0,
            'Bwd Packet Length Max': max(bwd_lengths) if bwd_lengths else 0,
            'Bwd Packet Length Min': min(bwd_lengths) if bwd_lengths else 0,
            'Bwd Packet Length Mean': float(np.mean(bwd_lengths)) if bwd_lengths else 0,
            'Bwd Packet Length Std': float(np.std(bwd_lengths)) if bwd_lengths else 0,
            'Flow Bytes/s': flow_bytes_s,
            'Flow Packets/s': flow_pkts_s,
            'Flow IAT Mean': float(np.mean(iat_us)),
            'Flow IAT Std': float(np.std(iat_us)),
            'Flow IAT Max': max(iat_us),
            'Flow IAT Min': min(iat_us),
            'Fwd IAT Total': sum(iat_us),
            'Fwd IAT Mean': float(np.mean(iat_us)),
            'Fwd IAT Std': float(np.std(iat_us)),
            'Fwd IAT Max': max(iat_us),
            'Fwd IAT Min': min(iat_us),
            'Bwd IAT Total': 0,
            'Bwd IAT Mean': 0,
            'Bwd IAT Std': 0,
            'Bwd IAT Max': 0,
            'Bwd IAT Min': 0,
            'Fwd PSH Flags': psh_count,
            'Bwd PSH Flags': 0,
            'Fwd URG Flags': urg_count,
            'Bwd URG Flags': 0,
            'Fwd Header Length': total_fwd_pkts * 20,
            'Bwd Header Length': total_bwd_pkts * 20,
            'Fwd Packets/s': total_fwd_pkts / duration_sec,
            'Bwd Packets/s': total_bwd_pkts / duration_sec,
            'Min Packet Length': min(lengths),
            'Max Packet Length': max(lengths),
            'Packet Length Mean': float(np.mean(lengths)),
            'Packet Length Std': float(np.std(lengths)),
            'Packet Length Variance': float(np.var(lengths)),
            'FIN Flag Count': fin_count,
            'SYN Flag Count': syn_count,
            'RST Flag Count': rst_count,
            'PSH Flag Count': psh_count,
            'ACK Flag Count': ack_count,
            'URG Flag Count': urg_count,
            'CWE Flag Count': 0,
            'ECE Flag Count': 0,
            'Down/Up Ratio': total_bwd_pkts / total_fwd_pkts if total_fwd_pkts else 0,
            'Average Packet Size': float(np.mean(lengths)),
            'Avg Fwd Segment Size': float(np.mean(fwd_lengths)) if fwd_lengths else 0,
            'Avg Bwd Segment Size': float(np.mean(bwd_lengths)) if bwd_lengths else 0,
            'Fwd Header Length.1': total_fwd_pkts * 20,
            'Fwd Avg Bytes/Bulk': 0,
            'Fwd Avg Packets/Bulk': 0,
            'Fwd Avg Bulk Rate': 0,
            'Bwd Avg Bytes/Bulk': 0,
            'Bwd Avg Packets/Bulk': 0,
            'Bwd Avg Bulk Rate': 0,
            'Subflow Fwd Packets': total_fwd_pkts,
            'Subflow Fwd Bytes': tot_fwd_len,
            'Subflow Bwd Packets': total_bwd_pkts,
            'Subflow Bwd Bytes': tot_bwd_len,
            'Init_Win_bytes_forward': init_win_fwd,
            'Init_Win_bytes_backward': init_win_bwd,
            'act_data_pkt_fwd': total_fwd_pkts,
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
            'source_ip': flow['src_ip'],
            'destination_ip': flow['dst_ip'],
            'source_port': flow['src_port'],
            'destination_port': flow['dst_port'],
            'protocol': flow['protocol'],
            'flow_duration': duration,
            'packet_count': len(pkts)
        })
        
    df = pd.DataFrame(flow_records)
    return df, metadata_list
