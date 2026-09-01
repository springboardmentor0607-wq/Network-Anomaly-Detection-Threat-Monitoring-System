import numpy as np
import pandas as pd

class FeatureExtractor:
    @staticmethod
    def extract_derived_features(df: pd.DataFrame) -> pd.DataFrame:
        df_out = df.copy()
        # Clean column names by stripping leading/trailing whitespace
        df_out.columns = [str(c).strip() for c in df_out.columns]

        # Handle CICIDS2017 naming
        if "Total Length of Fwd Packets" in df_out.columns or "Total Fwd Packets" in df_out.columns:
            fwd_b = pd.to_numeric(df_out.get("Total Length of Fwd Packets", 0), errors='coerce').fillna(0)
            bwd_b = pd.to_numeric(df_out.get("Total Length of Bwd Packets", 0), errors='coerce').fillna(0)
            total_bytes = fwd_b + bwd_b

            fwd_p = pd.to_numeric(df_out.get("Total Fwd Packets", 1), errors='coerce').fillna(1)
            bwd_p = pd.to_numeric(df_out.get("Total Backward Packets", 0), errors='coerce').fillna(0)
            total_pkts = fwd_p + bwd_p

            dur_sec = pd.to_numeric(df_out.get("Flow Duration", 0), errors='coerce').fillna(0) / 1000000.0

            df_out["Flow Bytes/s"] = total_bytes / (dur_sec + 1e-6)
            df_out["Flow Packets/s"] = total_pkts / (dur_sec + 1e-6)
            df_out["Average Packet Size"] = total_bytes / (total_pkts + 1e-6)

        # Handle UNSW-NB15 naming
        elif "sbytes" in df_out.columns:
            total_bytes = pd.to_numeric(df_out.get("sbytes", 0), errors='coerce').fillna(0) + pd.to_numeric(df_out.get("dbytes", 0), errors='coerce').fillna(0)
            total_pkts = pd.to_numeric(df_out.get("spkts", 1), errors='coerce').fillna(1) + pd.to_numeric(df_out.get("dpkts", 0), errors='coerce').fillna(0)
            dur_sec = pd.to_numeric(df_out.get("dur", 0.0), errors='coerce').fillna(0.0)

            df_out["rate"] = total_pkts / (dur_sec + 1e-6)
            df_out["sload"] = (pd.to_numeric(df_out.get("sbytes", 0), errors='coerce').fillna(0) * 8) / (dur_sec + 1e-6)
            df_out["dload"] = (pd.to_numeric(df_out.get("dbytes", 0), errors='coerce').fillna(0) * 8) / (dur_sec + 1e-6)
            df_out["smean"] = pd.to_numeric(df_out.get("sbytes", 0), errors='coerce').fillna(0) / (total_pkts + 1e-6)
            df_out["dmean"] = pd.to_numeric(df_out.get("dbytes", 0), errors='coerce').fillna(0) / (total_pkts + 1e-6)

        return df_out
