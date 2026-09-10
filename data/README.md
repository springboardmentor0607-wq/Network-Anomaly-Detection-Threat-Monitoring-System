# NetShield AI Dataset Storage Architecture

This directory houses raw, interim, processed, and sample datasets strictly using **CIC-IDS-2017** and **UNSW-NB15**.

---

## Directory Hierarchy

```
data/
├── raw/
│   ├── cicids2017/       # Original extracted CSV files from CIC-IDS-2017 archive
│   └── unsw_nb15/        # Original extracted CSV files from UNSW-NB15 archive
│
├── interim/
│   ├── cicids2017/       # Intermediate cleaned dataset files
│   └── unsw_nb15/        # Intermediate cleaned dataset files
│
├── processed/
│   ├── cicids2017/       # Fully encoded, scaled ML-ready training datasets
│   └── unsw_nb15/        # Fully encoded, scaled ML-ready training datasets
│
└── samples/
    ├── cicids2017/       # Lightweight (~5,000 row) CSV samples for testing & UI seed
    └── unsw_nb15/        # Lightweight (~5,000 row) CSV samples for testing & UI seed
```

---

## Instructions

1. **CIC-IDS-2017:** Place extracted CSV files (e.g., `Monday-WorkingHours.pcap_ISCX.csv`, `Tuesday-WorkingHours.pcap_ISCX.csv`, etc.) under `data/raw/cicids2017/`.
2. **UNSW-NB15:** Place extracted CSV files (e.g., `UNSW-NB15_1.csv`, `UNSW-NB15_LIST_EVENTS.csv`, etc.) under `data/raw/unsw_nb15/`.
3. Do **NOT** commit raw or processed datasets to Git. Large data files are ignored via `.gitignore`.
