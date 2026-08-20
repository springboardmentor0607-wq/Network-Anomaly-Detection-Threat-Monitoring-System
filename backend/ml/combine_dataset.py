import pandas as pd
import os

folder = "datasets/CICIDS2017"

files = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv"
]

dataframes = []

for file in files:
    path = os.path.join(folder, file)
    print("Loading:", file)

    df = pd.read_csv(path)
    dataframes.append(df)


combined_df = pd.concat(dataframes, ignore_index=True)

print("\nCombined Dataset")
print("Rows:", combined_df.shape[0])
print("Columns:", combined_df.shape[1])

print("\nLabels:")
print(combined_df[" Label"].value_counts())


combined_df.to_csv(
    "datasets/CICIDS2017/combined_CICIDS2017.csv",
    index=False
)

print("\nSaved successfully!")