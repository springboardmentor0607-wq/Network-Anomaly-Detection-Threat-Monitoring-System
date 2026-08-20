from pathlib import Path
import pandas as pd
import requests


# ============================================================
# DATASET PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "UNSW-NB15"
    / "UNSW_NB15_training-set.parquet"
)


# ============================================================
# LOAD DATASET
# ============================================================

df = pd.read_parquet(
    DATASET_PATH
)

df.columns = df.columns.str.strip()


# ============================================================
# SELECT A REAL ATTACK
# ============================================================

attack_sample = df[
    df["label"] == 1
].iloc[0]


# ============================================================
# PREPARE API DATA
# ============================================================

data = {

    "source_ip": "172.16.0.10",

    "destination_ip": "10.10.0.20",

    "proto":
        str(attack_sample["proto"]),

    "service":
        str(attack_sample["service"]),

    "state":
        str(attack_sample["state"]),

    "dur":
        float(attack_sample["dur"]),

    "spkts":
        float(attack_sample["spkts"]),

    "dpkts":
        float(attack_sample["dpkts"]),

    "sbytes":
        float(attack_sample["sbytes"]),

    "dbytes":
        float(attack_sample["dbytes"]),

    "rate":
        float(attack_sample["rate"]),

    "sload":
        float(attack_sample["sload"]),

    "dload":
        float(attack_sample["dload"]),

    "sloss":
        float(attack_sample["sloss"]),

    "dloss":
        float(attack_sample["dloss"]),

    "sinpkt":
        float(attack_sample["sinpkt"]),

    "dinpkt":
        float(attack_sample["dinpkt"]),

    "sjit":
        float(attack_sample["sjit"]),

    "djit":
        float(attack_sample["djit"]),

    "swin":
        float(attack_sample["swin"]),

    "stcpb":
        float(attack_sample["stcpb"]),

    "dtcpb":
        float(attack_sample["dtcpb"]),

    "dwin":
        float(attack_sample["dwin"]),

    "tcprtt":
        float(attack_sample["tcprtt"]),

    "synack":
        float(attack_sample["synack"]),

    "ackdat":
        float(attack_sample["ackdat"]),

    "smean":
        float(attack_sample["smean"]),

    "dmean":
        float(attack_sample["dmean"]),

    "trans_depth":
        float(attack_sample["trans_depth"]),

    "response_body_len":
        float(
            attack_sample["response_body_len"]
        ),

    "ct_src_dport_ltm":
        float(
            attack_sample["ct_src_dport_ltm"]
        ),

    "ct_dst_sport_ltm":
        float(
            attack_sample["ct_dst_sport_ltm"]
        ),

    "is_ftp_login":
        float(
            attack_sample["is_ftp_login"]
        ),

    "ct_ftp_cmd":
        float(
            attack_sample["ct_ftp_cmd"]
        ),

    "ct_flw_http_mthd":
        float(
            attack_sample["ct_flw_http_mthd"]
        ),

    "is_sm_ips_ports":
        float(
            attack_sample["is_sm_ips_ports"]
        )
}


# ============================================================
# SEND TO API
# ============================================================

print(
    "Actual UNSW-NB15 attack category:"
)

print(
    attack_sample["attack_cat"]
)

print(
    "\nSending to /predict/unsw..."
)


response = requests.post(
    "http://127.0.0.1:8000/predict/unsw",
    json=data
)


print(
    "\nPrediction Result:"
)

print(
    response.text
)