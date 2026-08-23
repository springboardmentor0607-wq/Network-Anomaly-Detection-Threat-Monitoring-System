import os
import sys
import json
import logging
from pathlib import Path
import pandas as pd
import numpy as np

try:
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.model_selection import train_test_split
    import joblib
except ImportError:
    class StandardScaler:
        def fit_transform(self, X):
            return (X - X.mean()) / (X.std() + 1e-8)
    class LabelEncoder:
        def __init__(self):
            self.classes_ = np.array([])
        def fit_transform(self, y):
            self.classes_ = np.unique(y)
            mapping = {val: idx for idx, val in enumerate(self.classes_)}
            return np.array([mapping[val] for val in y])
    def train_test_split(X, y, test_size=0.2, random_state=42, stratify=None):
        n = len(X)
        split_idx = int(n * (1 - test_size))
        return X.iloc[:split_idx], X.iloc[split_idx:], y.iloc[:split_idx], y.iloc[split_idx:]
    joblib = None

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("NetShieldPreprocessing")

class DatasetPreprocessor:
    def __init__(self, dataset_name, raw_dir, processed_dir):
        self.dataset_name = dataset_name
        self.raw_dir = Path(raw_dir)
        self.processed_dir = Path(processed_dir)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        self.label_encoders = {}
        self.scaler = StandardScaler()
        
        self.report = {
            "dataset_name": dataset_name,
            "original_rows": 0,
            "processed_rows": 0,
            "removed_duplicates": 0,
            "missing_values_fixed": 0,
            "columns_removed": [],
            "class_distribution": {},
            "attack_categories": [],
            "normal_traffic_percentage": 0.0,
            "dataset_statistics": {},
            "processing_date": None
        }
        
        self.metadata = {
            "dataset_name": dataset_name,
            "feature_names": [],
            "target_column": "Label",
            "categorical_columns": [],
            "numerical_columns": [],
            "label_mapping": {}
        }

    def load_and_merge_csvs(self):
        csv_files = list(self.raw_dir.glob("*.csv"))
        if not csv_files:
            logger.warning(f"No CSV files found in {self.raw_dir}")
            return None
        
        logger.info(f"Loading {len(csv_files)} CSV files for {self.dataset_name}...")
        
        unsw_cols = [
            'srcip', 'sport', 'dstip', 'dsport', 'proto', 'state', 'dur', 'sbytes', 'dbytes',
            'sttl', 'dttl', 'sloss', 'dloss', 'service', 'Sload', 'Dload', 'Spkts', 'Dpkts',
            'swnd', 'dwnd', 'stcpb', 'dtcpb', 'smeansz', 'dmeansz', 'trans_depth', 'res_bdy_len',
            'Sjit', 'Djit', 'Stime', 'Ltime', 'sintpkt', 'dintpkt', 'tcprtt', 'synack', 'ackdat',
            'is_sm_ips_ports', 'ct_state_ttl', 'ct_flw_http_mthd', 'is_ftp_login', 'ct_ftp_cmd',
            'ct_srv_src', 'ct_srv_dst', 'ct_dst_ltm', 'ct_src_ltm', 'ct_src_dport_ltm',
            'ct_dst_sport_ltm', 'ct_dst_src_ltm', 'attack_cat', 'Label'
        ]

        df_list = []
        for file in csv_files:
            if "LIST_EVENTS" in file.name.upper():
                continue
            try:
                # Check if first line contains column headers or values
                first_line = file.open("r", encoding="utf-8", errors="ignore").readline()
                if "59.166" in first_line or "149.171" in first_line or (self.dataset_name == "UNSW-NB15" and not first_line.startswith("srcip") and not first_line.startswith("Label")):
                    df_temp = pd.read_csv(file, header=None, names=unsw_cols, low_memory=False)
                else:
                    df_temp = pd.read_csv(file, low_memory=False)

                # Strip leading/trailing spaces from column names
                df_temp.columns = [str(c).strip() for c in df_temp.columns]
                df_list.append(df_temp)
                logger.info(f"Loaded {file.name}: {len(df_temp)} rows, {len(df_temp.columns)} cols")
            except Exception as e:
                logger.error(f"Error loading {file.name}: {str(e)}")

        if not df_list:
            return None

        merged_df = pd.concat(df_list, ignore_index=True)
        self.report["original_rows"] = len(merged_df)
        logger.info(f"Merged total original rows: {len(merged_df)}")
        return merged_df

    def create_synthetic_sample(self):
        """Create a synthetic dataset for demonstration when raw files are not present."""
        logger.info(f"Generating synthetic seed dataset for {self.dataset_name} demonstration...")
        np.random.seed(42)
        n_samples = 1000
        
        data = {
            "Flow Duration": np.random.randint(100, 10000, n_samples),
            "Total Fwd Packets": np.random.randint(1, 50, n_samples),
            "Total Backward Packets": np.random.randint(1, 50, n_samples),
            "Flow Bytes/s": np.random.uniform(10.0, 50000.0, n_samples),
            "Flow Packets/s": np.random.uniform(1.0, 1000.0, n_samples),
            "Protocol": np.random.choice(["TCP", "UDP", "ICMP"], n_samples),
            "Service": np.random.choice(["HTTP", "DNS", "SSH", "FTP", "OTHER"], n_samples),
            "Flag": np.random.choice(["SF", "S0", "REJ", "RSTR"], n_samples),
            "ConstantCol": [1] * n_samples,
            "EmptyCol": [np.nan] * n_samples,
            "Label": np.random.choice(["BENIGN", "DDoS", "PortScan", "Bot", "Infiltration"], n_samples, p=[0.7, 0.1, 0.1, 0.05, 0.05])
        }
        df = pd.DataFrame(data)
        self.report["original_rows"] = len(df)
        return df

    def run_pipeline(self):
        df = self.load_and_merge_csvs()
        if df is None:
            df = self.create_synthetic_sample()

        # 1. Detect target column
        target_candidates = ["Label", "label", "attack_cat", "class", "Class"]
        target_col = None
        for col in target_candidates:
            if col in df.columns:
                target_col = col
                break
        
        if not target_col:
            target_col = df.columns[-1]
        
        self.metadata["target_column"] = target_col

        # 2. Remove duplicate records
        initial_len = len(df)
        df = df.drop_duplicates()
        self.report["removed_duplicates"] = initial_len - len(df)
        logger.info(f"Removed {self.report['removed_duplicates']} duplicate rows")

        # 3. Drop empty columns (all NaN)
        empty_cols = df.columns[df.isnull().all()].tolist()
        df = df.drop(columns=empty_cols)
        self.report["columns_removed"].extend(empty_cols)

        # 4. Drop constant-value columns
        constant_cols = [c for c in df.columns if df[c].nunique() <= 1 and c != target_col]
        df = df.drop(columns=constant_cols)
        self.report["columns_removed"].extend(constant_cols)

        # 5. Handle missing values
        null_count = df.isnull().sum().sum()
        self.report["missing_values_fixed"] = int(null_count)
        
        # Replace inf and -inf with NaN
        df = df.replace([np.inf, -np.inf], np.nan)
        
        # Impute missing values
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                if df[col].dtype == 'object' or df[col].dtype == 'category':
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")
                else:
                    df[col] = df[col].fillna(df[col].median() if not np.isnan(df[col].median()) else 0)

        # 6. Detect & clean invalid rows
        df = df.dropna()
        self.report["processed_rows"] = len(df)

        # 7. Identify Categorical & Numerical Features
        cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        if target_col in cat_cols:
            cat_cols.remove(target_col)
        
        num_cols = df.select_dtypes(include=['int64', 'float64', 'int32', 'float32']).columns.tolist()
        if target_col in num_cols:
            num_cols.remove(target_col)

        self.metadata["categorical_columns"] = cat_cols
        self.metadata["numerical_columns"] = num_cols

        # 8. Encode Target Label
        le_target = LabelEncoder()
        df[target_col] = le_target.fit_transform(df[target_col].astype(str))
        label_mapping = {str(cls): int(idx) for idx, cls in enumerate(le_target.classes_)}
        self.metadata["label_mapping"] = label_mapping
        self.report["attack_categories"] = list(label_mapping.keys())

        # Calculate class distribution
        counts = df[target_col].value_counts().to_dict()
        class_dist = {str(le_target.classes_[k]): int(v) for k, v in counts.items()}
        self.report["class_distribution"] = class_dist

        benign_key = next((k for k in class_dist if "BENIGN" in k.upper() or "NORMAL" in k.upper()), None)
        if benign_key:
            self.report["normal_traffic_percentage"] = round((class_dist[benign_key] / len(df)) * 100, 2)
        else:
            first_key = list(class_dist.keys())[0] if class_dist else None
            self.report["normal_traffic_percentage"] = round((class_dist[first_key] / len(df)) * 100, 2) if first_key else 0.0

        # 9. Encode Categorical Features
        for col in cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le

        # 10. Normalize Numerical Features
        if num_cols:
            df[num_cols] = self.scaler.fit_transform(df[num_cols])

        # Feature names
        feature_cols = [c for c in df.columns if c != target_col]
        self.metadata["feature_names"] = feature_cols

        # 11. Class Imbalance Hook (SMOTE template ready)
        # Note: Hook is prepared here, skipped unless explicitly requested
        # X = df[feature_cols]
        # y = df[target_col]
        # smote = SMOTE(random_state=42)
        # X_res, y_res = smote.fit_resample(X, y)

        # 12. Split Train / Validation / Test datasets (80% / 10% / 10%)
        X = df[feature_cols]
        y = df[target_col]

        X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None)
        X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp if len(np.unique(y_temp)) > 1 else None)

        train_df = pd.concat([X_train, y_train], axis=1)
        val_df = pd.concat([X_val, y_val], axis=1)
        test_df = pd.concat([X_test, y_test], axis=1)

        # Save processed CSV files
        train_df.to_csv(self.processed_dir / "train.csv", index=False)
        val_df.to_csv(self.processed_dir / "validation.csv", index=False)
        test_df.to_csv(self.processed_dir / "test.csv", index=False)
        
        logger.info(f"Saved processed CSVs: train ({len(train_df)}), validation ({len(val_df)}), test ({len(test_df)})")

        # Dataset statistics
        self.report["dataset_statistics"] = {
            "total_features": len(feature_cols),
            "categorical_features_count": len(cat_cols),
            "numerical_features_count": len(num_cols),
            "train_samples": len(train_df),
            "validation_samples": len(val_df),
            "test_samples": len(test_df)
        }
        
        import datetime
        self.report["processing_date"] = datetime.datetime.now().isoformat()

        # Save metadata.json & report.json
        with open(self.processed_dir / "metadata.json", "w") as f:
            json.dump(self.metadata, f, indent=2)

        with open(self.processed_dir / "report.json", "w") as f:
            json.dump(self.report, f, indent=2)

        logger.info(f"Preprocessing complete for {self.dataset_name}. Metadata and report saved in {self.processed_dir}")
        return self.report

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=str, default="CICIDS2017")
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent
    raw_path = base_dir / "raw" / args.dataset
    processed_path = base_dir / "processed" / args.dataset

    processor = DatasetPreprocessor(args.dataset, raw_path, processed_path)
    res = processor.run_pipeline()
    print(json.dumps(res, indent=2))
