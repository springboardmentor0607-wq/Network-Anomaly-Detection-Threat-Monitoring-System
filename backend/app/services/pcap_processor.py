from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

from app.database.mongodb import pcap_analysis_collection

from scapy.all import rdpcap, IP, TCP, UDP, ICMP


# ============================================================
# PCAP ANALYSIS
# ============================================================

def analyze_pcap(file_path: str):

    # --------------------------------------------------------
    # File name
    # --------------------------------------------------------

    file_name = Path(file_path).name

    print("\n===================================")
    print("       NETSHIELD AI PCAP ANALYSIS")
    print("===================================\n")

    # --------------------------------------------------------
    # Check file
    # --------------------------------------------------------

    path = Path(file_path)

    if not path.exists():

        raise FileNotFoundError(
            f"PCAP file not found: {file_path}"
        )

    print(f"Reading PCAP: {path}")

    # --------------------------------------------------------
    # Read PCAP
    # --------------------------------------------------------

    packets = rdpcap(str(path))

    total_packets = len(packets)

    print(
        f"Total packets: {total_packets}"
    )

    # --------------------------------------------------------
    # Counters
    # --------------------------------------------------------

    protocol_counts = Counter()

    source_ips = Counter()

    destination_ips = Counter()

    total_bytes = 0

    tcp_packets = 0

    udp_packets = 0

    icmp_packets = 0

    ip_packets = 0

    packet_details = []

    # ========================================================
    # PROCESS PACKETS
    # ========================================================

    for packet in packets:

        # ----------------------------------------------------
        # Packet size
        # ----------------------------------------------------

        packet_length = len(packet)

        total_bytes += packet_length

        # ----------------------------------------------------
        # Default values
        # ----------------------------------------------------

        protocol = "OTHER"

        source = None

        destination = None

        source_port = None

        destination_port = None

        # ----------------------------------------------------
        # IP packet
        # ----------------------------------------------------

        if IP in packet:

            ip_packets += 1

            source = packet[IP].src

            destination = packet[IP].dst

            source_ips[source] += 1

            destination_ips[destination] += 1

            # ------------------------------------------------
            # TCP
            # ------------------------------------------------

            if TCP in packet:

                protocol = "TCP"

                tcp_packets += 1

                source_port = packet[TCP].sport

                destination_port = packet[TCP].dport

            # ------------------------------------------------
            # UDP
            # ------------------------------------------------

            elif UDP in packet:

                protocol = "UDP"

                udp_packets += 1

                source_port = packet[UDP].sport

                destination_port = packet[UDP].dport

            # ------------------------------------------------
            # ICMP
            # ------------------------------------------------

            elif ICMP in packet:

                protocol = "ICMP"

                icmp_packets += 1

        # ----------------------------------------------------
        # Protocol counter
        # ----------------------------------------------------

        protocol_counts[protocol] += 1

        # ----------------------------------------------------
        # Store first 100 packet details
        # ----------------------------------------------------

        if len(packet_details) < 100:

            packet_details.append({

                "source":
                    source,

                "destination":
                    destination,

                "protocol":
                    protocol,

                "source_port":
                    source_port,

                "destination_port":
                    destination_port,

                "length":
                    packet_length

            })

    # ========================================================
    # CREATE ANALYTICS
    # ========================================================

    protocol_distribution = dict(
        protocol_counts
    )

    top_source_ips = dict(
        source_ips.most_common(10)
    )

    top_destination_ips = dict(
        destination_ips.most_common(10)
    )

    # ========================================================
    # PRINT ANALYSIS
    # ========================================================

    print("\n-----------------------------------")
    print("PCAP ANALYSIS COMPLETED")
    print("-----------------------------------")

    print(
        f"Total Packets : {total_packets}"
    )

    print(
        f"Total Bytes   : {total_bytes}"
    )

    print(
        f"IP Packets    : {ip_packets}"
    )

    print(
        f"TCP Packets   : {tcp_packets}"
    )

    print(
        f"UDP Packets   : {udp_packets}"
    )

    print(
        f"ICMP Packets  : {icmp_packets}"
    )

    print(
        f"Protocols     : {protocol_distribution}"
    )

    print("\nTop Source IPs:")

    for ip, count in source_ips.most_common(10):

        print(
            f"  {ip}: {count} packets"
        )

    print("\nTop Destination IPs:")

    for ip, count in destination_ips.most_common(10):

        print(
            f"  {ip}: {count} packets"
        )

    # ========================================================
    # SAVE TO MONGODB
    # ========================================================

    created_at = datetime.now(
        timezone.utc
    )

    pcap_document = {

        "file_name":
            file_name,

        "total_packets":
            total_packets,

        "total_bytes":
            total_bytes,

        "ip_packets":
            ip_packets,

        "tcp_packets":
            tcp_packets,

        "udp_packets":
            udp_packets,

        "icmp_packets":
            icmp_packets,

        "protocol_distribution":
            protocol_distribution,

        "top_source_ips":
            top_source_ips,

        "top_destination_ips":
            top_destination_ips,

        "packet_details":
            packet_details,

        "created_at":
            created_at

    }

    mongo_result = (
        pcap_analysis_collection.insert_one(
            pcap_document
        )
    )

    print(
        "\nPCAP analysis saved to MongoDB"
    )

    print(
        f"PCAP Analysis ID : {mongo_result.inserted_id}"
    )

    # ========================================================
    # FINAL RESULT
    # ========================================================

    result = {

        "id":
            str(mongo_result.inserted_id),

        "file_name":
            file_name,

        "total_packets":
            total_packets,

        "total_bytes":
            total_bytes,

        "ip_packets":
            ip_packets,

        "tcp_packets":
            tcp_packets,

        "udp_packets":
            udp_packets,

        "icmp_packets":
            icmp_packets,

        "protocol_distribution":
            protocol_distribution,

        "top_source_ips":
            top_source_ips,

        "top_destination_ips":
            top_destination_ips,

        "packet_details":
            packet_details,

        "created_at":
            created_at.isoformat()

    }

    return result