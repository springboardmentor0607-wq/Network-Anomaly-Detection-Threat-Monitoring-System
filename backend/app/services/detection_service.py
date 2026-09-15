import math
import pandas as pd
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.traffic import TrafficFlow
from app.models.anomaly import Anomaly
from app.ml.inference.anomaly_detector import AnomalyDetector
from app.schemas.anomaly import AnomalyResponse, AnomalyListResponse

class DetectionService:
    @staticmethod
    def evaluate_unprocessed_flows(db: Session) -> int:
        detector = AnomalyDetector(dataset_name="cicids2017")
        flows = db.query(TrafficFlow).filter(~TrafficFlow.anomalies.any()).all()

        anomaly_objs = []
        for flow in flows:
            flow_dict = {
                "Destination Port": [flow.destination_port],
                "Flow Duration": [flow.duration * 1000000.0],
                "Total Fwd Packets": [flow.packets],
                "Total Backward Packets": [0],
                "Total Length of Fwd Packets": [flow.bytes],
                "Total Length of Bwd Packets": [0],
                "Protocol": [flow.protocol],
                "packets": [flow.packets],
                "bytes": [flow.bytes]
            }
            df_flow = pd.DataFrame(flow_dict)
            score, is_anom, contrib = detector.predict_flow(df_flow)

            anomaly = Anomaly(
                flow_id=flow.id,
                anomaly_score=score,
                is_anomaly=is_anom,
                model_name="Isolation Forest Anomaly Baseline",
                model_version="1.0.0",
                contributing_features=contrib
            )
            anomaly_objs.append(anomaly)

        if anomaly_objs:
            db.bulk_save_objects(anomaly_objs)
            db.commit()

        return len(anomaly_objs)

    @staticmethod
    def get_paginated_anomalies(
        db: Session,
        page: int = 1,
        page_size: int = 10,
        min_score: Optional[float] = None
    ) -> AnomalyListResponse:
        # Trigger detection on any new unprocessed flows
        DetectionService.evaluate_unprocessed_flows(db)

        query = db.query(Anomaly).join(TrafficFlow)
        if min_score is not None:
            query = query.filter(Anomaly.anomaly_score >= min_score)

        total = query.count()
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        total_anomalies_count = db.query(Anomaly).filter(Anomaly.is_anomaly == True).count()
        avg_score = db.query(func.avg(Anomaly.anomaly_score)).scalar() or 0.0

        offset = (page - 1) * page_size
        items = query.order_by(desc(Anomaly.anomaly_score)).offset(offset).limit(page_size).all()

        return AnomalyListResponse(
            items=[AnomalyResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            total_anomalies_count=total_anomalies_count,
            avg_anomaly_score=round(float(avg_score), 4)
        )
