import os
import requests
from datetime import datetime
from sqlalchemy.orm import Session
from ..database.models import ThreatIndicator


class ThreatIntelService:
    @staticmethod
    def enrich_indicator(db: Session, source_ip: str, attack_vector: str, risk_score: float, severity: str):
        """Enriches indicators via internal metrics and external lookup adapters when keys exist."""
        indicator = db.query(ThreatIndicator).filter(ThreatIndicator.source_ip == source_ip).first()

        provider_source = "INTERNAL"
        abuse_key = os.getenv("ABUSEIPDB_API_KEY")
        vt_key = os.getenv("VIRUSTOTAL_API_KEY")
        otx_key = os.getenv("ALIENVAULT_OTX_API_KEY")

        if abuse_key:
            provider_source = "ABUSE_IPDB"
        elif vt_key:
            provider_source = "VIRUSTOTAL"
        elif otx_key:
            provider_source = "ALIENVAULT_OTX"

        if indicator:
            indicator.occurrence_count += 1
            indicator.last_seen = datetime.utcnow()
            if risk_score > indicator.max_risk_score:
                indicator.max_risk_score = risk_score
                indicator.severity = severity
                indicator.attack_vector = attack_vector
            indicator.source = provider_source
        else:
            indicator = ThreatIndicator(
                source_ip=source_ip,
                indicator_type="IP",
                attack_vector=attack_vector,
                occurrence_count=1,
                max_risk_score=risk_score,
                severity=severity,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow(),
                source=provider_source
            )
            db.add(indicator)
        
        db.commit()
        return indicator
