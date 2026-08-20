import asyncio

async def run():
    try:
        tshark_path = r"C:\Program Files\Wireshark\tshark.exe"
        args = ["-i", "Ethernet", "-c", "2"]
        process = await asyncio.create_subprocess_exec(
            tshark_path, *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        print("STDOUT:", stdout.decode())
        print("STDERR:", stderr.decode())
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(run())
