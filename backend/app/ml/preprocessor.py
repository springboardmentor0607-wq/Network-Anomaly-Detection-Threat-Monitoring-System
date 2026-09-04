import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import LabelEncoder, StandardScaler

COLUMNS = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
    'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
    'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login',
    'count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate',
    'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
    'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
    'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate',
    'label', 'difficulty_level'
]

SELECTED_FEATURES = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
    'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
    'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login'
]

ATTACK_MAP = {
    'normal': 'NORMAL',
    'neptune': 'DOS', 'back': 'DOS', 'land': 'DOS', 'pod': 'DOS', 'smurf': 'DOS', 'teardrop': 'DOS',
    'mailbomb': 'DOS', 'apache2': 'DOS', 'processtable': 'DOS', 'udpstorm': 'DOS',
    'ipsweep': 'PROBE', 'nmap': 'PROBE', 'portsweep': 'PROBE', 'satan': 'PROBE', 'mscan': 'PROBE', 'saint': 'PROBE',
    'ftp_write': 'R2L', 'guess_passwd': 'R2L', 'imap': 'R2L', 'multihop': 'R2L', 'phf': 'R2L',
    'spy': 'R2L', 'warezclient': 'R2L', 'warezmaster': 'R2L', 'sendmail': 'R2L', 'snmpgetattack': 'R2L',
    'snmpguess': 'R2L', 'worm': 'R2L', 'xlock': 'R2L', 'xsnoop': 'R2L', 'named': 'R2L',
    'buffer_overflow': 'U2R', 'loadmodule': 'U2R', 'perl': 'U2R', 'rootkit': 'U2R', 'ps': 'U2R',
    'sqlattack': 'U2R', 'xterm': 'U2R'
}

CLASSES = ['NORMAL', 'PROBE', 'DOS', 'R2L', 'U2R']

class DataPreprocessor:
    def __init__(self):
        self.encoders = {}
        self.scaler = StandardScaler()
        self.categorical_cols = ['protocol_type', 'service', 'flag']
        self.numeric_cols = [f for f in SELECTED_FEATURES if f not in self.categorical_cols]

    def fit_transform(self, df: pd.DataFrame):
        df_clean = df.copy()
        for col in self.categorical_cols:
            le = LabelEncoder()
            df_clean[col] = le.fit_transform(df_clean[col].astype(str).str.lower())
            self.encoders[col] = le
            
        df_clean[self.numeric_cols] = self.scaler.fit_transform(df_clean[self.numeric_cols])
        return df_clean[SELECTED_FEATURES]

    def transform_single(self, input_dict: dict) -> np.ndarray:
        df = pd.DataFrame([input_dict])
        for col in self.categorical_cols:
            val = str(df[col].iloc[0]).lower()
            le = self.encoders.get(col)
            if le and val in le.classes_:
                df[col] = le.transform([val])[0]
            else:
                df[col] = 0
        df[self.numeric_cols] = self.scaler.transform(df[self.numeric_cols])
        return df[SELECTED_FEATURES].values

    def save(self, filepath: str | None = None):
        filepath = filepath or str(Path(__file__).resolve().parents[2] / "saved_models" / "preprocessor.joblib")
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)

    @staticmethod
    def load(filepath: str | None = None):
        filepath = filepath or str(Path(__file__).resolve().parents[2] / "saved_models" / "preprocessor.joblib")
        if os.path.exists(filepath):
            return joblib.load(filepath)
        return None