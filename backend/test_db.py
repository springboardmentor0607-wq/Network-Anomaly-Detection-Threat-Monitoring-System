import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['netshield_logs']
    col = db['network_traffic']
    doc = await col.find_one({})
    print("One document:", doc)
    
    pipeline = [
        {"$group": {"_id": "$Destination Port", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    cursor = col.aggregate(pipeline)
    print("Aggregate:")
    async for d in cursor:
        print(d)

asyncio.run(run())
