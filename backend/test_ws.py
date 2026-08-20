import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('ws://localhost:8000/api/live/ws') as websocket:
            print("Connected")
            while True:
                try:
                    message = await websocket.recv()
                    print(f"Received: {message}")
                except websockets.ConnectionClosed as e:
                    print(f"Closed: {e}")
                    break
    except Exception as e:
        print(f"Failed to connect: {e}")

asyncio.run(test())
