import pandas as pd

file_path = "datasets/CICIDS2017/Monday-WorkingHours.pcap_ISCX.csv"

df = pd.read_csv(file_path)

print("Label Distribution:")
print(df[" Label"].value_counts())