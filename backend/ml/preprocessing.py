import os
import glob
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# UNSW-NB15 49-column dataset header definition
UNSW_COLUMNS = [
    'srcip', 'sport', 'dstip', 'dsport', 'proto', 'state', 'dur', 
    'sbytes', 'dbytes', 'sttl', 'dttl', 'sloss', 'dloss', 'service', 
    'sload', 'dload', 'spkts', 'dpkts', 'swin', 'dwin', 'stcpb', 
    'dtcpb', 'smeansz', 'dmeansz', 'trans_depth', 'res_bkt', 'Sjit', 
    'Djit', 'Stime', 'Ltime', 'sintpkt', 'dintpkt', 'tcprtt', 'synack', 
    'ackdat', 'is_sm_ips_ports', 'ct_state_ttl', 'ct_flw_http_mthd', 
    'is_ftp_login', 'ct_ftp_cmd', 'ct_srv_src', 'ct_srv_dst', 
    'ct_dst_ltm', 'ct_src_ltm', 'ct_src_dport_ltm', 'ct_dst_sport_ltm', 
    'ct_dst_src_ltm', 'attack_cat', 'Label'
]

# Non-useful / identifier columns for ML intrusion detection
IDENTIFIER_COLUMNS = [
    'srcip', 'dstip', 'source_ip', 'destination_ip', 'source ip', 'destination ip',
    'sport', 'dsport', 'source_port', 'destination_port', 'source port', 'destination port',
    'stime', 'ltime', 'timestamp', 'flow id', 'flow_id', 'unnamed: 0'
]


def find_dataset_directory():
    """Locate the dataset folder in the project."""
    base_dir = Path(__file__).resolve().parent.parent
    possible_paths = [
        base_dir / "app" / "data",
        base_dir / "data",
        Path("app/data"),
        Path("data"),
        Path("../app/data")
    ]
    for p in possible_paths:
        if p.exists() and p.is_dir():
            return p
    raise FileNotFoundError("Could not locate existing dataset folder.")


def load_single_csv(file_path):
    """Load a single CSV file with proper column naming handling."""
    logger.info(f"Loading file: {file_path.name}")
    filename = file_path.name.lower()
    
    # Sample up to 50,000 rows per file for performant execution if file is very large
    if "unsw" in filename:
        df = pd.read_csv(file_path, header=None, nrows=50000, low_memory=False)
        if df.shape[1] == len(UNSW_COLUMNS):
            df.columns = UNSW_COLUMNS
    else:
        df = pd.read_csv(file_path, nrows=50000, low_memory=False)
        
    df.columns = df.columns.str.strip()
    return df


def map_attack_category(val):
    """Map raw dataset label strings into standard multi-class attack categories."""
    if pd.isna(val):
        return 'Benign'
    s = str(val).strip().lower()
    if s in {'benign', 'normal', '0', '0.0', 'false'}:
        return 'Benign'
    if 'ddos' in s:
        return 'DDoS'
    if 'dos' in s:
        return 'DoS'
    if 'portscan' in s or 'port scan' in s:
        return 'PortScan'
    if 'bot' in s:
        return 'Bot'
    if 'bruteforce' in s or 'brute force' in s or 'patator' in s:
        return 'BruteForce'
    if 'infilteration' in s or 'infiltration' in s:
        return 'Infiltration'
    if any(k in s for k in ['web attack', 'sqli', 'xss', 'sql injection', 'cross site']):
        return 'Web Attack'
    if any(k in s for k in ['malware', 'exploit', 'fuzzer', 'worm', 'backdoor', 'shellcode', 'analysis', 'reconnaissance']):
        return 'Malware'
    return 'Benign'


def convert_label_to_binary(df):
    """Convert target Label column into binary values: Benign = 0, Attack = 1, and set Attack_Category."""
    label_col = None
    for candidate in ['Label', 'label', 'attack_cat', 'Attack_Cat']:
        if candidate in df.columns:
            label_col = candidate
            break
            
    if label_col is None:
        raise KeyError("Target label column not found in DataFrame.")
        
    benign_identifiers = {'benign', 'normal', '0', '0.0', 'false'}
    
    def binary_mapper(val):
        if pd.isna(val):
            return np.nan
        s = str(val).strip().lower()
        if s in benign_identifiers:
            return 0
        return 1

    df['Attack_Category'] = df[label_col].apply(map_attack_category)
    df['Label'] = df[label_col].apply(binary_mapper)
    
    if label_col not in ['Label', 'Attack_Category'] and label_col in df.columns:
        df.drop(columns=[label_col], inplace=True)
        
    return df


def preprocess_datasets(dataset_dir=None, output_ml_dir=None, output_models_dir=None):
    """Main preprocessing pipeline for intrusion detection datasets."""
    base_backend = Path(__file__).resolve().parent.parent
    if dataset_dir is None:
        dataset_dir = find_dataset_directory()
    else:
        dataset_dir = Path(dataset_dir)
        
    if output_ml_dir is None:
        output_ml_dir = Path(__file__).resolve().parent
    else:
        output_ml_dir = Path(output_ml_dir)
        
    if output_models_dir is None:
        output_models_dir = base_backend / "models"
    else:
        output_models_dir = Path(output_models_dir)
        
    output_ml_dir.mkdir(parents=True, exist_ok=True)
    output_models_dir.mkdir(parents=True, exist_ok=True)
    
    csv_files = list(dataset_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in dataset folder: {dataset_dir}")
        
    logger.info(f"Found {len(csv_files)} CSV files in {dataset_dir}")
    
    dataframes = []
    for csv_file in csv_files:
        try:
            df = load_single_csv(csv_file)
            df = convert_label_to_binary(df)
            dataframes.append(df)
        except Exception as e:
            logger.warning(f"Skipping {csv_file.name} due to loading error: {e}")
            
    if not dataframes:
        raise ValueError("No valid CSV files were loaded.")
        
    logger.info("Merging CSV files into a single DataFrame...")
    merged_df = pd.concat(dataframes, ignore_index=True, join='outer')
    
    logger.info(f"Merged dataset shape before deduplication: {merged_df.shape}")
    merged_df.drop_duplicates(inplace=True)
    logger.info(f"Shape after removing duplicates: {merged_df.shape}")
    
    merged_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    merged_df.dropna(subset=['Label'], inplace=True)
    merged_df['Label'] = merged_df['Label'].astype(int)
    
    cols_to_drop = [c for c in merged_df.columns if c.lower() in IDENTIFIER_COLUMNS or c.lower().startswith('unnamed')]
    if cols_to_drop:
        logger.info(f"Removing identifier/unnecessary columns: {cols_to_drop}")
        merged_df.drop(columns=cols_to_drop, inplace=True)
        
    target_binary = merged_df['Label']
    target_category = merged_df['Attack_Category']
    features_df = merged_df.drop(columns=['Label', 'Attack_Category'])

    
    for col in features_df.columns:
        if features_df[col].dtype == object or features_df[col].dtype.name == 'category':
            mode_val = features_df[col].mode()
            fill_val = mode_val[0] if not mode_val.empty else 'Unknown'
            features_df[col] = features_df[col].fillna(fill_val).astype(str)
        else:
            median_val = features_df[col].median()
            fill_val = median_val if not pd.isna(median_val) else 0.0
            features_df[col] = features_df[col].fillna(fill_val)
            
    label_encoders = {}
    categorical_cols = features_df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    for col in categorical_cols:
        le = LabelEncoder()
        features_df[col] = le.fit_transform(features_df[col].astype(str))
        label_encoders[col] = le
        
    logger.info(f"Encoded {len(categorical_cols)} categorical column(s): {categorical_cols}")
    
    feature_columns = list(features_df.columns)
    
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features_df)
    
    processed_df = pd.DataFrame(scaled_features, columns=feature_columns)
    processed_df['Label'] = target_binary.values
    processed_df['Attack_Category'] = target_category.values
    
    # Save processed dataset to backend/ml and backend/models
    csv_path_ml = output_ml_dir / "processed_dataset.csv"
    csv_path_models = output_models_dir / "processed_dataset.csv"
    
    logger.info(f"Saving processed dataset to {csv_path_ml}...")
    processed_df.to_csv(csv_path_ml, index=False)
    processed_df.to_csv(csv_path_models, index=False)
    
    # Save pkl artifacts to backend/models/
    scaler_path = output_models_dir / "scaler.pkl"
    encoder_path = output_models_dir / "label_encoder.pkl"
    features_path = output_models_dir / "feature_columns.pkl"
    
    logger.info(f"Saving StandardScaler to {scaler_path}...")
    joblib.dump(scaler, scaler_path)
    
    logger.info(f"Saving LabelEncoder to {encoder_path}...")
    joblib.dump(label_encoders, encoder_path)
    
    logger.info(f"Saving feature columns to {features_path}...")
    joblib.dump(feature_columns, features_path)
    
    logger.info("Preprocessing completed successfully!")
    return processed_df, scaler, label_encoders, feature_columns


if __name__ == "__main__":
    preprocess_datasets()
