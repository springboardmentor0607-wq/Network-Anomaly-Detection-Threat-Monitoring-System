import os
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib

try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

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

IDENTIFIER_COLUMNS = [
    'srcip', 'dstip', 'source_ip', 'destination_ip', 'source ip', 'destination ip',
    'sport', 'dsport', 'source_port', 'destination_port', 'source port', 'destination port',
    'stime', 'ltime', 'timestamp', 'flow id', 'flow_id', 'unnamed: 0'
]


def find_dataset_directory():
    """Find dataset folder containing raw CSV files."""
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
    if any(k in s for k in ['malware', 'exploit', 'fuzzer', 'worm', 'backdoor', 'shellcode', 'analysis', 'reconnaissance']):
        return 'Malware'
    return 'Benign'


def load_and_prepare_data(dataset_dir):
    """Load raw dataset CSVs, map labels to target attack categories, and preprocess features."""
    csv_files = list(dataset_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in dataset directory: {dataset_dir}")

    logger.info(f"Loading {len(csv_files)} CSV file(s) for multiclass model training...")
    dataframes = []
    
    for f in csv_files:
        filename = f.name.lower()
        if "unsw" in filename:
            df = pd.read_csv(f, header=None, nrows=50000, low_memory=False)
            if df.shape[1] == len(UNSW_COLUMNS):
                df.columns = UNSW_COLUMNS
        else:
            df = pd.read_csv(f, nrows=50000, low_memory=False)
            
        df.columns = df.columns.str.strip()
        
        label_col = None
        for col in ['Label', 'label', 'attack_cat', 'Attack_Cat']:
            if col in df.columns:
                label_col = col
                break
                
        if label_col:
            df['Attack_Category'] = df[label_col].apply(map_attack_category)
            dataframes.append(df)

    merged = pd.concat(dataframes, ignore_index=True, join='outer')
    merged.drop_duplicates(inplace=True)
    merged.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    drop_cols = [c for c in merged.columns if c.lower() in IDENTIFIER_COLUMNS or c in ['Label', 'label', 'attack_cat', 'Attack_Cat'] or c.lower().startswith('unnamed')]
    merged.drop(columns=[c for c in drop_cols if c in merged.columns and c != 'Attack_Category'], inplace=True)
    
    merged.dropna(subset=['Attack_Category'], inplace=True)
    
    y = merged['Attack_Category']
    X = merged.drop(columns=['Attack_Category'])
    
    for col in X.columns:
        if X[col].dtype == object or X[col].dtype.name == 'category':
            mode_val = X[col].mode()
            fill_val = mode_val[0] if not mode_val.empty else 'Unknown'
            X[col] = X[col].fillna(fill_val).astype(str)
        else:
            median_val = X[col].median()
            fill_val = median_val if not pd.isna(median_val) else 0.0
            X[col] = X[col].fillna(fill_val)
            
    for col in X.select_dtypes(include=['object', 'category']).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y


def print_multiclass_distribution(y_series, name="Dataset"):
    """Print count and percentage breakdown for multiclass labels."""
    counts = y_series.value_counts(normalize=False)
    percentages = y_series.value_counts(normalize=True) * 100.0
    
    print(f"\n--- {name} Multi-Class Distribution ---")
    for cls_name in counts.index:
        print(f"  Class '{cls_name}': {counts[cls_name]} samples ({percentages[cls_name]:.2f}%)")
    print("-" * (len(name) + 38))


def find_processed_dataset():
    """Locate processed_dataset.csv in backend/models, backend/ml or relative directories."""
    base_dir = Path(__file__).resolve().parent.parent
    possible_paths = [
        base_dir / "models" / "processed_dataset.csv",
        base_dir / "ml" / "processed_dataset.csv",
        Path("backend/models/processed_dataset.csv"),
        Path("backend/ml/processed_dataset.csv"),
        Path("processed_dataset.csv")
    ]
    for p in possible_paths:
        if p.exists():
            return p
    return None


def train_multiclass_model():
    """Train RandomForestClassifier for multi-class attack type prediction with stratified split."""
    dataset_path = find_processed_dataset()
    if dataset_path and dataset_path.exists():
        logger.info(f"Loading processed dataset from {dataset_path}...")
        df = pd.read_csv(dataset_path)
        if 'Attack_Category' in df.columns:
            drop_cols = [c for c in ['Label', 'Attack_Category'] if c in df.columns]
            X = df.drop(columns=drop_cols)
            y = df['Attack_Category']
        else:
            dataset_dir = find_dataset_directory()
            X, y = load_and_prepare_data(dataset_dir)
    else:
        dataset_dir = find_dataset_directory()
        X, y = load_and_prepare_data(dataset_dir)
    
    logger.info("Performing stratified train-test split (test_size=0.2, random_state=42, stratify=y)...")
    
    # Stratified train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Print distribution of both sets
    print_multiclass_distribution(y_train, name="Training Set (Pre-Balancing)")
    print_multiclass_distribution(y_test, name="Testing Set (Unmodified)")
    
    # Class imbalance detection on training set
    train_counts = y_train.value_counts()
    min_count = train_counts.min()
    max_count = train_counts.max()
    imbalance_ratio = min_count / max_count if max_count > 0 else 1.0
    
    is_imbalanced = imbalance_ratio < 0.40
    balancing_method = "None (Dataset is balanced)"
    class_weight = None

    if is_imbalanced:
        smote_applied = False
        if HAS_SMOTE and min_count >= 6:
            try:
                k_neighbors = min(5, min_count - 1)
                logger.info(f"Applying SMOTE to training set with k_neighbors={k_neighbors}...")
                smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
                X_train, y_train = smote.fit_resample(X_train, y_train)
                balancing_method = f"SMOTE over-sampling (k_neighbors={k_neighbors})"
                smote_applied = True
                print_multiclass_distribution(y_train, name="Training Set (Post-SMOTE Balancing)")
            except Exception as e:
                logger.warning(f"SMOTE failed: {e}. Automatically falling back to class_weight='balanced'.")

        if not smote_applied:
            class_weight = "balanced"
            balancing_method = "RandomForest(class_weight='balanced')"

    logger.info(f"Class imbalance detection: ratio={imbalance_ratio:.4f}, is_imbalanced={is_imbalanced}")
    logger.info(f"Balancing method applied to training set: {balancing_method}")
    
    logger.info("Training RandomForestClassifier multi-class attack model...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight=class_weight,
        random_state=42,
        n_jobs=-1
    )
    
    clf.fit(X_train, y_train)
    
    y_train_pred = clf.predict(X_train)
    y_test_pred = clf.predict(X_test)
    
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    
    print(f"\nMulti-class Training Accuracy: {train_acc:.4f}")
    print(f"Multi-class Testing Accuracy:  {test_acc:.4f}")
    
    logger.info("\nClassification Report (Multi-class Testing Set):")
    logger.info(f"\n{classification_report(y_test, y_test_pred)}")
    
    models_dir = Path(__file__).resolve().parent.parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    model_path = models_dir / "attack_classifier.pkl"
    
    logger.info(f"Saving multi-class attack classifier to {model_path}...")
    joblib.dump(clf, model_path)
    logger.info("Multi-class model training completed successfully!")
    
    return clf, train_acc, test_acc


if __name__ == "__main__":
    train_multiclass_model()
