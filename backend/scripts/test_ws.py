import asyncio
import websockets

async def test_ws():
    uri = "ws://127.0.0.1:8000/api/live/ws"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as ws:
            print("Connected! Waiting for packets...")
            for i in range(3):
                msg = await ws.recv()
                print(f"Received: {msg[:100]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
