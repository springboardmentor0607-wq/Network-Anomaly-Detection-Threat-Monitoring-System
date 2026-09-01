import pandas as pd
from typing import List
from sklearn.preprocessing import StandardScaler

class NumericScaler:
    def __init__(self, numeric_columns: List[str]):
        self.numeric_columns = numeric_columns
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, df: pd.DataFrame) -> 'NumericScaler':
        num_df = df[self.numeric_columns]
        self.scaler.fit(num_df)
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_fitted:
            raise ValueError("NumericScaler must be fitted before calling transform()")
        num_df = df[self.numeric_columns]
        scaled_array = self.scaler.transform(num_df)
        return pd.DataFrame(scaled_array, columns=self.numeric_columns, index=df.index)

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        return self.fit(df).transform(df)
