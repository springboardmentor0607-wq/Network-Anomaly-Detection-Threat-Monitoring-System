from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import pandas as pd
import asyncio
import os
import math
import joblib
import json
from mongodb import log_packet_to_db 

router = APIRouter()

# --- 1. LOAD AI MODELS FOR THE LIVE STREAM ---
print("Initializing Live Stream AI Engine...")
try:
    rf_model = joblib.load("rf_model_optimized.joblib")
    encoder = joblib.load("label_encoder.joblib")
    print("Stream Engine Ready: AI models loaded successfully.")
except Exception as e:
    print(f"Warning: Stream AI Models failed to load. Error: {e}")
    rf_model = None
    encoder = None


# Map query parameter keys to their respective file paths
DATASETS = {
    "cicids2017": os.path.join("..", "ml", "data", "processed", "cicids2017_clean.csv"),
    "unsw_nb15": os.path.join("..", "ml", "data", "processed", "unsw_nb15_clean.csv")
}

def clean_packet_data(row_dict):
    """Utility to clean NaN/Infinity values before sending to JSON/Mongo"""
    clean_dict = {}
    for k, v in row_dict.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            clean_dict[k] = 0.0
        else:
            clean_dict[k] = v
    return clean_dict

async def tail_zeek_log(filepath):
    """Asynchronously tails the live Zeek log file generated on macOS."""
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
    
    # --- 2. LIVE MAC NETWORK STREAM (ZEEK) ---
    if dataset == "live_network":
        zeek_log_path = "conn.log"
        
        if not os.path.exists(zeek_log_path):
            await websocket.send_json({"error": "Zeek conn.log not found. Please start Zeek in the terminal."})
            await websocket.close()
            return
            
        try:
            async for line in tail_zeek_log(zeek_log_path):
                try:
                    flow_data = json.loads(line)
                    
                    # Extract network features from Zeek JSON
                    duration = flow_data.get("duration", 0.0)
                    orig_bytes = flow_data.get("orig_bytes", 0)
                    resp_bytes = flow_data.get("resp_bytes", 0)
                    dest_port = flow_data.get("id.resp_p", 0)
                    protocol = flow_data.get("proto", "unknown")
                    
                    # Pad to 78 features to match the Random Forest model expectations
                    features = [float(dest_port), float(duration), float(orig_bytes), float(resp_bytes)]
                    features += [0.0] * (78 - len(features))
                    
                    if rf_model is not None and encoder is not None:
                        input_df = pd.DataFrame([features])
                        prediction_code = rf_model.predict(input_df)
                        threat_label = encoder.inverse_transform(prediction_code)[0]
                    else:
                        threat_label = "MODEL_OFFLINE"
                        
                    is_anomaly = threat_label not in ["BENIGN", "MODEL_OFFLINE"]
                    
                    # Format payload for the React table UI
                    packet_data = {
                        "active_dataset": "live_network",
                        "Source IP": flow_data.get("id.orig_h", "0.0.0.0"),
                        "Destination IP": flow_data.get("id.resp_h", "0.0.0.0"),
                        "Destination Port": dest_port,
                        "Protocol": str(protocol).upper(),
                        "Flow Duration": duration,
                        "Fwd Bytes": orig_bytes,
                        "Bwd Bytes": resp_bytes,
                        "ai_classification": threat_label,
                        "is_anomaly": is_anomaly
                    }
                    
                    log_packet_to_db(packet_data)
                    await websocket.send_json(packet_data)
                    
                    # Pace the UI updates
                    await asyncio.sleep(0.2)
                    
                except json.JSONDecodeError:
                    continue  # Skip incomplete lines while Zeek is actively writing
                    
        except WebSocketDisconnect:
            print("Client disconnected from LIVE traffic stream")
        except Exception as e:
            print(f"Live stream error: {e}")
        return # Exit the websocket function so it doesn't trigger CSV logic

    # --- 3. CSV DATASET STREAM (EXISTING LOGIC) ---
    csv_path = DATASETS.get(dataset, DATASETS["cicids2017"])
    
    if not os.path.exists(csv_path):
        await websocket.send_json({"error": f"Dataset {dataset} not found on server"})
        await websocket.close()
        return

    try:
        df = pd.read_csv(csv_path) 
        
        while True: # Loop continuously so the stream keeps running
            for index, row in df.head(500).iterrows():
                raw_packet = row.to_dict()
                
                # Tag the packet data with the active dataset name for frontend tracking
                raw_packet["active_dataset"] = dataset
                
                packet_data = clean_packet_data(raw_packet)
                
                if rf_model is not None and encoder is not None:
                    try:
                        predict_row = row.copy()
                        if 'Label' in predict_row:
                            predict_row = predict_row.drop('Label')
                            
                        input_df = pd.DataFrame([predict_row])
                        prediction_code = rf_model.predict(input_df)
                        threat_label = encoder.inverse_transform(prediction_code)[0]
                        
                        packet_data["ai_classification"] = threat_label
                        packet_data["is_anomaly"] = threat_label != "BENIGN"
                    except Exception as e:
                        print(f"Live AI Prediction Error on packet {index}: {e}")
                        packet_data["ai_classification"] = "ERROR"
                        packet_data["is_anomaly"] = False
                else:
                    packet_data["ai_classification"] = "MODEL_OFFLINE"
                    packet_data["is_anomaly"] = False
                
                log_packet_to_db(packet_data)
                await websocket.send_json(packet_data)
                await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        print("Client disconnected from traffic stream")
    except Exception as e:
        print(f"Error streaming data: {e}")