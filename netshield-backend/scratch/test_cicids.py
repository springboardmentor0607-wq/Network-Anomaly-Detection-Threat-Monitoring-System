import os
import pandas as pd
import numpy as np

dataset_dir = "netshield-backend/dataset"
if not os.path.exists(os.path.join(dataset_dir, "UNSW_NB15_training-set.csv")):
    dataset_dir = "dataset"

unsw_train = pd.read_csv(os.path.join(dataset_dir, "UNSW_NB15_training-set.csv"))
unsw_test = pd.read_csv(os.path.join(dataset_dir, "UNSW_NB15_testing-set.csv"))
unsw_df = pd.concat([unsw_train, unsw_test], ignore_index=True)

print("UNSW-NB15 total rows:", len(unsw_df))

cicids_files = [f for f in os.listdir(dataset_dir) if f.endswith(".csv") and "ISCX" in f]
print("Found CICIDS2017 files:", cicids_files)

cicids_dfs = []
for file_name in cicids_files:
    file_path = os.path.join(dataset_dir, file_name)
    try:
        # Read header and sample of CICIDS2017 file
        c_df = pd.read_csv(file_path, nrows=5000)
        c_df.columns = c_df.columns.str.strip()
        
        # Map CICIDS2017 schema to UNSW-NB15 feature structure
        mapped_df = pd.DataFrame()
        mapped_df["dur"] = c_df.get("Flow Duration", 0) / 1e6
        mapped_df["spkts"] = c_df.get("Total Fwd Packets", 0)
        mapped_df["dpkts"] = c_df.get("Total Backward Packets", 0)
        mapped_df["sbytes"] = c_df.get("Total Length of Fwd Packets", 0)
        mapped_df["dbytes"] = c_df.get("Total Length of Bwd Packets", 0)
        mapped_df["rate"] = c_df.get("Flow Packets/s", 0)
        mapped_df["sload"] = c_df.get("Flow Bytes/s", 0)
        mapped_df["dload"] = 0
        mapped_df["proto"] = "tcp"
        mapped_df["service"] = "-"
        mapped_df["state"] = "FIN"
        mapped_df["sttl"] = 64
        mapped_df["dttl"] = 64
        mapped_df["sloss"] = 0
        mapped_df["dloss"] = 0
        mapped_df["sinpkt"] = 0
        mapped_df["dinpkt"] = 0
        mapped_df["sjit"] = 0
        mapped_df["djit"] = 0
        mapped_df["swnd"] = 255
        mapped_df["dwnd"] = 255
        mapped_df["tcprtt"] = 0
        mapped_df["synack"] = 0
        mapped_df["ackdat"] = 0
        mapped_df["smean"] = c_df.get("Fwd Packet Length Mean", 0)
        mapped_df["dmean"] = c_df.get("Bwd Packet Length Mean", 0)
        mapped_df["trans_depth"] = 0
        mapped_df["response_body_len"] = 0
        mapped_df["ct_srv_src"] = 1
        mapped_df["ct_state_ttl"] = 1
        mapped_df["ct_dst_ltm"] = 1
        mapped_df["ct_src_dport_ltm"] = 1
        mapped_df["ct_dst_sport_ltm"] = 1
        mapped_df["ct_dst_src_ltm"] = 1
        mapped_df["is_ftp_login"] = 0
        mapped_df["ct_ftp_cmd"] = 0
        mapped_df["ct_flw_http_mthd"] = 0
        mapped_df["ct_src_ltm"] = 1
        mapped_df["ct_srv_dst"] = 1
        mapped_df["is_sm_ips_ports"] = 0
        
        # Map attack labels
        raw_label = c_df.get("Label", "BENIGN").astype(str).str.strip().str.upper()
        
        def map_cicids_label(l):
            if "BENIGN" in l:
                return "Normal"
            elif "DDOS" in l or "DOS" in l:
                return "DoS"
            elif "PORTSCAN" in l or "PATATOR" in l:
                return "Reconnaissance"
            elif "BOT" in l:
                return "Backdoor"
            elif "WEB" in l or "INFILTRATION" in l:
                return "Exploits"
            else:
                return "Generic"

        mapped_df["attack_cat"] = raw_label.apply(map_cicids_label)
        mapped_df["label"] = (mapped_df["attack_cat"] != "Normal").astype(int)
        cicids_dfs.append(mapped_df)
    except Exception as e:
        print(f"Error reading {file_name}:", e)

if cicids_dfs:
    combined_cicids = pd.concat(cicids_dfs, ignore_index=True)
    print("CICIDS2017 total mapped rows:", len(combined_cicids))
    print("CICIDS2017 label counts:\n", combined_cicids["attack_cat"].value_counts())
