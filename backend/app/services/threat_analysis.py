import logging
from typing import Dict, Any, List, Optional
from app.services.risk_scoring import RiskScoringService

logger = logging.getLogger(__name__)

# Predefined Threat Intelligence Knowledgebase
THREAT_INTELLIGENCE_BASE: Dict[str, Dict[str, Any]] = {
    "ddos": {
        "title": "Distributed Denial of Service (DDoS)",
        "description": "Volumetric distributed denial of service attack attempting to saturate network bandwidth and overwhelm server processing capacity using multiple compromised botnet origins.",
        "impact": "Causes severe latency spikes, packet loss, complete service outage, disruption to legitimate users, and potential infrastructure instability.",
        "recommendations": [
            "Enable rate limiting and BGP FlowSpec rules at the perimeter router.",
            "Engage upstream DDoS mitigation provider / CDN scrubbing centers.",
            "Block malicious source IP subnets dynamically via firewall ACLs.",
            "Enforce strict SYN cookies and connection timeout policies on edge load balancers."
        ]
    },
    "dos": {
        "title": "Denial of Service (DoS)",
        "description": "Single-source denial of service attack flooding target services with TCP SYN packets, ICMP requests, or HTTP request storms.",
        "impact": "Exhausts server CPU, memory, and socket buffer pools, leading to resource starvation and localized service unresponsiveness.",
        "recommendations": [
            "Apply IP-based rate limiting on the target endpoint.",
            "Blackhole / drop incoming traffic from the offending source IP.",
            "Tune TCP stack parameters (tcp_syn_retries, tcp_max_syn_backlog).",
            "Deploy Web Application Firewall (WAF) request-limiting rules."
        ]
    },
    "malware": {
        "title": "Malware Activity / C2 Communication",
        "description": "Malicious software execution detected transmitting command-and-control (C2) heartbeats, unauthorized payload downloads, or exfiltrating data.",
        "impact": "High risk of host compromise, lateral movement within internal subnets, credential theft, ransomware encryption, and persistent data breach.",
        "recommendations": [
            "Immediately isolate compromised host from internal network segment.",
            "Block external C2 IP addresses and domain names across egress firewalls.",
            "Kill malicious processes and inspect persistence mechanisms (Registry, Systemd, Cron).",
            "Perform full Endpoint Detection and Response (EDR) memory scan and triage."
        ]
    },
    "portscan": {
        "title": "Port Scanning & Reconnaissance",
        "description": "Automated network reconnaissance activity scanning sequential TCP/UDP port ranges to identify open services and OS vulnerabilities.",
        "impact": "Precursor to targeted exploitation; exposes open port surface area, active network topology, and running service versions to potential attackers.",
        "recommendations": [
            "Configure automatic fail2ban / IP banning for aggressive port scanning IPs.",
            "Disable unused public-facing ports and non-essential background services.",
            "Ensure firewall rules follow strict default-deny inbound posture.",
            "Audit exposed management interfaces (SSH, RDP) and mandate MFA."
        ]
    },
    "bruteforce": {
        "title": "Brute Force Authentication Attempt",
        "description": "High-frequency authentication attempts targeting user accounts, SSH, RDP, or web logins to guess passwords or exploit weak credentials.",
        "impact": "Potential account takeover (ATO), unauthorized system entry, privilege escalation, and resource exhaustion of authentication servers.",
        "recommendations": [
            "Enforce Multi-Factor Authentication (MFA) across all authentication endpoints.",
            "Implement progressive account lockout and IP-based rate limiting on login routes.",
            "Mandate strong, complex password policies and block common weak passwords.",
            "Monitor authentication logs for distributed credential spraying patterns."
        ]
    },
    "bot": {
        "title": "Botnet Activity",
        "description": "Automated bot traffic performing malicious web scraping, credential stuffing, or participating in coordinated botnet tasks.",
        "impact": "Consumes application bandwidth, distorts analytics, automates attack execution, and risks infrastructure exploitation.",
        "recommendations": [
            "Deploy CAPTCHA or JS challenge verification on public endpoints.",
            "Implement bot management and fingerprinting solutions at the WAF.",
            "Block known TOR exit nodes and proxy IP lists.",
            "Monitor for anomalous user-agent headers and automated session behaviors."
        ]
    },
    "infiltration": {
        "title": "Network Infiltration / Advanced Threat",
        "description": "Advanced persistent threat (APT) activity attempting unauthorized internal network entry, privilege escalation, or lateral movement.",
        "impact": "Critical risk of enterprise compromise, sensitive intellectual property exfiltration, domain controller takeover, and long-term persistence.",
        "recommendations": [
            "Isolate target VLAN / network segment and initiate immediate incident response triage.",
            "Audit Active Directory / IAM privileges and revoke suspicious tokens.",
            "Inspect internal lateral movement logs (Kerberos, SMB, RDP traffic).",
            "Conduct urgent forensic analysis of affected endpoints and jump boxes."
        ]
    },
    "benign": {
        "title": "Benign Network Traffic",
        "description": "Legitimate network traffic operating within standard baseline parameters without threat signatures or anomalies.",
        "impact": "No operational risk; standard network communication.",
        "recommendations": [
            "Continue routine security monitoring and log archiving.",
            "Maintain baseline security policies and anomaly detection thresholds."
        ]
    }
}


class ThreatAnalysisService:
    """
    AI-Powered Threat Analysis Module for NetShield AI.
    Analyzes detected attacks, computes risk scores, generates threat descriptions,
    impact assessments, and recommended mitigation actions.
    """

    @staticmethod
    def analyze_threat(
        attack_type: str,
        confidence: float,
        risk_score: Optional[int] = None,
        severity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform threat analysis for a detected attack.

        Args:
            attack_type (str): Name of predicted attack class (e.g. 'DDoS', 'Malware', 'DoS', 'Benign').
            confidence (float): Prediction confidence score (0.0 to 1.0).
            risk_score (int, optional): Pre-calculated risk score. Computed via RiskScoringService if omitted.
            severity (str, optional): Pre-calculated severity string. Computed if omitted.

        Returns:
            dict: {
                "attack_type": "Malware",
                "confidence": 0.987,
                "risk_score": 89,
                "severity": "Critical",
                "description": "...",
                "impact": "...",
                "recommendations": [...]
            }
        """
        raw_type = str(attack_type).strip().lower() if attack_type else "benign"
        conf_val = round(float(confidence), 3) if confidence is not None else 0.5

        # Compute Risk Score & Severity if not provided
        if risk_score is None or severity is None:
            risk_data = RiskScoringService.calculate_risk(attack_type, conf_val)
            calc_risk_score = int(round(risk_data["risk_score"]))
            calc_severity = risk_data["severity"]
        else:
            calc_risk_score = int(round(risk_score))
            calc_severity = str(severity)

        # Match attack type in threat intelligence base
        intel = THREAT_INTELLIGENCE_BASE.get(raw_type)
        if not intel:
            # Check keyword match
            matched_key = None
            for key in THREAT_INTELLIGENCE_BASE:
                if key in raw_type or raw_type in key:
                    matched_key = key
                    break
            
            if matched_key:
                intel = THREAT_INTELLIGENCE_BASE[matched_key]
            elif "attack" in raw_type or "malicious" in raw_type:
                intel = {
                    "description": f"Uncategorized malicious traffic pattern identified matching {attack_type} signature.",
                    "impact": "Potential security breach, unauthorized network access, and system instability.",
                    "recommendations": [
                        "Inspect packet payload and header details for anomalies.",
                        "Block offending source IP address at firewall perimeter.",
                        "Monitor host logs for unusual process or connection activity."
                    ]
                }
            else:
                intel = THREAT_INTELLIGENCE_BASE["benign"]

        return {
            "attack_type": attack_type,
            "confidence": conf_val,
            "risk_score": calc_risk_score,
            "severity": calc_severity,
            "description": intel["description"],
            "impact": intel["impact"],
            "recommendations": intel["recommendations"]
        }


# Global shortcut helper function
def analyze_threat(attack_type: str, confidence: float, risk_score: Optional[int] = None, severity: Optional[str] = None) -> Dict[str, Any]:
    return ThreatAnalysisService.analyze_threat(attack_type, confidence, risk_score, severity)
