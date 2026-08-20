from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import pandas as pd
import random
import numpy as np


router = APIRouter()


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

CICIDS_PATH = (
    BASE_DIR
    / "datasets"
    / "CICIDS2017"
    / "cleaned_CICIDS2017.csv"
)

UNSW_PATH = (
    BASE_DIR
    / "datasets"
    / "UNSW-NB15"
    / "UNSW_NB15_training-set.parquet"
)


# ============================================================
# LOAD DATASETS ONCE
# ============================================================

print("Loading CICIDS2017 dataset...")

try:

    CICIDS_DF = pd.read_csv(
        CICIDS_PATH,
        low_memory=False
    )

    CICIDS_DF.columns = CICIDS_DF.columns.str.strip()

    CICIDS_DF = CICIDS_DF.replace(
        [np.inf, -np.inf],
        np.nan
    ).dropna()

    print(
        "CICIDS2017 loaded:",
        CICIDS_DF.shape
    )

except Exception as e:

    CICIDS_DF = None

    print(
        "CICIDS2017 loading error:",
        e
    )


print("Loading UNSW-NB15 dataset...")

try:

    UNSW_DF = pd.read_parquet(
        UNSW_PATH
    )

    UNSW_DF.columns = UNSW_DF.columns.str.strip()

    UNSW_DF = UNSW_DF.replace(
        [np.inf, -np.inf],
        np.nan
    ).dropna()

    print(
        "UNSW-NB15 loaded:",
        UNSW_DF.shape
    )

except Exception as e:

    UNSW_DF = None

    print(
        "UNSW-NB15 loading error:",
        e
    )


# ============================================================
# CICIDS2017 TRAFFIC
# ============================================================

def get_cicids_traffic():

    if CICIDS_DF is None:

        raise HTTPException(
            status_code=500,
            detail="CICIDS2017 dataset is not loaded"
        )

    sample = CICIDS_DF.sample(
        n=1
    ).iloc[0]

    return {

        "dataset": "CICIDS2017",

        "source":
            f"192.168.1.{random.randint(2, 200)}",

        "destination":
            f"10.0.0.{random.randint(2, 200)}",

        "protocol":
            "TCP",

        "destination_port":
            int(sample["Destination Port"]),

        "duration":
            float(sample["Flow Duration"]),

        "src_packets":
            float(sample["Total Fwd Packets"]),

        "dst_packets":
            float(sample["Total Backward Packets"]),

        "src_bytes":
            float(sample["Total Length of Fwd Packets"]),

        "dst_bytes":
            float(sample["Total Length of Bwd Packets"]),

        "flow_bytes_per_sec":
            float(sample["Flow Bytes/s"]),

        "flow_packets_per_sec":
            float(sample["Flow Packets/s"]),

        "actual_label":
            str(sample["Label"])
    }


# ============================================================
# UNSW-NB15 TRAFFIC
# ============================================================

def get_unsw_traffic():

    if UNSW_DF is None:

        raise HTTPException(
            status_code=500,
            detail="UNSW-NB15 dataset is not loaded"
        )

    sample = UNSW_DF.sample(
        n=1
    ).iloc[0]

    return {

        "dataset": "UNSW-NB15",

        "source":
            f"172.16.0.{random.randint(2, 200)}",

        "destination":
            f"10.10.0.{random.randint(2, 200)}",

        "proto":
            str(sample["proto"]),

        "service":
            str(sample["service"]),

        "state":
            str(sample["state"]),

        "dur":
            float(sample["dur"]),

        "spkts":
            float(sample["spkts"]),

        "dpkts":
            float(sample["dpkts"]),

        "sbytes":
            float(sample["sbytes"]),

        "dbytes":
            float(sample["dbytes"]),

        "rate":
            float(sample["rate"]),

        "sload":
            float(sample["sload"]),

        "dload":
            float(sample["dload"]),

        "sloss":
            float(sample["sloss"]),

        "dloss":
            float(sample["dloss"]),

        "sinpkt":
            float(sample["sinpkt"]),

        "dinpkt":
            float(sample["dinpkt"]),

        "sjit":
            float(sample["sjit"]),

        "djit":
            float(sample["djit"]),

        "swin":
            float(sample["swin"]),

        "stcpb":
            float(sample["stcpb"]),

        "dtcpb":
            float(sample["dtcpb"]),

        "dwin":
            float(sample["dwin"]),

        "tcprtt":
            float(sample["tcprtt"]),

        "synack":
            float(sample["synack"]),

        "ackdat":
            float(sample["ackdat"]),

        "smean":
            float(sample["smean"]),

        "dmean":
            float(sample["dmean"]),

        "trans_depth":
            float(sample["trans_depth"]),

        "response_body_len":
            float(sample["response_body_len"]),

        "ct_src_dport_ltm":
            float(sample["ct_src_dport_ltm"]),

        "ct_dst_sport_ltm":
            float(sample["ct_dst_sport_ltm"]),

        "is_ftp_login":
            float(sample["is_ftp_login"]),

        "ct_ftp_cmd":
            float(sample["ct_ftp_cmd"]),

        "ct_flw_http_mthd":
            float(sample["ct_flw_http_mthd"]),

        "is_sm_ips_ports":
            float(sample["is_sm_ips_ports"]),

        "actual_label":
            int(sample["label"]),

        "actual_attack_category":
            str(sample["attack_cat"])
    }


# ============================================================
# TRAFFIC API
# ============================================================

@router.get("/traffic")
def get_traffic(
    dataset: str = Query(
        "CICIDS2017"
    )
):

    dataset = dataset.strip()

    if dataset == "CICIDS2017":

        return get_cicids_traffic()

    elif dataset == "UNSW-NB15":

        return get_unsw_traffic()

    else:

        raise HTTPException(
            status_code=400,
            detail=(
                "Dataset must be "
                "CICIDS2017 or UNSW-NB15"
            )
        )