import os
import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "netshield_logs"
COLLECTION_NAME = "network_traffic"

CICIDS_DIR = r"E:\NetShield\MachineLearningCVE"
UNSW_DIR = r"E:\NetShield\CSV Files"

async def load_cicids(file_path: str, collection):
    print(f"Loading CICIDS2017: {file_path}...")
    try:
        chunksize = 20000
        total = 0
        for chunk in pd.read_csv(file_path, chunksize=chunksize, low_memory=False):
            chunk.columns = chunk.columns.str.strip()
            
            normalized = pd.DataFrame()
            normalized['Source IP'] = '192.168.' + (chunk.index % 255).astype(str) + '.' + ((chunk.index // 255) % 255).astype(str)
            normalized['Destination IP'] = '10.0.0.' + (chunk.index % 10).astype(str)
            normalized['Source Port'] = chunk.get('Source Port', 0)
            normalized['Destination Port'] = chunk.get('Destination Port', 0)
            
            # Safe protocol mapping
            if 'Protocol' in chunk:
                normalized['Protocol'] = chunk['Protocol'].apply(lambda x: 'TCP' if x==6 else ('UDP' if x==17 else 'Other'))
            else:
                normalized['Protocol'] = 'TCP'
                
            normalized['Flow Duration'] = chunk.get('Flow Duration', 0)
            normalized['Total Packets'] = chunk.get('Total Fwd Packets', 0) + chunk.get('Total Backward Packets', 0)
            normalized['Total Bytes'] = chunk.get('Total Length of Fwd Packets', 0) + chunk.get('Total Length of Bwd Packets', 0)
            normalized['Label'] = chunk.get('Label', 'BENIGN')
            normalized['Dataset'] = 'CICIDS2017'
            normalized['Timestamp'] = datetime.datetime.now(datetime.UTC).isoformat()

            records = normalized.to_dict("records")
            if records:
                await collection.insert_many(records)
                total += len(records)
            
            if total >= 40000:
                print(f"Loaded {total} records (capped for speed).")
                break
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

async def load_unsw(file_path: str, collection):
    print(f"Loading UNSW-NB15: {file_path}...")
    try:
        chunksize = 20000
        total = 0
        for chunk in pd.read_csv(file_path, chunksize=chunksize, low_memory=False, header=None):
            if len(chunk.columns) < 48:
                continue
                
            normalized = pd.DataFrame()
            normalized['Source IP'] = chunk[0].astype(str)
            normalized['Destination IP'] = chunk[2].astype(str)
            normalized['Source Port'] = chunk[1]
            normalized['Destination Port'] = chunk[3]
            normalized['Protocol'] = chunk[4].astype(str).str.upper()
            normalized['Flow Duration'] = chunk[5]
            normalized['Total Packets'] = chunk[16] + chunk[17]
            normalized['Total Bytes'] = chunk[7] + chunk[8]
            
            attack_cat = chunk[47].fillna('Normal')
            attack_cat = attack_cat.replace(r'^\s*$', 'Normal', regex=True)
            normalized['Label'] = attack_cat
            normalized['Dataset'] = 'UNSW-NB15'
            normalized['Timestamp'] = datetime.datetime.now(datetime.UTC).isoformat()

            records = normalized.to_dict("records")
            if records:
                await collection.insert_many(records)
                total += len(records)
                
            if total >= 40000:
                print(f"Loaded {total} records (capped for speed).")
                break
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    
    print("Clearing existing collection...")
    await collection.delete_many({})
    
    await collection.create_index("Label")
    await collection.create_index("Dataset")
    await collection.create_index("Destination Port")
    
    if os.path.exists(CICIDS_DIR):
        files = [f for f in os.listdir(CICIDS_DIR) if f.endswith('.csv')]
        for f in files[:2]:
            await load_cicids(os.path.join(CICIDS_DIR, f), collection)
            
    if os.path.exists(UNSW_DIR):
        files = [f for f in os.listdir(UNSW_DIR) if f.startswith('UNSW-NB15_') and f.endswith('.csv')]
        for f in files[:2]:
            await load_unsw(os.path.join(UNSW_DIR, f), collection)
            
    print("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(main())
