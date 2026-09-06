# NetShield AI Dataset Specifications

This directory contains datasets and sample files for **NetShield AI: Network Anomaly Detection & Threat Monitoring System**.

## Supported Datasets

1. **CICIDS2017 Dataset**
   - Features: Flow Duration, Total Fwd Packets, Total Length of Fwd Packets, Flow Bytes/s, Flow Packets/s, etc.
   - Attack Classes: BENIGN, DDoS, FTP-Patator, SSH-Patator, PortScan, Bot, etc.

2. **UNSW-NB15 Dataset**
   - Features: Network flow metrics (srcip, dstip, proto, dur, sbytes, dbytes, etc.)
   - Attack Classes: Normal, Fuzzers, Analysis, Backdoors, DoS, Exploits, Generic, Reconnaissance, Shellcode, Worms.

3. **Development Test Data (`sample_network_traffic.csv`)**
   - File: `dataset/sample_network_traffic.csv`
   - Generated using `python dataset/generate_sample_dataset.py`.
   - Contains 500 preprocessed synthetic network records with 79 features and ground-truth labels (`BENIGN`, `DDoS`, `FTP-Patator`, `SSH-Patator`).
