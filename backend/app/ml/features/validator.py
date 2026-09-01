import pandas as pd
from typing import Tuple, List
from app.ml.features.schema import FeatureSchema

class FeatureValidator:
    @staticmethod
    def validate_dataframe(df: pd.DataFrame, schema: FeatureSchema) -> Tuple[bool, List[str]]:
        missing_fields = []
        cols = [c.strip() for c in df.columns]

        for num_col in schema.numeric_features:
            if num_col not in cols:
                missing_fields.append(f"Missing numeric feature: {num_col}")

        for cat_col in schema.categorical_features:
            if cat_col not in cols:
                missing_fields.append(f"Missing categorical feature: {cat_col}")

        is_valid = len(missing_fields) == 0
        return is_valid, missing_fields
