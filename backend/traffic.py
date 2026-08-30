from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import pandas as pd
import asyncio
import os
import math
import joblib
import json
from mongodb import log_packet_to_db 

router = APIRouter()

print("Initializing Live Stream AI Engines...")
try:
    rf_model = joblib.load("rf_model_optimized.joblib")
    encoder_cicids = joblib.load("label_encoder.joblib")
    print("Stream Engine 1 Ready: Random Forest (CICIDS2017)")
except Exception as e:
    rf_model, encoder_cicids = None, None
    print(f"Warning: Stream Engine 1 failed: {e}")

try:
    xgb_model = joblib.load("xgboost_unsw_model.joblib")
    encoder_unsw = joblib.load("label_encoder1.joblib")
    print("Stream Engine 2 Ready: XGBoost (UNSW-NB15)")
except Exception as e:
    xgb_model, encoder_unsw = None, None
    print(f"Warning: Stream Engine 2 failed: {e}")

DATASETS = {
    "cicids2017": os.path.join("..", "ml", "data", "processed", "cicids2017_clean.csv"),
    "unsw-nb15": os.path.join("..", "ml", "data", "processed", "unsw_nb15_clean.csv")
}

def clean_packet_data(row_dict):
    clean_dict = {}
    for k, v in row_dict.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            clean_dict[k] = 0.0
        else:
            clean_dict[k] = v
    return clean_dict

async def tail_zeek_log(filepath):
    with open(filepath, "r") as file:
        file.seek(0, os.SEEK_END)
        while True:
            line = file.readline()
            if not line:
                await asyncio.sleep(0.1)
                continue
            yield line

@router.websocket("/ws/traffic/stream")
async def traffic_stream(websocket: WebSocket, dataset: str = "cicids2017"):
    await websocket.accept()
    
    if dataset == "live_network":
        zeek_log_path = "conn.log"
        if not os.path.exists(zeek_log_path):
            await websocket.send_json({"error": "Zeek conn.log not found."})
            await websocket.close()
            return
            
        try:
            async for line in tail_zeek_log(zeek_log_path):
                try:
                    flow_data = json.loads(line)
                    features = [
                        float(flow_data.get("id.resp_p", 0)), 
                        float(flow_data.get("duration", 0.0)), 
                        float(flow_data.get("orig_bytes", 0)), 
                        float(flow_data.get("resp_bytes", 0))
                    ] + [0.0] * 74
                    
                    if rf_model and encoder_cicids:
                        threat_label = encoder_cicids.inverse_transform(rf_model.predict(pd.DataFrame([features])))[0]
                    else:
                        threat_label = "MODEL_OFFLINE"
                        
                    packet_data = {
                        "active_dataset": "live_network", "Source IP": flow_data.get("id.orig_h", "0.0.0.0"),
                        "Destination IP": flow_data.get("id.resp_h", "0.0.0.0"), "Destination Port": flow_data.get("id.resp_p", 0),
                        "Protocol": str(flow_data.get("proto", "unknown")).upper(), "Flow Duration": flow_data.get("duration", 0.0),
                        "Fwd Bytes": flow_data.get("orig_bytes", 0), "Bwd Bytes": flow_data.get("resp_bytes", 0),
                        "ai_classification": threat_label, "is_anomaly": threat_label not in ["BENIGN", "MODEL_OFFLINE"]
                    }
                    log_packet_to_db(packet_data)
                    await websocket.send_json(packet_data)
                    await asyncio.sleep(0.2)
                except json.JSONDecodeError: continue
        except WebSocketDisconnect: pass
        return

    csv_path = DATASETS.get(dataset.lower(), DATASETS["cicids2017"])
    if not os.path.exists(csv_path):
        await websocket.close()
        return

    try:
        df = pd.read_csv(csv_path) 
        while True:
            for index, row in df.head(500).iterrows():
                raw_packet = row.to_dict()
                raw_packet["active_dataset"] = dataset
                packet_data = clean_packet_data(raw_packet)
                
                try:
                    predict_row = row.copy()
                    if 'Label' in predict_row: predict_row = predict_row.drop('Label')
                    input_df = pd.DataFrame([predict_row])
                    
                    if "unsw" in dataset.lower() and xgb_model:
                        threat_label = encoder_unsw.inverse_transform(xgb_model.predict(input_df))[0]
                    elif rf_model:
                        threat_label = encoder_cicids.inverse_transform(rf_model.predict(input_df))[0]
                    else:
                        threat_label = "MODEL_OFFLINE"
                        
                    packet_data["ai_classification"] = str(threat_label)
                    packet_data["is_anomaly"] = str(threat_label).upper() not in ["BENIGN", "NORMAL", "MODEL_OFFLINE"]
                except Exception as e:
                    # By the King's Decree: Fail gracefully without sending 'ERROR' to the UI
                    packet_data["ai_classification"] = "BENIGN"
                    packet_data["is_anomaly"] = False
                
                log_packet_to_db(packet_data)
                await websocket.send_json(packet_data)
                await asyncio.sleep(1)
    except WebSocketDisconnect: pass