import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from scipy import sparse
import joblib

# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_PATH = (
    BASE_DIR
    / "datasets"
    / "UNSW-NB15"
    / "Training and Testing Sets"
    / "UNSW_NB15_training-set.csv"
)

TEST_PATH = (
    BASE_DIR
    / "datasets"
    / "UNSW-NB15"
    / "Training and Testing Sets"
    / "UNSW_NB15_testing-set.csv"
)

PROCESSED_DIR = BASE_DIR / "datasets" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("Loading UNSW-NB15 training dataset...")
train_df = pd.read_csv(TRAIN_PATH)

print("Loading UNSW-NB15 testing dataset...")
test_df = pd.read_csv(TEST_PATH)

print("\n===== RAW DATA =====")
print("Training shape:", train_df.shape)
print("Testing shape:", test_df.shape)


# ============================================================
# CLEAN COLUMN NAMES
# ============================================================

train_df.columns = train_df.columns.str.strip()
test_df.columns = test_df.columns.str.strip()


# ============================================================
# TARGET
# ============================================================

TARGET = "label"

if TARGET not in train_df.columns:
    raise ValueError(
        f"Target column '{TARGET}' was not found in the training dataset."
    )

if TARGET not in test_df.columns:
    raise ValueError(
        f"Target column '{TARGET}' was not found in the testing dataset."
    )


# ============================================================
# REMOVE UNNECESSARY / LEAKAGE COLUMNS
# ============================================================

# attack_cat describes the attack category.
# We are first building a binary classifier:
# 0 = Normal
# 1 = Attack
#
# Therefore attack_cat should NOT be used as an input feature.

DROP_COLUMNS = [
    TARGET,
    "attack_cat",
]

# Remove only columns that actually exist
DROP_COLUMNS = [
    column
    for column in DROP_COLUMNS
    if column in train_df.columns
]


# ============================================================
# SPLIT FEATURES AND TARGET
# ============================================================

X_train = train_df.drop(columns=DROP_COLUMNS)
y_train = train_df[TARGET]

X_test = test_df.drop(columns=DROP_COLUMNS)
y_test = test_df[TARGET]


print("\n===== TARGET DISTRIBUTION =====")

print("\nTraining labels:")
print(y_train.value_counts())

print("\nTesting labels:")
print(y_test.value_counts())


# ============================================================
# IDENTIFY COLUMN TYPES
# ============================================================

categorical_columns = X_train.select_dtypes(
    include=["object"]
).columns.tolist()

numerical_columns = X_train.select_dtypes(
    include=[np.number]
).columns.tolist()

print("\n===== FEATURE INFORMATION =====")

print("Numerical features:", len(numerical_columns))
print("Categorical features:", len(categorical_columns))

print("\nCategorical columns:")
print(categorical_columns)

print("\nNumerical columns:")
print(numerical_columns)


# ============================================================
# NUMERICAL PREPROCESSING
# ============================================================

numerical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        ),
        (
            "scaler",
            StandardScaler()
        ),
    ]
)


# ============================================================
# CATEGORICAL PREPROCESSING
# ============================================================

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        ),
    ]
)


# ============================================================
# COMBINE PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numerical",
            numerical_pipeline,
            numerical_columns
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_columns
        ),
    ]
)


# ============================================================
# FIT ON TRAINING DATA
# ============================================================

print("\nPreprocessing training data...")

X_train_processed = preprocessor.fit_transform(X_train)

print("Training data preprocessing complete.")


# ============================================================
# TRANSFORM TEST DATA
# ============================================================

print("Preprocessing testing data...")

X_test_processed = preprocessor.transform(X_test)

print("Testing data preprocessing complete.")


# ============================================================
# SAVE PREPROCESSOR
# ============================================================

PREPROCESSOR_PATH = (
    PROCESSED_DIR / "unsw_preprocessor.joblib"
)

joblib.dump(
    preprocessor,
    PREPROCESSOR_PATH
)


# ============================================================
# SAVE PROCESSED DATA
# ============================================================

TRAIN_FEATURES_PATH = (
    PROCESSED_DIR / "X_train.npz"
)

TEST_FEATURES_PATH = (
    PROCESSED_DIR / "X_test.npz"
)

TRAIN_LABELS_PATH = (
    PROCESSED_DIR / "y_train.npy"
)

TEST_LABELS_PATH = (
    PROCESSED_DIR / "y_test.npy"
)

sparse.save_npz(
    TRAIN_FEATURES_PATH,
    X_train_processed
)

sparse.save_npz(
    TEST_FEATURES_PATH,
    X_test_processed
)

np.save(
    TRAIN_LABELS_PATH,
    y_train.to_numpy()
)

np.save(
    TEST_LABELS_PATH,
    y_test.to_numpy()
)


# ============================================================
# FINAL INFORMATION
# ============================================================

print("\n===== PREPROCESSING COMPLETE =====")

print(
    "Processed training shape:",
    X_train_processed.shape
)

print(
    "Processed testing shape:",
    X_test_processed.shape
)

print(
    "Preprocessor saved to:",
    PREPROCESSOR_PATH
)

print(
    "Processed datasets saved to:",
    PROCESSED_DIR
)

print("\nFiles created:")
print("✓ unsw_preprocessor.joblib")
print("✓ X_train.npz")
print("✓ X_test.npz")
print("✓ y_train.npy")
print("✓ y_test.npy")