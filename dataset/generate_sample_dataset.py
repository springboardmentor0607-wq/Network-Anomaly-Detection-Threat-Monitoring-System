import csv
import random
import os

headers = [
    "Destination Port", "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
    "Total Length of Fwd Packets", "Total Length of Bwd Packets", "Fwd Packet Length Max",
    "Fwd Packet Length Min", "Fwd Packet Length Mean", "Fwd Packet Length Std",
    "Bwd Packet Length Max", "Bwd Packet Length Min", "Bwd Packet Length Mean",
    "Bwd Packet Length Std", "Flow Bytes/s", "Flow Packets/s", "Flow IAT Mean",
    "Flow IAT Std", "Flow IAT Max", "Flow IAT Min", "Fwd IAT Total", "Fwd IAT Mean",
    "Fwd IAT Std", "Fwd IAT Max", "Fwd IAT Min", "Bwd IAT Total", "Bwd IAT Mean",
    "Bwd IAT Std", "Bwd IAT Max", "Bwd IAT Min", "Fwd PSH Flags", "Bwd PSH Flags",
    "Fwd URG Flags", "Bwd URG Flags", "Fwd Header Length", "Bwd Header Length",
    "Fwd Packets/s", "Bwd Packets/s", "Min Packet Length", "Max Packet Length",
    "Packet Length Mean", "Packet Length Std", "Packet Length Variance",
    "FIN Flag Count", "SYN Flag Count", "RST Flag Count", "PSH Flag Count",
    "ACK Flag Count", "URG Flag Count", "CWE Flag Count", "ECE Flag Count",
    "Down/Up Ratio", "Average Packet Size", "Avg Fwd Segment Size",
    "Avg Bwd Segment Size", "Fwd Header Length.1", "Fwd Avg Bytes/Bulk",
    "Fwd Avg Packets/Bulk", "Fwd Avg Bulk Rate", "Bwd Avg Bytes/Bulk",
    "Bwd Avg Packets/Bulk", "Bwd Avg Bulk Rate", "Subflow Fwd Packets",
    "Subflow Fwd Bytes", "Subflow Bwd Packets", "Subflow Bwd Bytes",
    "Init_Win_bytes_forward", "Init_Win_bytes_backward", "act_data_pkt_fwd",
    "min_seg_size_forward", "Active Mean", "Active Std", "Active Max", "Active Min",
    "Idle Mean", "Idle Std", "Idle Max", "Idle Min", "Source IP", "Destination IP",
    "Protocol", "Label"
]

classes = ['BENIGN', 'DDoS', 'FTP-Patator', 'SSH-Patator']
weights = [0.55, 0.25, 0.10, 0.10]

random.seed(42)

out_dir = os.path.abspath(os.path.dirname(__file__))
csv_path = os.path.join(out_dir, "sample_network_traffic.csv")

with open(csv_path, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    
    for i in range(500):
        label = random.choices(classes, weights=weights)[0]
        
        src_ip = f"192.168.1.{random.randint(2, 250)}"
        dst_ip = f"10.0.0.{random.randint(1, 20)}"
        
        if label == 'BENIGN':
            dport = random.choice([80, 443, 8080, 53])
            duration = random.randint(100, 50000)
            fwd_pkts = random.randint(2, 30)
            bwd_pkts = random.randint(2, 30)
            fwd_bytes = fwd_pkts * random.randint(40, 500)
            bwd_bytes = bwd_pkts * random.randint(40, 1500)
            protocol = random.choice(['TCP', 'UDP'])
            syn_flags = 1
            rst_flags = 0
        elif label == 'DDoS':
            dport = 80
            duration = random.randint(1, 1000)
            fwd_pkts = random.randint(100, 1000)
            bwd_pkts = random.randint(0, 5)
            fwd_bytes = fwd_pkts * random.randint(500, 1400)
            bwd_bytes = bwd_pkts * random.randint(0, 100)
            protocol = 'TCP'
            syn_flags = random.choice([0, 1])
            rst_flags = random.choice([0, 1])
            src_ip = f"172.16.{random.randint(1, 254)}.{random.randint(1, 254)}"
        elif label == 'FTP-Patator':
            dport = 21
            duration = random.randint(5000, 200000)
            fwd_pkts = random.randint(10, 50)
            bwd_pkts = random.randint(10, 50)
            fwd_bytes = fwd_pkts * random.randint(50, 200)
            bwd_bytes = bwd_pkts * random.randint(50, 200)
            protocol = 'TCP'
            syn_flags = 1
            rst_flags = 0
            src_ip = f"192.168.10.{random.randint(100, 200)}"
        else: # SSH-Patator
            dport = 22
            duration = random.randint(10000, 300000)
            fwd_pkts = random.randint(20, 80)
            bwd_pkts = random.randint(20, 80)
            fwd_bytes = fwd_pkts * random.randint(100, 300)
            bwd_bytes = bwd_pkts * random.randint(100, 400)
            protocol = 'TCP'
            syn_flags = 1
            rst_flags = 0
            src_ip = f"192.168.12.{random.randint(100, 200)}"

        fwd_len_max = random.randint(100, 1500)
        fwd_len_min = random.randint(0, 64)
        fwd_len_mean = (fwd_bytes / fwd_pkts) if fwd_pkts > 0 else 0
        fwd_len_std = random.uniform(1.0, 50.0)
        
        bwd_len_max = random.randint(100, 1500)
        bwd_len_min = random.randint(0, 64)
        bwd_len_mean = (bwd_bytes / bwd_pkts) if bwd_pkts > 0 else 0
        bwd_len_std = random.uniform(1.0, 50.0)
        
        flow_bytes_s = round((fwd_bytes + bwd_bytes) / (duration / 1e6 + 1e-5), 2)
        flow_pkts_s = round((fwd_pkts + bwd_pkts) / (duration / 1e6 + 1e-5), 2)
        
        row = [
            dport, duration, fwd_pkts, bwd_pkts,
            fwd_bytes, bwd_bytes, fwd_len_max, fwd_len_min, round(fwd_len_mean, 2), round(fwd_len_std, 2),
            bwd_len_max, bwd_len_min, round(bwd_len_mean, 2), round(bwd_len_std, 2),
            flow_bytes_s, flow_pkts_s, round(duration / 10, 2), round(duration / 20, 2), duration, 0,
            duration, round(duration / (fwd_pkts or 1), 2), 10.0, duration, 0,
            duration, round(duration / (bwd_pkts or 1), 2), 10.0, duration, 0,
            0, 0, 0, 0, fwd_pkts * 20, bwd_pkts * 20,
            round(fwd_pkts / (duration / 1e6 + 1e-5), 2), round(bwd_pkts / (duration / 1e6 + 1e-5), 2),
            0, 1500, round((fwd_bytes + bwd_bytes) / ((fwd_pkts + bwd_pkts) or 1), 2), 15.0, 225.0,
            0, syn_flags, rst_flags, 0, 1, 0, 0, 0,
            round(bwd_pkts / (fwd_pkts or 1), 2), round((fwd_bytes + bwd_bytes) / ((fwd_pkts + bwd_pkts) or 1), 2),
            round(fwd_len_mean, 2), round(bwd_len_mean, 2), fwd_pkts * 20,
            0, 0, 0, 0, 0, 0,
            fwd_pkts, fwd_bytes, bwd_pkts, bwd_bytes,
            random.randint(1000, 65535), random.randint(1000, 65535), fwd_pkts - 1, 20,
            0, 0, 0, 0, 0, 0, 0, 0,
            src_ip, dst_ip, protocol, label
        ]
        writer.writerow(row)

print(f"Generated sample_network_traffic.csv successfully with 500 rows at {csv_path}")
