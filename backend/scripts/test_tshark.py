import asyncio

async def test_tshark():
    tshark_path = r"C:\Program Files\Wireshark\tshark.exe"
    args = [
        "-i", "Ethernet",
        "-T", "fields",
        "-e", "ip.src", "-e", "ipv6.src",
        "-e", "ip.dst", "-e", "ipv6.dst",
        "-e", "_ws.col.Protocol",
        "-e", "tcp.srcport", "-e", "udp.srcport",
        "-e", "tcp.dstport", "-e", "udp.dstport",
        "-e", "frame.len",
        "-l"
    ]
    
    print("Starting tshark...")
    try:
        process = await asyncio.create_subprocess_exec(
            tshark_path, *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        print("Tshark started!")
        for _ in range(5):
            line = await process.stdout.readline()
            if not line:
                print("No output from tshark")
                break
            print(f"Output: {line.decode('utf-8').strip()}")
            
        process.terminate()
        
    except Exception as e:
        print(f"Failed to start: {e}")

if __name__ == "__main__":
    asyncio.run(test_tshark())
