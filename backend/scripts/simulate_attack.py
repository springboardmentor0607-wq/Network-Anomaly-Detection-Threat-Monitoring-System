import socket
import time
import threading

def attack():
    target_ip = "127.0.0.1"
    for port in range(1, 1000):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.01)
            s.connect((target_ip, port))
            s.close()
        except:
            pass

print("Initiating simulated Port Scan against localhost to trigger NetShield AI...")
threads = []
for _ in range(50):
    t = threading.Thread(target=attack)
    t.start()
    threads.append(t)

for t in threads:
    t.join()
print("Simulated attack finished.")
