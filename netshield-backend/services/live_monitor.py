import os
import sys
import time
import shutil
import socket
import threading
import traceback
import platform
import subprocess
from datetime import datetime
from collections import deque

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.predict import predict_attack
from models.alert_service import create_security_alert
from models.incident_service import create_incident_from_alert
from models.notification_service import create_notification_from_alert_incident

PSUTIL_AVAILABLE = False
try:
    import psutil
    PSUTIL_AVAILABLE = True
except Exception as psutil_err:
    print(f"[LIVE MONITOR] Psutil import warning: {psutil_err}")

THREAT_SEVERITY_ORDER = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}

class LiveNetworkMonitor:
    def __init__(self):
        self._lock = threading.RLock()
        self.is_running = False
        self.start_time = None
        self.selected_interface = "default"
        self._capture_thread = None
        self._tshark_process = None
        self._stop_event = threading.Event()

        # Real Traffic Metrics
        self.packet_count = 0
        self.total_flows = 0
        self.normal_flows = 0
        self.anomalous_flows = 0
        self.threat_count = 0
        self.highest_threat_level = "Low"

        # Latest Flow Details
        self.latest_prediction = "N/A"
        self.latest_src_ip = "N/A"
        self.latest_dst_ip = "N/A"
        self.latest_protocol = "N/A"
        self.latest_attack_type = "N/A"
        self.latest_confidence = "0.00%"
        self.latest_threat_level = "Low"
        self.latest_risk_score = 0

        # Ring buffer for recent flow records (max 200)
        self.recent_flows = deque(maxlen=200)

        # Active flow aggregator: 5-tuple key -> flow data dict
        self._active_flows = {}

        # Alert cooldown map: (source_ip, attack_type, dest_ip) -> timestamp
        self.alert_cooldowns = {}
        self.cooldown_seconds = 60.0

        # Last error message & permission flags
        self.last_error = None
        self.requires_npcap = False

    def find_tshark(self):
        """
        Automatically detects TShark executable across Windows and Linux environments.
        Checks TSHARK_PATH env var, PATH via shutil.which, and common installation directories.
        """
        env_path = os.environ.get("TSHARK_PATH")
        if env_path and os.path.isfile(env_path):
            return env_path
        
        which_tshark = shutil.which("tshark") or shutil.which("tshark.exe")
        if which_tshark and os.path.isfile(which_tshark):
            return which_tshark

        is_win = platform.system() == "Windows"
        candidates = [
            r"C:\Program Files\Wireshark\tshark.exe",
            r"C:\Program Files (x86)\Wireshark\tshark.exe",
        ] if is_win else [
            "/usr/bin/tshark",
            "/usr/local/bin/tshark",
            "/usr/sbin/tshark",
            "/bin/tshark"
        ]

        for cand in candidates:
            if os.path.isfile(cand):
                return cand
                
        return None

    def resolve_tshark_interface(self, tshark_path, requested_iface):
        """
        Queries `tshark -D` to map host network interface name/IP (e.g. 'Wi-Fi (10.10.3.93)', 'Wi-Fi', 'eth0')
        to TShark interface index or device name.
        """
        if not tshark_path:
            return "1"

        req_str = str(requested_iface or "").strip().lower()
        req_ip = ""
        if "(" in req_str and ")" in req_str:
            req_ip = req_str.split("(")[1].split(")")[0].strip()
        clean_req = req_str.split("(")[0].strip()

        try:
            res = subprocess.run([tshark_path, "-D"], capture_output=True, text=True, timeout=10)
            if res.returncode == 0 and res.stdout:
                lines = res.stdout.strip().splitlines()

                # 1. Match by IP address or specific label
                for line in lines:
                    line_lower = line.lower()
                    idx = line.split(".")[0].strip()

                    if req_ip and req_ip in line_lower:
                        print(f"[LIVE MONITOR] Matched interface by IP '{req_ip}': '{line}' -> Index {idx}")
                        return idx
                    if clean_req and clean_req in line_lower and clean_req not in ["default", "none", ""]:
                        print(f"[LIVE MONITOR] Matched interface by name '{clean_req}': '{line}' -> Index {idx}")
                        return idx

                # 2. Match any active Wi-Fi / Ethernet / eth0 / ens interface
                for line in lines:
                    line_lower = line.lower()
                    if any(k in line_lower for k in ["wi-fi", "wlan", "ethernet", "eth0", "ens"]):
                        idx = line.split(".")[0].strip()
                        print(f"[LIVE MONITOR] Detected active interface: '{line}' -> Index {idx}")
                        return idx

                if lines:
                    idx = lines[0].split(".")[0].strip()
                    print(f"[LIVE MONITOR] Defaulting to first interface: '{lines[0]}' -> Index {idx}")
                    return idx
        except Exception as e:
            print(f"[LIVE MONITOR] Warning resolving interface via tshark -D: {e}")
        
        return "1"

    def check_capture_capability(self):
        """
        Checks if TShark executable is available for real packet capture.
        Returns (is_capable, error_message, requires_npcap).
        """
        tshark_bin = self.find_tshark()
        if not tshark_bin:
            return False, (
                "TShark executable not found. Please install Wireshark/TShark "
                "or ensure tshark is available in PATH."
            ), True
        return True, f"TShark available at {tshark_bin}", False

    def get_available_interfaces(self):
        """
        Cross-platform network interface detection.
        Detects active Wi-Fi/Ethernet on Windows and eth0/ens5/etc. on Linux/AWS.
        Filters out disconnected, APIPA (169.254.x.x), loopback (127.x.x.x), and virtual filter adapters.
        """
        candidate_interfaces = []
        is_windows = platform.system() == "Windows"

        if PSUTIL_AVAILABLE:
            try:
                addrs = psutil.net_if_addrs()
                stats = psutil.net_if_stats()

                for iface_name, addr_list in addrs.items():
                    ip = ""
                    for addr in addr_list:
                        if addr.family == socket.AF_INET:
                            ip = addr.address
                            break

                    is_up = stats[iface_name].isup if iface_name in stats else True

                    # Filter out APIPA (169.254.x.x), Loopback (127.x.x.x), or missing IP
                    if not ip or ip.startswith("127.") or ip.startswith("169.254."):
                        continue

                    # Filter out virtual / tunnel adapters
                    skip_keywords = ["virtualbox", "vfp", "lightweight", "miniport", "kernel debug", "teredo", "6to4", "npf_"]
                    if any(k in iface_name.lower() for k in skip_keywords):
                        continue

                    label = f"{iface_name} ({ip})"
                    candidate_interfaces.append({
                        "id": iface_name,
                        "name": label,
                        "ip": ip,
                        "is_up": is_up,
                        "is_active": True,
                        "priority": 1 if ("wi-fi" in iface_name.lower() or "ethernet" in iface_name.lower() or "eth" in iface_name.lower() or "ens" in iface_name.lower() or "wlan" in iface_name.lower()) else 2
                    })
            except Exception as e:
                print(f"[LIVE MONITOR] Error enumerating psutil interfaces: {e}")

        # Fallback if psutil missed active interface
        if not candidate_interfaces:
            try:
                host_ip = socket.gethostbyname(socket.gethostname())
                if host_ip and not host_ip.startswith("127.") and not host_ip.startswith("169.254."):
                    label = f"Default Active ({host_ip})"
                    candidate_interfaces.append({
                        "id": "default",
                        "name": label,
                        "ip": host_ip,
                        "is_up": True,
                        "is_active": True,
                        "priority": 1
                    })
            except Exception as e:
                print(f"[LIVE MONITOR] Error resolving default host IP: {e}")

        candidate_interfaces.sort(key=lambda x: (x.get("priority", 2), x.get("name", "")))

        output_list = []
        for c in candidate_interfaces:
            output_list.append({
                "id": c["id"],
                "name": c["name"],
                "ip": c["ip"],
                "is_up": c["is_up"],
                "is_active": c["is_active"]
            })

        if not output_list:
            output_list = [{
                "id": "none",
                "name": "No active network interface available.",
                "ip": "",
                "is_up": False,
                "is_active": False
            }]

        return output_list

    def validate_interface(self, interface):
        """
        Validates requested interface string.
        Returns validated interface description string (e.g. Wi-Fi (10.10.3.93)).
        """
        available = self.get_available_interfaces()
        valid_ifaces = [iface for iface in available if iface.get("id") != "none" and iface.get("is_active")]

        if not valid_ifaces:
            print("[LIVE MONITOR] Warning: No active interface detected, defaulting to Wi-Fi")
            return interface or "Wi-Fi"

        req_str = str(interface or "").strip()
        req_lower = req_str.lower()

        if req_str and req_lower not in ["none", "default", "undefined", "null", ""]:
            for iface in valid_ifaces:
                iface_id = iface["id"]
                iface_name = iface["name"]
                iface_ip = iface["ip"]

                if (req_str == iface_id or 
                    req_str == iface_name or 
                    req_lower in iface_name.lower() or 
                    (iface_ip and iface_ip in req_str)):
                    print(f"[LIVE MONITOR] Interface validation success: '{req_str}' -> '{iface_name}'")
                    return iface_name if "(" in iface_name else f"{iface_id} ({iface_ip})"

        best_iface = valid_ifaces[0]
        selected_label = best_iface["name"] if "(" in best_iface["name"] else f"{best_iface['id']} ({best_iface['ip']})"
        print(f"[LIVE MONITOR] Interface validation fallback: Selected '{selected_label}'")
        return selected_label

    def start_worker(self, interface=None):
        """
        Starts TShark packet capture background worker thread non-blockingly.
        Returns HTTP response immediately.
        """
        with self._lock:
            target_iface = self.validate_interface(interface)

            if self.is_running and self.selected_interface == target_iface and self._capture_thread and self._capture_thread.is_alive():
                return True, f"Monitoring worker is active on {target_iface}", self.get_status()

            if self.is_running:
                self._stop_event.set()
                self._kill_tshark_process()
                self.is_running = False

            self.is_running = True
            self.start_time = time.time()
            self.selected_interface = target_iface
            self._stop_event.clear()
            self.last_error = None
            self.requires_npcap = False

            # Reset KPI metrics for new capture session
            self.packet_count = 0
            self.total_flows = 0
            self.normal_flows = 0
            self.anomalous_flows = 0
            self.threat_count = 0
            self.highest_threat_level = "Low"
            self._active_flows.clear()

            print("[LIVE MONITOR] Starting TShark capture background worker thread...")
            self._capture_thread = threading.Thread(
                target=self._monitoring_loop,
                name="NetShieldTSharkCaptureThread",
                daemon=True
            )
            self._capture_thread.start()

            status = self.get_status()

        return True, f"Live network monitoring started on {self.selected_interface}", status

    def start(self, interface=None):
        """Alias for start_worker for backwards compatibility."""
        return self.start_worker(interface=interface)

    def _kill_tshark_process(self):
        """Safely terminates background TShark process and closes file descriptors."""
        if self._tshark_process:
            try:
                if self._tshark_process.poll() is None:
                    self._tshark_process.terminate()
                    try:
                        self._tshark_process.wait(timeout=2.0)
                    except subprocess.TimeoutExpired:
                        self._tshark_process.kill()
                        self._tshark_process.wait(timeout=1.0)
                if self._tshark_process.stdout:
                    try: self._tshark_process.stdout.close()
                    except Exception: pass
                if self._tshark_process.stderr:
                    try: self._tshark_process.stderr.close()
                    except Exception: pass
            except Exception as e:
                print(f"[LIVE MONITOR] TShark process cleanup notice: {e}")
            finally:
                self._tshark_process = None

    def stop(self):
        """Cleanly stops TShark packet capture thread and process."""
        with self._lock:
            if not self.is_running:
                return True, "Monitoring is already stopped.", self.get_status()

            self._stop_event.set()
            self.is_running = False
            print("[LIVE MONITOR] Stopping TShark packet capture worker thread...")

        self._kill_tshark_process()

        if self._capture_thread and self._capture_thread.is_alive():
            self._capture_thread.join(timeout=3.0)

        return True, "Live network monitoring stopped successfully.", self.get_status()

    def get_status(self):
        """Returns current status and aggregate metrics."""
        with self._lock:
            uptime_secs = int(time.time() - self.start_time) if self.start_time and self.is_running else 0
            return {
                "is_running": self.is_running,
                "running": self.is_running,
                "interface": self.selected_interface,
                "uptime_seconds": uptime_secs,
                "packet_count": self.packet_count,
                "total_flows": self.total_flows,
                "normal_flows": self.normal_flows,
                "anomalous_flows": self.anomalous_flows,
                "threat_count": self.threat_count,
                "highest_threat_level": self.highest_threat_level,
                "latest_prediction": self.latest_prediction,
                "latest_src_ip": self.latest_src_ip,
                "latest_dst_ip": self.latest_dst_ip,
                "protocol": self.latest_protocol,
                "latest_attack_type": self.latest_attack_type,
                "confidence": self.latest_confidence,
                "latest_threat_level": self.latest_threat_level,
                "latest_risk_score": self.latest_risk_score,
                "last_error": self.last_error,
                "error": self.last_error,
                "requires_npcap": self.requires_npcap,
                "active_buffer_size": len(self.recent_flows)
            }

    def get_flows(self, limit=50):
        """Returns latest processed real flow records from ring buffer."""
        with self._lock:
            flows_list = list(self.recent_flows)
            flows_list.reverse()
            return {
                "status": self.get_status(),
                "flows": flows_list[:limit]
            }

    def _monitoring_loop(self):
        """Main background loop streaming TShark stdout line-by-line and aggregating flows."""
        print("[LIVE MONITOR WORKER] Worker thread entered")
        tshark_bin = self.find_tshark()
        if not tshark_bin:
            print("[LIVE MONITOR WORKER] TShark executable NOT found!")
            with self._lock:
                self.is_running = False
                self.last_error = "TShark executable not found."
                self.requires_npcap = True
            return

        tshark_iface_arg = self.resolve_tshark_interface(tshark_bin, self.selected_interface)
        print(f"[LIVE MONITOR WORKER] Launching TShark ({tshark_bin}) on interface '{tshark_iface_arg}'")

        cmd = [
            tshark_bin,
            "-i", tshark_iface_arg,
            "-l",
            "-n",
            "-T", "fields",
            "-e", "frame.time_epoch",
            "-e", "frame.len",
            "-e", "ip.src",
            "-e", "ip.dst",
            "-e", "ip.ttl",
            "-e", "ip.proto",
            "-e", "tcp.srcport",
            "-e", "tcp.dstport",
            "-e", "tcp.flags",
            "-e", "tcp.window_size",
            "-e", "tcp.seq",
            "-e", "udp.srcport",
            "-e", "udp.dstport",
            "-e", "icmp.type"
        ]

        kwargs = {}
        if platform.system() == "Windows":
            kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                **kwargs
            )
            self._tshark_process = proc

            time.sleep(0.3)
            if proc.poll() is not None:
                err_msg = proc.stderr.read().strip() if proc.stderr else "Unknown startup error"
                print(f"[LIVE MONITOR WORKER] TShark process failed early: {err_msg}")
                with self._lock:
                    self.is_running = False
                    self.last_error = f"TShark capture error: {err_msg}"
                return

            print("[LIVE MONITOR WORKER] TShark real packet capture loop active")

            for line in iter(proc.stdout.readline, ""):
                if self._stop_event.is_set():
                    break
                if not line:
                    continue
                self._handle_tshark_packet_line(line)

        except Exception as err:
            print(f"[LIVE MONITOR WORKER] Exception in worker thread: {err}")
            traceback.print_exc()
            with self._lock:
                self.last_error = str(err)
        finally:
            self._kill_tshark_process()
            self._flush_active_flows()
            with self._lock:
                self.is_running = False
            print("[LIVE MONITOR WORKER] Worker thread exited cleanly")

    def _handle_tshark_packet_line(self, line):
        """Parses a single line of tab-separated TShark packet fields and updates flow aggregation."""
        try:
            parts = line.strip().split("\t")
            if len(parts) < 6:
                return

            # 0: frame.time_epoch
            try:
                timestamp = float(parts[0]) if parts[0] else time.time()
            except ValueError:
                timestamp = time.time()

            # 1: frame.len
            try:
                frame_len = int(parts[1]) if parts[1] else 64
            except ValueError:
                frame_len = 64

            # 2: ip.src, 3: ip.dst
            src_ip = parts[2].strip() if len(parts) > 2 else ""
            dst_ip = parts[3].strip() if len(parts) > 3 else ""

            if not src_ip or not dst_ip:
                return

            with self._lock:
                self.packet_count += 1

            # 4: ip.ttl
            try:
                sttl = int(parts[4]) if len(parts) > 4 and parts[4].strip() else 64
            except ValueError:
                sttl = 64

            # 5: ip.proto
            try:
                proto_num = int(parts[5]) if len(parts) > 5 and parts[5].strip() else 6
            except ValueError:
                proto_num = 6

            if proto_num == 6: proto_str = "tcp"
            elif proto_num == 17: proto_str = "udp"
            elif proto_num == 1: proto_str = "icmp"
            else: proto_str = "tcp"

            sport, dport = 0, 0
            swin, stcpb = 255, 0
            state = "CON"

            if proto_str == "tcp":
                try: sport = int(parts[6]) if len(parts) > 6 and parts[6].strip() else 0
                except ValueError: sport = 0
                try: dport = int(parts[7]) if len(parts) > 7 and parts[7].strip() else 0
                except ValueError: dport = 0

                flags_raw = parts[8].strip() if len(parts) > 8 else ""
                try: swin = int(parts[9]) if len(parts) > 9 and parts[9].strip() else 255
                except ValueError: swin = 255
                try: stcpb = int(parts[10]) if len(parts) > 10 and parts[10].strip() else 0
                except ValueError: stcpb = 0

                if "0x" in flags_raw:
                    try:
                        val = int(flags_raw, 16)
                        if val & 0x01: state = "FIN"
                        elif val & 0x02: state = "REQ"
                        elif val & 0x04: state = "RST"
                        else: state = "FIN"
                    except ValueError:
                        state = "CON"
            elif proto_str == "udp":
                try: sport = int(parts[11]) if len(parts) > 11 and parts[11].strip() else 0
                except ValueError: sport = 0
                try: dport = int(parts[12]) if len(parts) > 12 and parts[12].strip() else 0
                except ValueError: dport = 0

            service = self._infer_service(sport, dport, proto_str)
            flow_key = (src_ip, dst_ip, sport, dport, proto_str)

            flow_dict_to_process = None

            with self._lock:
                if flow_key not in self._active_flows:
                    self._active_flows[flow_key] = {
                        "start_time": timestamp,
                        "last_time": timestamp,
                        "spkts": 1,
                        "dpkts": 0,
                        "sbytes": frame_len,
                        "dbytes": 0,
                        "sttl": sttl,
                        "dttl": 64,
                        "swin": swin,
                        "dwin": 255,
                        "stcpb": stcpb,
                        "dtcpb": 0,
                        "proto": proto_str,
                        "service": service,
                        "state": state
                    }
                else:
                    flow = self._active_flows[flow_key]
                    flow["last_time"] = timestamp
                    flow["spkts"] += 1
                    flow["sbytes"] += frame_len

                flow = self._active_flows[flow_key]
                dur = max(0.001, flow["last_time"] - flow["start_time"])

                # Trigger prediction every 3 packets per flow or if duration > 0.8s
                if flow["spkts"] >= 3 or dur > 0.8:
                    flow_dict_to_process = self._build_unsw_features(flow_key, flow, dur)
                    del self._active_flows[flow_key]

            if flow_dict_to_process:
                self._process_flow_prediction(flow_dict_to_process)

        except Exception as line_err:
            print(f"[LIVE MONITOR] Error parsing TShark packet line: {line_err}")

    def _flush_active_flows(self):
        """Flushes remaining active flows on worker stop so no captured flow is lost."""
        with self._lock:
            keys = list(self._active_flows.keys())
            for flow_key in keys:
                flow = self._active_flows.pop(flow_key, None)
                if flow:
                    dur = max(0.001, flow["last_time"] - flow["start_time"])
                    flow_dict = self._build_unsw_features(flow_key, flow, dur)
                    self._process_flow_prediction(flow_dict)

    def _infer_service(self, sport, dport, proto):
        """Infers network service from port numbers."""
        ports = {sport, dport}
        if 80 in ports: return "http"
        if 443 in ports: return "ssl"
        if 53 in ports: return "dns"
        if 21 in ports: return "ftp"
        if 22 in ports: return "ssh"
        if 25 in ports or 587 in ports: return "smtp"
        if 67 in ports or 68 in ports: return "dhcp"
        if 110 in ports or 995 in ports: return "pop3"
        if 123 in ports: return "ntp"
        if 161 in ports: return "snmp"
        return "-"

    def _build_unsw_features(self, flow_key, flow, dur):
        """Builds 42 UNSW-NB15 feature structure from real captured flow parameters."""
        src_ip, dst_ip, sport, dport, proto = flow_key
        spkts = flow["spkts"]
        dpkts = max(1, flow["dpkts"])
        sbytes = flow["sbytes"]
        dbytes = max(1, flow["dbytes"])

        rate = (spkts + dpkts) / dur
        sload = (sbytes * 8) / dur
        dload = (dbytes * 8) / dur

        recent_src_matches = sum(1 for f in self.recent_flows if f.get("source_ip") == src_ip)
        recent_dst_matches = sum(1 for f in self.recent_flows if f.get("dest_ip") == dst_ip)

        ct_srv_src = max(1, recent_src_matches)
        ct_state_ttl = 1
        ct_dst_ltm = max(1, recent_dst_matches)
        ct_src_dport_ltm = 1
        ct_dst_sport_ltm = 1
        ct_dst_src_ltm = max(1, recent_src_matches)
        ct_src_ltm = max(1, recent_src_matches)
        ct_srv_dst = max(1, recent_dst_matches)
        is_sm_ips_ports = 1 if (src_ip == dst_ip and sport == dport) else 0

        return {
            "source_ip": src_ip,
            "dest_ip": dst_ip,
            "proto": proto,
            "service": flow["service"],
            "state": flow["state"],
            "dur": round(dur, 4),
            "spkts": spkts,
            "dpkts": dpkts,
            "sbytes": sbytes,
            "dbytes": dbytes,
            "rate": round(rate, 2),
            "sttl": flow["sttl"],
            "dttl": flow["dttl"],
            "sload": round(sload, 2),
            "dload": round(dload, 2),
            "sloss": 0,
            "dloss": 0,
            "sinpkt": round(dur * 300, 2),
            "dinpkt": round(dur * 300, 2),
            "sjit": 0.0,
            "djit": 0.0,
            "swin": flow["swin"],
            "stcpb": flow["stcpb"],
            "dtcpb": flow["dtcpb"],
            "dwin": flow["dwin"],
            "tcprtt": 0.0,
            "synack": 0.0,
            "ackdat": 0.0,
            "smean": sbytes // max(1, spkts),
            "dmean": dbytes // max(1, dpkts),
            "trans_depth": 1 if flow["service"] == "http" else 0,
            "response_body_len": 0,
            "ct_srv_src": ct_srv_src,
            "ct_state_ttl": ct_state_ttl,
            "ct_dst_ltm": ct_dst_ltm,
            "ct_src_dport_ltm": ct_src_dport_ltm,
            "ct_dst_sport_ltm": ct_dst_sport_ltm,
            "ct_dst_src_ltm": ct_dst_src_ltm,
            "is_ftp_login": 0,
            "ct_ftp_cmd": 0,
            "ct_flw_http_mthd": 1 if flow["service"] == "http" else 0,
            "ct_src_ltm": ct_src_ltm,
            "ct_srv_dst": ct_srv_dst,
            "is_sm_ips_ports": is_sm_ips_ports
        }

    def _process_flow_prediction(self, flow_dict):
        """Feeds extracted real flow features into NetShield AI Random Forest model."""
        if not flow_dict:
            return

        try:
            res = predict_attack(flow_dict)

            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            source_ip = flow_dict.get("source_ip", "192.168.1.100")
            dest_ip = flow_dict.get("dest_ip", "10.0.0.1")
            protocol = str(flow_dict.get("proto") or "TCP").upper()

            flow_record = {
                "id": f"FLOW-{int(time.time() * 1000) % 1000000}",
                "timestamp": timestamp_str,
                "source_ip": source_ip,
                "dest_ip": dest_ip,
                "protocol": protocol,
                "dur": flow_dict.get("dur", 0.0),
                "spkts": flow_dict.get("spkts", 0),
                "dpkts": flow_dict.get("dpkts", 0),
                "sbytes": flow_dict.get("sbytes", 0),
                "dbytes": flow_dict.get("dbytes", 0),
                "prediction": res["prediction"],
                "is_anomaly": res["is_anomaly"],
                "attack_type": res["attack_type"],
                "confidence": res["confidence"],
                "confidence_score": res["confidence_score"],
                "threat_level": res["threat_level"],
                "risk_score": res["risk_score"]
            }

            with self._lock:
                self.total_flows += 1
                if res["is_anomaly"]:
                    self.anomalous_flows += 1
                    self.threat_count += 1
                    current_rank = THREAT_SEVERITY_ORDER.get(res["threat_level"], 1)
                    highest_rank = THREAT_SEVERITY_ORDER.get(self.highest_threat_level, 1)
                    if current_rank > highest_rank:
                        self.highest_threat_level = res["threat_level"]
                else:
                    self.normal_flows += 1

                self.latest_prediction = res["prediction"]
                self.latest_src_ip = source_ip
                self.latest_dst_ip = dest_ip
                self.latest_protocol = protocol
                self.latest_attack_type = res["attack_type"]
                self.latest_confidence = res["confidence"]
                self.latest_threat_level = res["threat_level"]
                self.latest_risk_score = res["risk_score"]

                self.recent_flows.append(flow_record)

            if res["is_anomaly"]:
                self._trigger_alert_if_not_cooldown(res, source_ip, dest_ip, protocol)

        except Exception as eval_err:
            print(f"[LIVE MONITOR] Flow evaluation error: {eval_err}")

    def _trigger_alert_if_not_cooldown(self, res, source_ip, dest_ip, protocol):
        """Generates alert, incident, and notification with 60s cooldown deduplication."""
        cooldown_key = (source_ip, res["attack_type"], dest_ip)
        now = time.time()

        if now - self.alert_cooldowns.get(cooldown_key, 0) < self.cooldown_seconds:
            return

        self.alert_cooldowns[cooldown_key] = now

        try:
            alert_info = create_security_alert(res, source_ip, dest_ip, protocol)
            if alert_info:
                incident_info = create_incident_from_alert(alert_info)
                create_notification_from_alert_incident(alert_info, incident_info)
                print(f"[LIVE MONITOR] Alert & Incident created for real flow: {source_ip} -> {dest_ip} ({res['attack_type']})")
        except Exception as err:
            print(f"[LIVE MONITOR] Alert creation error: {err}")

# Global singleton instance
live_monitor_service = LiveNetworkMonitor()
