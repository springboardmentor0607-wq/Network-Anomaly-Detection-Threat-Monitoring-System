import os
import glob
import pandas as pd

def inspect_folder(folder_path: str, dataset_name: str):
    print(f"\n==========================================")
    print(f" INSPECTING {dataset_name} ({folder_path})")
    print(f"==========================================")
    csv_files = glob.glob(os.path.join(folder_path, "**/*.csv"), recursive=True)
    if not csv_files:
        print(f"No CSV files found in {folder_path}")
        return

    print(f"Found {len(csv_files)} CSV files.")
    for csv_file in csv_files[:3]:  # Inspect first 3 files
        print(f"\n--- File: {os.path.basename(csv_file)} ---")
        try:
            df = pd.read_csv(csv_file, nrows=100)
            print(f"Rows: {len(df)}, Columns: {len(df.columns)}")
            print("Columns:", list(df.columns[:10]))
            print("Missing Values Total:", df.isnull().sum().sum())
        except Exception as e:
            print(f"Error reading {csv_file}: {e}")

if __name__ == "__main__":
    inspect_folder("data/samples/cicids2017", "CIC-IDS-2017 Sample")
    inspect_folder("data/samples/unsw_nb15", "UNSW-NB15 Sample")
