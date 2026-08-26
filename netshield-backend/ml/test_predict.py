from predict import predict_intrusion

print("===== TESTING NETSHIELD ML MODEL =====")

# Temporary test input
test_data = {
    "id": 1,
    "dur": 0.1,
    "spkts": 2,
    "dpkts": 2,
    "sbytes": 100,
    "dbytes": 200,
    "rate": 10.0,
    "sttl": 64,
    "dttl": 64,
    "sload": 1000.0,
    "dload": 1000.0,
    "sloss": 0,
    "dloss": 0,
    "sinpkt": 50.0,
    "dinpkt": 50.0,
    "sjit": 0.0,
    "djit": 0.0,
    "swin": 0,
    "stcpb": 0,
    "dtcpb": 0,
    "dwin": 0,
    "tcprtt": 0.0,
    "synack": 0.0,
    "ackdat": 0.0,
    "smean": 50,
    "dmean": 50,
    "trans_depth": 0,
    "response_body_len": 0,
    "ct_srv_src": 1,
    "ct_state_ttl": 1,
    "ct_dst_ltm": 1,
    "ct_src_dport_ltm": 1,
    "ct_dst_sport_ltm": 1,
    "ct_dst_src_ltm": 1,
    "is_ftp_login": 0,
    "ct_ftp_cmd": 0,
    "ct_flw_http_mthd": 0,
    "ct_src_ltm": 1,
    "ct_srv_dst": 1,
    "is_sm_ips_ports": 0,
    "proto": "tcp",
    "service": "http",
    "state": "FIN"
}

result = predict_intrusion(test_data)

print("\nPrediction Result:")
print(result)