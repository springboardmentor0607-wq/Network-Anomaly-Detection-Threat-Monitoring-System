import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

def load_and_preprocess_data(dataset_dir="../dataset", sample_size=None):
    """
    Loads and preprocesses both UNSW-NB15 and CICIDS2017 datasets (when available).
    Cleans missing values, handles continuous skewness, encodes categoricals,
    and scales features for Random Forest models.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    possible_dirs = [
        dataset_dir,
        os.path.join(project_root, "dataset"),
        os.path.join(base_dir, "dataset"),
        "dataset",
        "../dataset"
    ]
    
    target_dir = None
    for d in possible_dirs:
        if d and os.path.exists(os.path.join(d, "UNSW_NB15_training-set.csv")):
            target_dir = d
            break
            
    if not target_dir:
        target_dir = "dataset"
        
    print(f"Loading dataset files from directory: {os.path.abspath(target_dir)}")
    
    # 1. Load UNSW-NB15
    train_path = os.path.join(target_dir, "UNSW_NB15_training-set.csv")
    test_path = os.path.join(target_dir, "UNSW_NB15_testing-set.csv")
    
    unsw_train = pd.read_csv(train_path)
    unsw_test = pd.read_csv(test_path)
    unsw_df = pd.concat([unsw_train, unsw_test], ignore_index=True)
    print(f"Loaded UNSW-NB15 records: {len(unsw_df)}")
    
    dfs_to_combine = [unsw_df]
    
    # 2. Optionally load and map CICIDS2017 files if present
    cicids_files = [f for f in os.listdir(target_dir) if f.endswith(".csv") and "ISCX" in f]
    if cicids_files:
        print(f"Found {len(cicids_files)} CICIDS2017 dataset files. Incorporating CICIDS2017 records...")
        for c_file in cicids_files:
            c_path = os.path.join(target_dir, c_file)
            try:
                # Read sample per CICIDS file for optimal balance and performance
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
                print(f"Error mapping CICIDS file {c_file}:", err)

    combined_df = pd.concat(dfs_to_combine, ignore_index=True)
    print(f"Total dataset size: {len(combined_df)} records")

    if sample_size and len(combined_df) > sample_size:
        combined_df = combined_df.sample(n=sample_size, random_state=42).reset_index(drop=True)

    # 3. Clean missing & infinite values
    combined_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    combined_df.fillna(0, inplace=True)
    
    # 4. Remove duplicate rows if any
    if "id" in combined_df.columns:
        combined_df.drop(columns=["id"], inplace=True)
    combined_df.drop_duplicates(inplace=True)

    # Target strings
    y_binary = combined_df["label"].values
    y_attack_str = combined_df["attack_cat"].astype(str).str.strip()

    # Features DataFrame
    X_raw = combined_df.drop(columns=["label", "attack_cat"], errors="ignore").copy()

    # Continuous feature log transformation for extreme skewness reduction
    skewed_cols = ["dur", "spkts", "dpkts", "sbytes", "dbytes", "rate", "sload", "dload", "sloss", "dloss", "sinpkt", "dinpkt", "sjit", "djit", "smean", "dmean"]
    for col in skewed_cols:
        if col in X_raw.columns:
            X_raw[col] = np.log1p(np.maximum(0, pd.to_numeric(X_raw[col], errors="coerce").fillna(0)))

    # Categorical column encoding
    categorical_cols = ["proto", "service", "state"]
    feature_encoders = {}

    X_encoded = X_raw.copy()
    for col in categorical_cols:
        if col in X_encoded.columns:
            le = LabelEncoder()
            X_encoded[col] = le.fit_transform(X_encoded[col].astype(str))
            feature_encoders[col] = le

    # Encode multi-class target attack categories
    target_encoder = LabelEncoder()
    y_attack_encoded = target_encoder.fit_transform(y_attack_str)

    # Feature names
    feature_names = X_encoded.columns.tolist()

    # Scale numerical features with StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_encoded)
    X_scaled_df = pd.DataFrame(X_scaled, columns=feature_names)

    # Train, Validation, Test Split (70% Train, 15% Val, 15% Test)
    X_train, X_temp, y_train, y_temp, y_cat_train, y_cat_temp = train_test_split(
        X_scaled_df,
        y_binary,
        y_attack_encoded,
        test_size=0.3,
        random_state=42,
        stratify=y_attack_encoded
    )

    X_val, X_test, y_val, y_test, y_cat_val, y_cat_test = train_test_split(
        X_temp,
        y_temp,
        y_cat_temp,
        test_size=0.5,
        random_state=42,
        stratify=y_cat_temp
    )

    print(f"Data preprocessed successfully!")
    print(f"Train set: {X_train.shape[0]}, Val set: {X_val.shape[0]}, Test set: {X_test.shape[0]}")
    print(f"Classes ({len(target_encoder.classes_)}): {list(target_encoder.classes_)}")

    return {
        "X_train": X_train,
        "X_val": X_val,
        "X_test": X_test,
        "y_train": y_train,
        "y_val": y_val,
        "y_test": y_test,
        "y_cat_train": y_cat_train,
        "y_cat_val": y_cat_val,
        "y_cat_test": y_cat_test,
        "scaler": scaler,
        "feature_encoders": feature_encoders,
        "target_encoder": target_encoder,
        "feature_names": feature_names
    }

if __name__ == "__main__":
    data_dict = load_and_preprocess_data()
