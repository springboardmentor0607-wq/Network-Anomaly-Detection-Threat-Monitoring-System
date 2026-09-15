import pandas as pd
from typing import Dict, Any, List
from datetime import datetime
from app.ml.datasets.base_adapter import BaseDatasetAdapter, NormalizedFlow

class UNSWNB15Adapter(BaseDatasetAdapter):
    REQUIRED_COLUMNS = ["dur", "proto", "sbytes", "dbytes", "label"]

    def get_dataset_name(self) -> str:
        return "UNSW-NB15"

    def validate_schema(self, columns: List[str]) -> bool:
        clean_cols = [c.strip() for c in columns]
        for req in self.REQUIRED_COLUMNS:
            if req not in clean_cols:
                return False
        return True

    def normalize_row(self, row: Dict[str, Any]) -> NormalizedFlow:
        clean_row = {str(k).strip(): v for k, v in row.items()}

        src_ip = str(clean_row.get("srcip", clean_row.get("src_ip", "192.168.1.50")))
        dst_ip = str(clean_row.get("dstip", clean_row.get("dst_ip", "10.0.0.2")))
        src_port = int(clean_row.get("sport", clean_row.get("src_port", 49152)))
        dst_port = int(clean_row.get("dsport", clean_row.get("dst_port", 80)))

        proto = str(clean_row.get("proto", "tcp")).upper()
        protocol = "TCP" if "TCP" in proto else "UDP" if "UDP" in proto else "ICMP" if "ICMP" in proto else "OTHER"

        spkts = int(clean_row.get("spkts", 1))
        dpkts = int(clean_row.get("dpkts", 0))
        total_packets = spkts + dpkts

        sbytes = int(clean_row.get("sbytes", 0))
        dbytes = int(clean_row.get("dbytes", 0))
        total_bytes = sbytes + dbytes

        duration_sec = float(clean_row.get("dur", 0.0))

        label_num = int(clean_row.get("label", 0))
        attack_cat = str(clean_row.get("attack_cat", "Normal" if label_num == 0 else "Generic")).strip()
        is_anomalous = (label_num == 1) or (attack_cat.lower() != "normal")

        return NormalizedFlow(
            timestamp=datetime.utcnow(),
            source_ip=src_ip,
            destination_ip=dst_ip,
            source_port=src_port,
            destination_port=dst_port,
            protocol=protocol,
            packets=total_packets,
            bytes=total_bytes,
            duration=duration_sec,
            attack_category=attack_cat,
            is_anomalous=is_anomalous,
            raw_features=clean_row
        )

    def process_dataframe(self, df: pd.DataFrame) -> List[NormalizedFlow]:
        normalized_list = []
        for _, row in df.iterrows():
            normalized_list.append(self.normalize_row(row.to_dict()))
        return normalized_list
