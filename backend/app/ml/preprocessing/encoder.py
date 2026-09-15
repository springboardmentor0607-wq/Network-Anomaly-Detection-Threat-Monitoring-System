import pandas as pd
import numpy as np
from typing import List
from sklearn.preprocessing import OneHotEncoder

class CategoricalEncoder:
    def __init__(self, categorical_columns: List[str]):
        self.categorical_columns = categorical_columns
        self.encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        self.is_fitted = False
        self.feature_names: List[str] = []

    def fit(self, df: pd.DataFrame) -> 'CategoricalEncoder':
        cat_df = df[self.categorical_columns].astype(str)
        self.encoder.fit(cat_df)
        self.feature_names = list(self.encoder.get_feature_names_out(self.categorical_columns))
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_fitted:
            raise ValueError("CategoricalEncoder must be fitted before calling transform()")
        cat_df = df[self.categorical_columns].astype(str)
        encoded_array = self.encoder.transform(cat_df)
        return pd.DataFrame(encoded_array, columns=self.feature_names, index=df.index)

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        return self.fit(df).transform(df)
