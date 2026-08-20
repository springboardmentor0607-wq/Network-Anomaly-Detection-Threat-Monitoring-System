from scapy.all import sniff


def process_packet(packet):

    print("\nPacket Captured")
    print("----------------")

    print(packet.summary())


def start_monitoring():

    print("NetShield AI Live Packet Monitoring Started")

    sniff(
        prn=process_packet,
        store=False
    )


if __name__ == "__main__":
    start_monitoring()