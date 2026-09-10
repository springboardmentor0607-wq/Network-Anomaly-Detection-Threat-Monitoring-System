"""
TrafficService — Business logic for network traffic flow management.
Supports CSV dataset ingestion (CICIDS2017, UNSW-NB15), paginated querying,
stats aggregation, and synthetic traffic simulation for demo purposes.
"""
import io
import uuid
import math
import random
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import UploadFile, HTTPException, status
from app.models.traffic import TrafficFlow
from app.models.anomaly import Anomaly
from app.models.prediction import Prediction
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.ml.inference.anomaly_detector import AnomalyDetector
from app.ml.inference.attack_classifier import AttackClassifier
from app.ml.pipeline import RiskScoringEngine
from app.ml.datasets.cicids2017_adapter import CICIDS2017Adapter
from app.ml.datasets.unsw_nb15_adapter import UNSWNB15Adapter
from app.schemas.traffic import TrafficFlowListResponse, TrafficFlowResponse, TrafficStatsResponse, DatasetUploadResponse

# Pre-initialized ML models (loaded once)
_anomaly_detector = None
_attack_classifier = None
_risk_engine = RiskScoringEngine()

def _get_anomaly_detector() -> AnomalyDetector:
    global _anomaly_detector
    if _anomaly_detector is None:
        _anomaly_detector = AnomalyDetector(dataset_name="cicids2017")
    return _anomaly_detector

def _get_attack_classifier() -> AttackClassifier:
    global _attack_classifier
    if _attack_classifier is None:
        _attack_classifier = AttackClassifier(dataset_name="cicids2017")
    return _attack_classifier


# Demo IPs and protocols for simulation
DEMO_SOURCE_IPS = [
    "192.168.1.10", "192.168.1.25", "10.0.0.5", "172.16.0.8",
    "203.0.113.24", "198.51.100.88", "185.220.101.5", "94.102.49.190"
]
DEMO_DEST_IPS = [
    "192.168.1.100", "192.168.1.200", "8.8.8.8", "8.8.4.4", "1.1.1.1",
    "192.168.1.1", "10.0.0.1", "172.16.0.1"
]
DEMO_PROTOCOLS = ["TCP", "UDP", "ICMP", "DNS", "HTTP", "HTTPS", "SSH"]


class TrafficService:

    @staticmethod
    def simulate_traffic_flows(db: Session, count: int = 20) -> Dict[str, Any]:
        """
        Generate synthetic network traffic flows, run them through the AI pipeline
        (anomaly detection + attack classification + risk scoring), and persist to DB.
        Creates alerts for anomalous traffic automatically.
        """
        detector = _get_anomaly_detector()
        classifier = _get_attack_classifier()

        generated_flows = 0
        anomalies_found = 0
        alerts_created = 0

        for _ in range(count):
            # Generate a random synthetic flow
            proto = random.choice(DEMO_PROTOCOLS)
            src_ip = random.choice(DEMO_SOURCE_IPS)
            dst_ip = random.choice(DEMO_DEST_IPS)
            dst_port = random.choice([22, 53, 80, 443, 8080, 8443, 3306, 5432, 21])
            packets = random.randint(1, 5000)
            bytes_val = packets * random.randint(64, 1500)
            duration = random.uniform(0.001, 300.0)
            ts = datetime.utcnow() - timedelta(seconds=random.randint(0, 3600))

            flow = TrafficFlow(
                id=str(uuid.uuid4()),
                timestamp=ts,
                source_ip=src_ip,
                destination_ip=dst_ip,
                source_port=random.randint(1024, 65535),
                destination_port=dst_port,
                protocol=proto,
                packets=packets,
                bytes=bytes_val,
                duration=duration,
                dataset_source="SIMULATION"
            )
            db.add(flow)
            db.flush()  # Get the ID without committing

            # Build DataFrame for ML pipeline
            flow_df = pd.DataFrame({
                "packets": [packets],
                "bytes": [bytes_val],
                "duration": [duration],
                "destination_port": [dst_port],
                "Protocol": [proto],
            })

            # Run anomaly detection
            anomaly_score, is_anomaly, features = detector.predict_flow(flow_df)

            anomaly = Anomaly(
                id=str(uuid.uuid4()),
                flow_id=flow.id,
                anomaly_score=anomaly_score,
                is_anomaly=is_anomaly,
                model_name="Isolation Forest",
                model_version="1.0.0",
                contributing_features=features,
            )
            db.add(anomaly)

            if is_anomaly:
                anomalies_found += 1

                # Run attack classification
                attack_class, confidence, class_probs = classifier.predict_attack(flow_df)

                pred = Prediction(
                    id=str(uuid.uuid4()),
                    flow_id=flow.id,
                    predicted_class=attack_class,
                    confidence=confidence,
                    model_name="RandomForest Attack Classifier",
                    model_version="1.0.0",
                )
                db.add(pred)

                # Compute risk score
                risk_details = _risk_engine.compute_risk_score(
                    attack_type=attack_class,
                    anomaly_confidence=anomaly_score,
                    protocol=proto,
                )
                risk_score = risk_details["score"]
                risk_band = risk_details["band"]

                # Determine alert severity
                if risk_score >= 80 or risk_band == "CRITICAL":
                    sev = AlertSeverity.CRITICAL
                elif risk_score >= 60 or risk_band == "HIGH":
                    sev = AlertSeverity.HIGH
                elif risk_score >= 40:
                    sev = AlertSeverity.MEDIUM
                else:
                    sev = AlertSeverity.LOW

                alert_id = f"ALT-{str(uuid.uuid4())[:8].upper()}"
                alert = Alert(
                    id=str(uuid.uuid4()),
                    alert_id=alert_id,
                    title=f"{attack_class} detected from {src_ip}",
                    alert_type=attack_class,
                    severity=sev,
                    status=AlertStatus.NEW,
                    risk_score=risk_score,
                    flow_id=flow.id,
                    notes=f"Anomaly score: {anomaly_score:.3f} | Confidence: {confidence:.3f}"
                )
                db.add(alert)
                alerts_created += 1

            generated_flows += 1

        db.commit()

        return {
            "generated_flows": generated_flows,
            "anomalies_detected": anomalies_found,
            "alerts_created": alerts_created,
            "message": f"Simulated {generated_flows} traffic flows. {anomalies_found} anomalies detected, {alerts_created} alerts created."
        }

    @staticmethod
    def process_csv_upload(
        db: Session,
        file: UploadFile,
        dataset_type: str = "CICIDS2017"
    ) -> DatasetUploadResponse:
        filename = file.filename or "uploaded_dataset.csv"
        if not filename.endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV dataset files are supported"
            )

        content = file.file.read()
        try:
            df = pd.read_csv(io.BytesIO(content), nrows=5000)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse CSV file: {str(e)}"
            )

        if dataset_type.upper() == "CICIDS2017":
            adapter = CICIDS2017Adapter()
        elif dataset_type.upper() in ["UNSW-NB15", "UNSW_NB15"]:
            adapter = UNSWNB15Adapter()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported dataset adapter type: {dataset_type}"
            )

        if not adapter.validate_schema(list(df.columns)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV schema invalid for adapter '{adapter.get_dataset_name()}'"
            )

        normalized_flows = adapter.process_dataframe(df)

        db_flows = []
        anomalies_count = 0
        for norm in normalized_flows:
            if norm.is_anomalous:
                anomalies_count += 1

            db_flow = TrafficFlow(
                id=str(uuid.uuid4()),
                timestamp=norm.timestamp,
                source_ip=norm.source_ip,
                destination_ip=norm.destination_ip,
                source_port=norm.source_port,
                destination_port=norm.destination_port,
                protocol=norm.protocol,
                packets=norm.packets,
                bytes=norm.bytes,
                duration=norm.duration,
                dataset_source=adapter.get_dataset_name(),
                metadata_json=norm.raw_features
            )
            db_flows.append(db_flow)

        db.bulk_save_objects(db_flows)
        db.commit()

        return DatasetUploadResponse(
            success=True,
            filename=filename,
            dataset_name=adapter.get_dataset_name(),
            total_rows_processed=len(normalized_flows),
            anomalies_detected=anomalies_count,
            message=f"Successfully ingested {len(normalized_flows)} flow records via {adapter.get_dataset_name()} adapter."
        )

    @staticmethod
    def get_paginated_flows(
        db: Session,
        page: int = 1,
        page_size: int = 10,
        protocol: Optional[str] = None,
        search: Optional[str] = None
    ) -> TrafficFlowListResponse:
        query = db.query(TrafficFlow)

        if protocol and protocol.upper() != "ALL":
            query = query.filter(TrafficFlow.protocol == protocol.upper())

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (TrafficFlow.source_ip.like(search_pattern)) |
                (TrafficFlow.destination_ip.like(search_pattern))
            )

        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        offset = (page - 1) * page_size
        items = query.order_by(desc(TrafficFlow.timestamp)).offset(offset).limit(page_size).all()

        return TrafficFlowListResponse(
            items=[TrafficFlowResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    @staticmethod
    def get_traffic_stats(db: Session) -> TrafficStatsResponse:
        total_flows = db.query(TrafficFlow).count()
        total_pkts = db.query(func.sum(TrafficFlow.packets)).scalar() or 0
        total_bytes = db.query(func.sum(TrafficFlow.bytes)).scalar() or 0
        avg_dur = db.query(func.avg(TrafficFlow.duration)).scalar() or 0.0

        proto_counts = db.query(TrafficFlow.protocol, func.count(TrafficFlow.id)).group_by(TrafficFlow.protocol).all()
        proto_dist = {proto: count for proto, count in proto_counts}

        top_srcs = db.query(TrafficFlow.source_ip, func.count(TrafficFlow.id).label("count"))\
            .group_by(TrafficFlow.source_ip).order_by(desc("count")).limit(5).all()
        top_sources_list = [{"ip": ip, "count": count} for ip, count in top_srcs]

        top_dsts = db.query(TrafficFlow.destination_ip, func.count(TrafficFlow.id).label("count"))\
            .group_by(TrafficFlow.destination_ip).order_by(desc("count")).limit(5).all()
        top_dest_list = [{"ip": ip, "count": count} for ip, count in top_dsts]

        return TrafficStatsResponse(
            total_flows=total_flows,
            total_packets=int(total_pkts),
            total_bytes=int(total_bytes),
            avg_duration=float(avg_dur),
            protocol_distribution=proto_dist,
            top_sources=top_sources_list,
            top_destinations=top_dest_list
        )
