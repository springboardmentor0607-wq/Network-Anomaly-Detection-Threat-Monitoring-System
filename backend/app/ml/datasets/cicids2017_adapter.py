import pandas as pd
from typing import Dict, Any, List
from datetime import datetime
from app.ml.datasets.base_adapter import BaseDatasetAdapter, NormalizedFlow

class CICIDS2017Adapter(BaseDatasetAdapter):
    REQUIRED_COLUMNS = [
        "Destination Port", "Flow Duration", "Total Fwd Packets",
        "Total Backward Packets", "Label"
    ]

    def get_dataset_name(self) -> str:
        return "CICIDS2017"

    def validate_schema(self, columns: List[str]) -> bool:
        clean_cols = [c.strip() for c in columns]
        for req in self.REQUIRED_COLUMNS:
            if req not in clean_cols:
                return False
        return True

    def normalize_row(self, row: Dict[str, Any]) -> NormalizedFlow:
        # Strip trailing/leading spaces from dict keys
        clean_row = {str(k).strip(): v for k, v in row.items()}

        src_ip = str(clean_row.get("Source IP", "192.168.1.100"))
        dst_ip = str(clean_row.get("Destination IP", "10.0.0.1"))
        src_port = int(clean_row.get("Source Port", 8080))
        dst_port = int(clean_row.get("Destination Port", 80))

        protocol_code = int(clean_row.get("Protocol", 6))
        protocol = "TCP" if protocol_code == 6 else "UDP" if protocol_code == 17 else "ICMP" if protocol_code == 1 else "OTHER"

        fwd_pkts = int(clean_row.get("Total Fwd Packets", 1))
        bwd_pkts = int(clean_row.get("Total Backward Packets", 0))
        total_packets = fwd_pkts + bwd_pkts

        fwd_bytes = int(clean_row.get("Total Length of Fwd Packets", 0))
        bwd_bytes = int(clean_row.get("Total Length of Bwd Packets", 0))
        total_bytes = fwd_bytes + bwd_bytes

        duration_micro = float(clean_row.get("Flow Duration", 0))
        duration_sec = duration_micro / 1000000.0

        label = str(clean_row.get("Label", "BENIGN")).strip()
        is_anomalous = label.upper() != "BENIGN"

        raw_timestamp = clean_row.get("Timestamp", None)
        parsed_ts = datetime.utcnow()
        if raw_timestamp:
            try:
                parsed_ts = pd.to_datetime(raw_timestamp).to_pydatetime()
            except Exception:
                pass

        return NormalizedFlow(
            timestamp=parsed_ts,
            source_ip=src_ip,
            destination_ip=dst_ip,
            source_port=src_port,
            destination_port=dst_port,
            protocol=protocol,
            packets=total_packets,
            bytes=total_bytes,
            duration=duration_sec,
            attack_category=label,
            is_anomalous=is_anomalous,
            raw_features=clean_row
        )

    def process_dataframe(self, df: pd.DataFrame) -> List[NormalizedFlow]:
        normalized_list = []
        for _, row in df.iterrows():
            normalized_list.append(self.normalize_row(row.to_dict()))
        return normalized_list
