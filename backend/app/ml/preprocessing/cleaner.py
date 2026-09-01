import numpy as np
import pandas as pd
from typing import List

class DataCleaner:
    @staticmethod
    def clean_dataframe(df: pd.DataFrame, numeric_columns: List[str]) -> pd.DataFrame:
        df_clean = df.copy()

        # Clean column names
        df_clean.columns = [str(c).strip() for c in df_clean.columns]

        # Remove duplicate rows
        df_clean = df_clean.drop_duplicates()

        # Replace infinite values with NaN
        df_clean = df_clean.replace([np.inf, -np.inf], np.nan)

        # Impute missing numeric values with column median or 0
        for col in numeric_columns:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                median_val = df_clean[col].median()
                if pd.isna(median_val):
                    median_val = 0.0
                df_clean[col] = df_clean[col].fillna(median_val)
                # Clip negative values for non-negative telemetry metrics
                df_clean[col] = df_clean[col].clip(lower=0.0)

        return df_clean
