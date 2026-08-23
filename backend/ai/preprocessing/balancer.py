import numpy as np
from imblearn.over_sampling import SMOTE

def balance_dataset(X, y, random_state=42):
    """Apply SMOTE oversampling to balance the class distribution.

    Args:
        X (np.ndarray): Feature matrix.
        y (np.ndarray): Target vector.
        random_state (int): Random seed for reproducibility.
    Returns:
        tuple: (X_balanced, y_balanced) as numpy arrays.
    """
    smote = SMOTE(random_state=random_state)
    X_res, y_res = smote.fit_resample(X, y)
    return X_res, y_res
