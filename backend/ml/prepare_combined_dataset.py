import pandas as pd

# Load datasets

cicids = pd.read_csv(
    "datasets/CICIDS2017/cleaned_CICIDS2017.csv"
)

unsw = pd.read_csv(
    "datasets/UNSW-NB15/cleaned_UNSW_NB15.csv"
)

# Remove extra spaces in column names

cicids.columns = cicids.columns.str.strip()
unsw.columns = unsw.columns.str.strip()


# CICIDS2017 mapping

cicids_selected = pd.DataFrame()

cicids_selected["duration"] = cicids["Flow Duration"]
cicids_selected["src_packets"] = cicids["Total Fwd Packets"]
cicids_selected["dst_packets"] = cicids["Total Backward Packets"]
cicids_selected["src_bytes"] = cicids["Total Length of Fwd Packets"]
cicids_selected["dst_bytes"] = cicids["Total Length of Bwd Packets"]
cicids_selected["protocol"] = cicids["Destination Port"]
cicids_selected["label"] = cicids["Label"]


# UNSW-NB15 mapping

unsw_selected = pd.DataFrame()

unsw_selected["duration"] = unsw["dur"]
unsw_selected["src_packets"] = unsw["spkts"]
unsw_selected["dst_packets"] = unsw["dpkts"]
unsw_selected["src_bytes"] = unsw["sbytes"]
unsw_selected["dst_bytes"] = unsw["dbytes"]
unsw_selected["protocol"] = unsw["proto"]
unsw_selected["label"] = unsw["label"]


# Convert CICIDS labels

cicids_selected["label"] = (
    cicids_selected["label"] != "BENIGN"
).astype(int)


# Combine

combined = pd.concat(
    [cicids_selected, unsw_selected],
    ignore_index=True
)


print("Final Shape:", combined.shape)

combined.to_csv(
    "datasets/combined_intrusion_dataset.csv",
    index=False
)

print("Combined dataset created successfully!")