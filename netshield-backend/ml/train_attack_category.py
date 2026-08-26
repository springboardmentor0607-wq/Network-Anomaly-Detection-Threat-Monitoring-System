import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "..",
    "datasets",
    "UNSW-NB15",
    "Training and Testing Sets",
    "UNSW_NB15_training-set.csv"
)

MODEL_DIR = os.path.join(BASE_DIR, "models")

ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "netshield_encoder.pkl"
)

SCALER_PATH = os.path.join(
    MODEL_DIR,
    "netshield_scaler.pkl"
)

CATEGORY_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "netshield_attack_category_model.pkl"
)


# ============================================================
# LOAD DATA
# ============================================================

print("===== LOADING UNSW-NB15 DATA =====")

df = pd.read_csv(DATASET_PATH)

df.columns = df.columns.str.strip()

print("Dataset shape:", df.shape)


# ============================================================
# CHECK ATTACK CATEGORY
# ============================================================

if "attack_cat" not in df.columns:
    raise ValueError("attack_cat column was not found.")

print("\n===== ATTACK CATEGORIES =====")
print(df["attack_cat"].value_counts())


# ============================================================
# PREPARE FEATURES AND TARGET
# ============================================================

X = df.drop(columns=["label", "attack_cat"])

y = df["attack_cat"]


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

categorical_cols = [
    "proto",
    "service",
    "state"
]

numerical_cols = [
    col for col in X.columns
    if col not in categorical_cols
]


# ============================================================
# LOAD EXISTING ENCODER AND SCALER
# ============================================================

print("\n===== LOADING EXISTING PREPROCESSING =====")

encoder = joblib.load(ENCODER_PATH)
scaler = joblib.load(SCALER_PATH)

print("Encoder loaded.")
print("Scaler loaded.")


# ============================================================
# ENCODE CATEGORICAL FEATURES
# ============================================================

print("\nEncoding categorical features...")

encoded = encoder.transform(
    X[categorical_cols]
)

encoded_df = pd.DataFrame(
    encoded,
    columns=encoder.get_feature_names_out(categorical_cols)
)


# ============================================================
# NUMERICAL FEATURES
# ============================================================

numerical_df = X[numerical_cols].reset_index(drop=True)

final_features = pd.concat(
    [numerical_df, encoded_df],
    axis=1
)


# ============================================================
# MATCH TRAINING FEATURE ORDER
# ============================================================

final_features = final_features[
    scaler.feature_names_in_
]


# ============================================================
# SCALE FEATURES
# ============================================================

print("Scaling features...")

X_scaled = scaler.transform(final_features)

print("Final feature shape:", X_scaled.shape)


# ============================================================
# TRAIN CATEGORY MODEL
# ============================================================

print("\n===== TRAINING ATTACK CATEGORY MODEL =====")

category_model = RandomForestClassifier(
    n_estimators=150,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

category_model.fit(X_scaled, y)

print("Attack category model training completed!")


# ============================================================
# SAVE MODEL
# ============================================================

joblib.dump(
    category_model,
    CATEGORY_MODEL_PATH
)

print("\n===== MODEL SAVED =====")
print(
    "Saved to:",
    CATEGORY_MODEL_PATH
)

print("\nCategories:")
print(category_model.classes_)