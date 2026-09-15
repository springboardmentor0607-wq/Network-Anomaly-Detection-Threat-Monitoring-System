import io
import math
import pandas as pd
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import UploadFile, HTTPException, status
from app.models.traffic import TrafficFlow
from app.ml.datasets.cicids2017_adapter import CICIDS2017Adapter
from app.ml.datasets.unsw_nb15_adapter import UNSWNB15Adapter
from app.schemas.traffic import TrafficFlowListResponse, TrafficFlowResponse, TrafficStatsResponse, DatasetUploadResponse

class TrafficService:
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
            df = pd.read_csv(io.BytesIO(content), nrows=5000) # Safeguard row limit for dev API uploads
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse CSV file: {str(e)}"
            )

        # Select Adapter
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

        # Protocol distribution
        proto_counts = db.query(TrafficFlow.protocol, func.count(TrafficFlow.id)).group_by(TrafficFlow.protocol).all()
        proto_dist = {proto: count for proto, count in proto_counts}

        # Top source IPs
        top_srcs = db.query(TrafficFlow.source_ip, func.count(TrafficFlow.id).label("count"))\
            .group_by(TrafficFlow.source_ip).order_by(desc("count")).limit(5).all()
        top_sources_list = [{"ip": ip, "count": count} for ip, count in top_srcs]

        # Top dest IPs
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
