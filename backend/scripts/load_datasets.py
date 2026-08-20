import os
import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB Configuration
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "netshield_logs"
COLLECTION_NAME = "network_traffic"

# Dataset Path
DATASET_DIR = r"E:\NetShield\MachineLearningCVE"

async def load_csv_to_mongo(file_path: str, collection):
    print(f"Loading {file_path}...")
    try:
        # Read CSV in chunks for memory efficiency
        chunksize = 10000
        for chunk in pd.read_csv(file_path, chunksize=chunksize):
            # Clean column names (strip whitespace)
            chunk.columns = chunk.columns.str.strip()
            
            # Convert DataFrame to list of dicts
            records = chunk.to_dict("records")
            
            # Insert into MongoDB
            if records:
                await collection.insert_many(records)
                print(f"Inserted {len(records)} records from chunk.")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    
    if not os.path.exists(DATASET_DIR):
        print(f"Dataset directory not found: {DATASET_DIR}")
        return

    csv_files = [f for f in os.listdir(DATASET_DIR) if f.endswith('.csv')]
    
    if not csv_files:
        print("No CSV files found in the directory.")
        return
        
    print(f"Found {len(csv_files)} CSV files to process.")
    
    for file in csv_files:
        file_path = os.path.join(DATASET_DIR, file)
        await load_csv_to_mongo(file_path, collection)
        
    print("Dataset loading complete!")

if __name__ == "__main__":
    asyncio.run(main())
