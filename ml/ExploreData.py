import pandas as pd
import os

# --- CICIDS2017 ---
cicids_dir = "data/raw/CICIDS2017/MachineLearningCVE"
cicids_files = [f for f in os.listdir(cicids_dir) if f.endswith(".csv")]

print("=== CICIDS2017 ===")
print(f"Number of files: {len(cicids_files)}")

# Load just the first file to inspect structure
sample_path = os.path.join(cicids_dir, cicids_files[0])
df_cic = pd.read_csv(sample_path)
print(f"Sample file: {cicids_files[0]}")
print(f"Shape: {df_cic.shape}")
print(f"Columns: {list(df_cic.columns)[:10]} ... ({len(df_cic.columns)} total)")
print(df_cic.iloc[:, -1].value_counts())  # last column is usually the Label

print("\n=== UNSW-NB15 ===")
unsw_dir = "data/raw/UNSW-NB15/Training and Testing Sets"
df_unsw = pd.read_csv(os.path.join(unsw_dir, "UNSW_NB15_training-set.csv"))
print(f"Shape: {df_unsw.shape}")
print(f"Columns: {list(df_unsw.columns)}")
print(df_unsw['label'].value_counts())