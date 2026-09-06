def calculate_risk_and_severity(attack_type):
    """
    Calculates risk score (0-100) and severity level based on attack classification:
    - BENIGN -> 5 -> LOW
    - FTP-Patator -> 65 -> MEDIUM
    - SSH-Patator -> 80 -> HIGH
    - DDoS -> 95 -> CRITICAL
    """
    label_upper = str(attack_type).strip().upper()
    
    if label_upper == 'BENIGN' or label_upper == 'NORMAL':
        return 5, 'LOW'
    elif 'FTP' in label_upper:
        return 65, 'MEDIUM'
    elif 'SSH' in label_upper:
        return 80, 'HIGH'
    elif 'DDOS' in label_upper or 'DOS' in label_upper:
        return 95, 'CRITICAL'
    elif 'PORT SCAN' in label_upper or 'SCAN' in label_upper:
        return 60, 'MEDIUM'
    elif 'BOT' in label_upper or 'MALWARE' in label_upper:
        return 85, 'HIGH'
    else:
        return 75, 'HIGH'
