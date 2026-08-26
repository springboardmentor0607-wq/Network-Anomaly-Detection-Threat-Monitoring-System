import pandas as pd
from pathlib import Path

# Find the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent

# UNSW-NB15 dataset paths
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

FEATURES_PATH = (
    BASE_DIR
    / "datasets"
    / "UNSW-NB15"
    / "NUSW-NB15_features.csv"
)


# Load datasets
print("Loading UNSW-NB15 training dataset...")
train_df = pd.read_csv(TRAIN_PATH)

print("Loading UNSW-NB15 testing dataset...")
test_df = pd.read_csv(TEST_PATH)

print("Loading UNSW-NB15 features...")
features_df = pd.read_csv(FEATURES_PATH,encoding="cp1252")


# Display information
print("\n===== UNSW-NB15 DATASET =====")

print("\nTraining dataset:")
print("Rows:", len(train_df))
print("Columns:", len(train_df.columns))

print("\nTesting dataset:")
print("Rows:", len(test_df))
print("Columns:", len(test_df.columns))

print("\nFeatures file:")
print("Rows:", len(features_df))
print("Columns:", len(features_df.columns))


# Show column names
print("\nTraining columns:")
print(train_df.columns.tolist())

print("\nTesting columns:")
print(test_df.columns.tolist())

print("\nFirst 5 training records:")
print(train_df.head())

# ==========================================
# CIC-IDS2017 DATASET
# ==========================================

CIC_DIR = (
    BASE_DIR
    / "datasets"
    / "CIC-IDS2017"
)

# CIC-IDS2017 files
CIC_FILES = [
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
]

# Load each CIC-IDS2017 file
cic_dataframes = []

for file_name in CIC_FILES:
    file_path = CIC_DIR / file_name

    print(f"\nLoading {file_name}...")

    df = pd.read_csv(
        file_path,
        encoding="cp1252",
        low_memory=False
    )

    # Remove spaces from column names
    df.columns = df.columns.str.strip()

    cic_dataframes.append(df)

# Combine all CIC-IDS2017 files
cic_df = pd.concat(
    cic_dataframes,
    ignore_index=True
)

print("\n===== CIC-IDS2017 DATASET =====")

print("Total rows:", len(cic_df))
print("Total columns:", len(cic_df.columns))

print("\nCIC-IDS2017 columns:")
print(cic_df.columns.tolist())

print("\nAttack/traffic labels:")
print(cic_df["Label"].value_counts())

print("\nFirst 5 records:")
print(cic_df.head())