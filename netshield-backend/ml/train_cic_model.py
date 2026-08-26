import os
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler


# ==============================
# PATHS
# ==============================

DATA_DIR = os.path.join("datasets", "processed_small")
MODEL_DIR = os.path.join("ml", "models")

os.makedirs(MODEL_DIR, exist_ok=True)


# ==============================
# CIC-IDS2017 FILES
# ==============================

files = [
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX_processed.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX_processed.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX_processed.csv",
    "Monday-WorkingHours.pcap_ISCX_processed.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX_processed.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX_processed.csv",
    "Tuesday-WorkingHours.pcap_ISCX_processed.csv",
    "Wednesday-workingHours.pcap_ISCX_processed.csv",
]


# ==============================
# LOAD DATA
# ==============================

print("\nLoading CIC-IDS2017 datasets...")

dataframes = []

for file in files:
    path = os.path.join(DATA_DIR, file)

    print(f"Loading: {file}")

    df = pd.read_csv(path)

    dataframes.append(df)

    print(f"  Shape: {df.shape}")


# ==============================
# COMBINE DATA
# ==============================

print("\nCombining datasets...")

data = pd.concat(dataframes, ignore_index=True)

print("Combined shape:", data.shape)


# ==============================
# REMOVE DUPLICATE / TEXT LABEL
# ==============================

# Keep numeric label for model training.
# The text Label column is not needed.

X = data.drop(columns=["Label", "label"])
y = data["label"]


# ==============================
# CLEAN FEATURE NAMES
# ==============================

X.columns = X.columns.astype(str)
feature_names = X.columns.tolist()

# ==============================
# HANDLE INF / NAN
# ==============================

X = X.replace([float("inf"), float("-inf")], pd.NA)

imputer = SimpleImputer(strategy="median")

X = imputer.fit_transform(X)


# ==============================
# TRAIN / TEST SPLIT
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==============================
# FEATURE SCALING
# ==============================

scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)


# ==============================
# RANDOM FOREST
# ==============================

print("\nTraining Random Forest...")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

model.fit(X_train, y_train)


# ==============================
# EVALUATION
# ==============================

print("\nEvaluating model...")

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\n==============================")
print("CIC-IDS2017 MODEL RESULTS")
print("==============================")

print("Accuracy:", accuracy)

print("\nClassification Report:")
print(classification_report(y_test, y_pred))


# ==============================
# SAVE MODEL
# ==============================

model_path = os.path.join(MODEL_DIR, "cic_model.pkl")
scaler_path = os.path.join(MODEL_DIR, "cic_scaler.pkl")
imputer_path = os.path.join(MODEL_DIR, "cic_imputer.pkl")
features_path = os.path.join(MODEL_DIR, "cic_features.pkl")

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)
joblib.dump(imputer, imputer_path)
joblib.dump(feature_names, features_path)


print("\n==============================")
print("FILES SAVED")
print("==============================")

print(model_path)
print(scaler_path)
print(imputer_path)
print(features_path)

print("\nCIC model training complete!")