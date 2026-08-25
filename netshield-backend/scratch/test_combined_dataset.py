import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

def load_combined_dataset():
    possible_dirs = [
        "dataset",
        "../dataset",
        "netshield-backend/dataset",
        "c:/Users/BHAVANI/Springboard/dataset"
    ]
    dataset_dir = None
    for d in possible_dirs:
        if os.path.exists(os.path.join(d, "UNSW_NB15_training-set.csv")):
            dataset_dir = d
            break
            
    if not dataset_dir:
        raise FileNotFoundError("Dataset directory containing UNSW_NB15_training-set.csv not found.")
        
    print(f"Using dataset directory: {os.path.abspath(dataset_dir)}")
    
    # 1. Load UNSW-NB15
    train_path = os.path.join(dataset_dir, "UNSW_NB15_training-set.csv")
    test_path = os.path.join(dataset_dir, "UNSW_NB15_testing-set.csv")
    
    unsw_train = pd.read_csv(train_path)
    unsw_test = pd.read_csv(test_path)
    unsw_df = pd.concat([unsw_train, unsw_test], ignore_index=True)
    print(f"Loaded UNSW-NB15 records: {len(unsw_df)}")
    
    # 2. Search and load CICIDS2017 files if present
    cicids_files = [f for f in os.listdir(dataset_dir) if f.endswith(".csv") and "ISCX" in f]
    print(f"Found {len(cicids_files)} CICIDS2017 dataset files.")
    
    dfs_to_combine = [unsw_df]
    
    for c_file in cicids_files:
        c_path = os.path.join(dataset_dir, c_file)
        try:
            # Sample up to 10,000 records per CICIDS2017 file for memory efficiency & dataset balance
            c_df = pd.read_csv(c_path, nrows=10000)
            c_df.columns = c_df.columns.str.strip()
            
            mapped = pd.DataFrame()
            mapped["dur"] = (c_df.get("Flow Duration", 0) / 1e6).clip(lower=0)
            mapped["proto"] = "tcp"
            mapped["service"] = "-"
            mapped["state"] = "FIN"
            mapped["spkts"] = c_df.get("Total Fwd Packets", 0)
            mapped["dpkts"] = c_df.get("Total Backward Packets", 0)
            mapped["sbytes"] = c_df.get("Total Length of Fwd Packets", 0)
            mapped["dbytes"] = c_df.get("Total Length of Bwd Packets", 0)
            mapped["rate"] = c_df.get("Flow Packets/s", 0)
            mapped["sttl"] = 64
            mapped["dttl"] = 64
            mapped["sload"] = c_df.get("Flow Bytes/s", 0)
            mapped["dload"] = 0
            mapped["sloss"] = 0
            mapped["dloss"] = 0
            mapped["sinpkt"] = 0
            mapped["dinpkt"] = 0
            mapped["sjit"] = 0
            mapped["djit"] = 0
            mapped["swnd"] = 255
            mapped["dwnd"] = 255
            mapped["tcprtt"] = 0
            mapped["synack"] = 0
            mapped["ackdat"] = 0
            mapped["smean"] = c_df.get("Fwd Packet Length Mean", 0)
            mapped["dmean"] = c_df.get("Bwd Packet Length Mean", 0)
            mapped["trans_depth"] = 0
            mapped["response_body_len"] = 0
            mapped["ct_srv_src"] = 1
            mapped["ct_state_ttl"] = 1
            mapped["ct_dst_ltm"] = 1
            mapped["ct_src_dport_ltm"] = 1
            mapped["ct_dst_sport_ltm"] = 1
            mapped["ct_dst_src_ltm"] = 1
            mapped["is_ftp_login"] = 0
            mapped["ct_ftp_cmd"] = 0
            mapped["ct_flw_http_mthd"] = 0
            mapped["ct_src_ltm"] = 1
            mapped["ct_srv_dst"] = 1
            mapped["is_sm_ips_ports"] = 0
            
            raw_lbl = c_df.get("Label", "BENIGN").astype(str).str.strip().str.upper()
            def map_lbl(l):
                if "BENIGN" in l: return "Normal"
                elif "DDOS" in l or "DOS" in l: return "DoS"
                elif "PORTSCAN" in l or "PATATOR" in l: return "Reconnaissance"
                elif "BOT" in l: return "Backdoor"
                elif "WEB" in l or "INFILTRATION" in l: return "Exploits"
                else: return "Generic"
                
            mapped["attack_cat"] = raw_lbl.apply(map_lbl)
            mapped["label"] = (mapped["attack_cat"] != "Normal").astype(int)
            dfs_to_combine.append(mapped)
        except Exception as err:
            print(f"Error reading CICIDS file {c_file}:", err)

    combined = pd.concat(dfs_to_combine, ignore_index=True)
    print(f"Total combined dataset size (UNSW-NB15 + CICIDS2017): {len(combined)} rows")
    return combined

if __name__ == "__main__":
    df = load_combined_dataset()
    print("Class breakdown:\n", df["attack_cat"].value_counts())
