"""
Risk Scoring Engine - Calculates threat severity and risk levels
"""
import numpy as np
from typing import Tuple, Dict, Any
from dataclasses import dataclass


@dataclass
class RiskScore:
    """Risk scoring result"""
    score: float  # 0.0 - 1.0
    level: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    factors: Dict[str, float]
    recommendations: list


class RiskScorer:
    """
    Risk Scoring Engine
    Combines anomaly scores, prediction confidence, and behavioral patterns
    to generate comprehensive threat risk assessments
    """
    
    # Risk level thresholds
    CRITICAL_THRESHOLD = 0.85
    HIGH_THRESHOLD = 0.65
    MEDIUM_THRESHOLD = 0.45
    LOW_THRESHOLD = 0.20
    
    @staticmethod
    def calculate_risk(
        anomaly_score: float,
        prediction_confidence: float,
        prediction_class: str,
        flow_bytes: int,
        flow_packets: int,
        protocol: int
    ) -> RiskScore:
        """
        Calculate comprehensive risk score for a network flow
        
        Args:
            anomaly_score: Anomaly detection score (0.0-1.0)
            prediction_confidence: Attack classification confidence (0.0-1.0)
            prediction_class: Predicted attack class
            flow_bytes: Flow data bytes
            flow_packets: Flow packet count
            protocol: Protocol type
        
        Returns:
            RiskScore object with score, level, factors, and recommendations
        """
        # Factor 1: Anomaly deviation weight (40%)
        anomaly_factor = anomaly_score * 0.40
        
        # Factor 2: Prediction confidence weight (35%)
        confidence_factor = prediction_confidence * 0.35
        
        # Factor 3: Behavioral pattern weight (15%)
        behavioral_factor = RiskScorer._calculate_behavioral_risk(
            flow_bytes, flow_packets, protocol
        ) * 0.15
        
        # Factor 4: Attack class severity weight (10%)
        severity_factor = RiskScorer._get_attack_severity(prediction_class) * 0.10
        
        # Calculate final risk score
        total_risk = anomaly_factor + confidence_factor + behavioral_factor + severity_factor
        risk_score = min(1.0, total_risk)
        
        # Determine risk level
        risk_level = RiskScorer._get_risk_level(risk_score)
        
        # Get contributing factors
        factors = {
            "anomaly": round(anomaly_factor, 4),
            "confidence": round(confidence_factor, 4),
            "behavioral": round(behavioral_factor, 4),
            "severity": round(severity_factor, 4),
        }
        
        # Get recommendations
        recommendations = RiskScorer._get_recommendations(risk_level, prediction_class)
        
        return RiskScore(
            score=round(risk_score, 4),
            level=risk_level,
            factors=factors,
            recommendations=recommendations
        )
    
    @staticmethod
    def _calculate_behavioral_risk(flow_bytes: int, flow_packets: int, protocol: int) -> float:
        """
        Calculate behavioral risk based on flow characteristics
        
        - Unusual packet/byte ratios
        - Large data transfers
        - Protocol misuse
        """
        risk = 0.0
        
        # Check for large data transfers (potential exfiltration)
        if flow_bytes > 10_000_000:  # > 10MB
            risk += 0.3
        elif flow_bytes > 1_000_000:  # > 1MB
            risk += 0.2
        
        # Check for unusual packet patterns
        if flow_packets > 10000:
            risk += 0.2
        elif flow_packets < 5 and flow_bytes > 10000:
            risk += 0.1  # Few packets with large data = suspicious
        
        # Protocol-specific risks
        if protocol == 6:  # TCP
            risk += 0.05  # TCP more likely for attacks than UDP
        
        return min(1.0, risk)
    
    @staticmethod
    def _get_attack_severity(attack_class: str) -> float:
        """
        Get severity level for attack class
        
        Returns 0.0-1.0 severity score
        """
        severity_map = {
            # Benign
            "BENIGN": 0.0,
            
            # Reconnaissance
            "Port Scan": 0.4,
            "Network Scan": 0.4,
            "Reconnaissance": 0.35,
            
            # Denial of Service
            "DoS": 0.95,
            "DoS SYN Flood": 0.95,
            "DoS UDP Flood": 0.90,
            "DDoS": 0.95,
            
            # Probing
            "Probe": 0.35,
            "IP Sweep": 0.40,
            
            # Intrusion
            "Intrusion": 0.90,
            "Backdoor": 0.95,
            "Remote Access": 0.85,
            
            # Injection
            "SQL Injection": 0.90,
            "XSS": 0.70,
            "Command Injection": 0.85,
            
            # Malware
            "Malware": 0.95,
            "Trojan": 0.95,
            "Ransomware": 0.98,
            "Worm": 0.92,
            
            # Botnet
            "Botnet": 0.95,
            "C2 Communication": 0.90,
            
            # Exploit
            "Exploit": 0.85,
            "Vulnerability": 0.80,
            
            # Data Exfiltration
            "Exfiltration": 0.92,
            "Data Theft": 0.90,
            
            # Anomaly
            "Anomaly": 0.50,
            "Suspicious": 0.45,
        }
        
        return severity_map.get(attack_class, 0.5)
    
    @staticmethod
    def _get_risk_level(score: float) -> str:
        """Convert risk score to risk level"""
        if score >= RiskScorer.CRITICAL_THRESHOLD:
            return "CRITICAL"
        elif score >= RiskScorer.HIGH_THRESHOLD:
            return "HIGH"
        elif score >= RiskScorer.MEDIUM_THRESHOLD:
            return "MEDIUM"
        elif score >= RiskScorer.LOW_THRESHOLD:
            return "LOW"
        else:
            return "INFO"
    
    @staticmethod
    def _get_recommendations(risk_level: str, attack_class: str) -> list:
        """Generate recommendations based on risk level and attack class"""
        recommendations = []
        
        # Level-based recommendations
        if risk_level == "CRITICAL":
            recommendations.extend([
                "IMMEDIATE: Block all traffic from source IP",
                "URGENT: Escalate to incident response team",
                "Isolate affected systems from network",
                "Preserve logs for forensic analysis"
            ])
        elif risk_level == "HIGH":
            recommendations.extend([
                "Monitor traffic pattern closely",
                "Prepare containment procedures",
                "Alert SOC manager immediately",
                "Document all suspicious activities"
            ])
        elif risk_level == "MEDIUM":
            recommendations.extend([
                "Continue monitoring this flow",
                "Cross-reference with threat intelligence",
                "Review historical patterns from this source"
            ])
        elif risk_level == "LOW":
            recommendations.extend([
                "Monitor for changes in behavior",
                "Add to watchlist for analysis"
            ])
        
        # Attack class specific recommendations
        if "DoS" in attack_class or "DDoS" in attack_class:
            recommendations.append("Enable DDoS protection mechanisms")
            recommendations.append("Check network bandwidth capacity")
        
        if "Scan" in attack_class or "Port" in attack_class:
            recommendations.append("Review firewall rules")
            recommendations.append("Enable port scanning detection")
        
        if "Injection" in attack_class:
            recommendations.append("Check web application logs")
            recommendations.append("Update input validation filters")
        
        if "Exfiltration" in attack_class or "Theft" in attack_class:
            recommendations.append("Check data loss prevention (DLP) alerts")
            recommendations.append("Review data access logs")
        
        return recommendations
    
    @staticmethod
    def batch_score(flows_data: list) -> list:
        """
        Score multiple flows efficiently
        
        Args:
            flows_data: List of flow dictionaries with risk scoring parameters
        
        Returns:
            List of RiskScore objects
        """
        return [
            RiskScorer.calculate_risk(
                flow.get('anomaly_score', 0.0),
                flow.get('prediction_confidence', 0.0),
                flow.get('prediction_class', 'BENIGN'),
                flow.get('bytes', 0),
                flow.get('packets', 0),
                flow.get('protocol', 6)
            )
            for flow in flows_data
        ]


# Risk metrics aggregation
class RiskMetrics:
    """Aggregate risk metrics across network"""
    
    @staticmethod
    def calculate_network_risk(risk_scores: list) -> Dict[str, Any]:
        """
        Calculate overall network risk metrics
        
        Args:
            risk_scores: List of RiskScore objects
        
        Returns:
            Dictionary with network-wide risk metrics
        """
        if not risk_scores:
            return {
                "avg_risk": 0.0,
                "critical_threats": 0,
                "high_threats": 0,
                "medium_threats": 0,
                "low_threats": 0,
                "overall_status": "NORMAL"
            }
        
        risk_values = [rs.score for rs in risk_scores]
        
        critical = sum(1 for rs in risk_scores if rs.level == "CRITICAL")
        high = sum(1 for rs in risk_scores if rs.level == "HIGH")
        medium = sum(1 for rs in risk_scores if rs.level == "MEDIUM")
        low = sum(1 for rs in risk_scores if rs.level == "LOW")
        
        avg_risk = np.mean(risk_values)
        
        if critical > 0:
            overall_status = "CRITICAL"
        elif high > 0:
            overall_status = "HIGH"
        elif medium > 0:
            overall_status = "MEDIUM"
        elif low > 0:
            overall_status = "LOW"
        else:
            overall_status = "NORMAL"
        
        return {
            "avg_risk": round(float(avg_risk), 4),
            "critical_threats": critical,
            "high_threats": high,
            "medium_threats": medium,
            "low_threats": low,
            "overall_status": overall_status,
            "total_threats": len(risk_scores)
        }
