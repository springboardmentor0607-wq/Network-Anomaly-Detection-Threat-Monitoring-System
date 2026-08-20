import os
import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB Configuration
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "netshield_logs"
COLLECTION_NAME = "unsw_nb15_traffic"

# Dataset Path
DATASET_DIR = r"E:\NetShield\CSV Files"

COLUMNS = [
    "srcip", "sport", "dstip", "dsport", "proto", "state", "dur", "sbytes", "dbytes",
    "sttl", "dttl", "sloss", "dloss", "service", "Sload", "Dload", "Spkts", "Dpkts",
    "swin", "dwin", "stcpb", "dtcpb", "smeansz", "dmeansz", "trans_depth", "res_bdy_len",
    "Sjit", "Djit", "Stime", "Ltime", "Sintpkt", "Dintpkt", "tcprtt", "synack", "ackdat",
    "is_sm_ips_ports", "ct_state_ttl", "ct_flw_http_mthd", "is_ftp_login", "ct_ftp_cmd",
    "ct_srv_src", "ct_srv_dst", "ct_dst_ltm", "ct_src_ltm", "ct_src_dport_ltm",
    "ct_dst_sport_ltm", "ct_dst_src_ltm", "attack_cat", "Label"
]

import csv

async def load_csv_to_mongo(file_path: str, collection):
    print(f"Loading {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            batch = []
            batch_size = 10000
            total_inserted = 0
            
            for row in reader:
                # Some rows might be malformed, skip them if they don't match columns length
                if len(row) < len(COLUMNS):
                    # Pad with None
                    row.extend([None] * (len(COLUMNS) - len(row)))
                elif len(row) > len(COLUMNS):
                    row = row[:len(COLUMNS)]
                
                record = dict(zip(COLUMNS, row))
                batch.append(record)
                
                if len(batch) >= batch_size:
                    await collection.insert_many(batch)
                    total_inserted += len(batch)
                    print(f"Inserted {total_inserted} records from {os.path.basename(file_path)}...")
                    batch = []
                    
            if batch:
                await collection.insert_many(batch)
                total_inserted += len(batch)
                print(f"Inserted {total_inserted} records from {os.path.basename(file_path)} (Completed).")
                
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    
    if not os.path.exists(DATASET_DIR):
        print(f"Dataset directory not found: {DATASET_DIR}")
        return

    csv_files = [f for f in os.listdir(DATASET_DIR) if f.startswith('UNSW-NB15_') and f.endswith('.csv') and 'LIST_EVENTS' not in f]
    
    if not csv_files:
        print("No target CSV files found in the directory.")
        return
        
    print(f"Found {len(csv_files)} CSV files to process.")
    
    for file in csv_files:
        file_path = os.path.join(DATASET_DIR, file)
        await load_csv_to_mongo(file_path, collection)
        
    print("UNSW-NB15 dataset loading complete!")

if __name__ == "__main__":
    asyncio.run(main())
