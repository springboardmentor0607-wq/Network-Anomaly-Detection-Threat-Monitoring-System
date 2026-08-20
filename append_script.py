script_content = """
---

## Milestone 2: Anomaly Detection & Threat Intelligence

**Speaker Notes:**
"Moving on to our core intelligence engine, we’ve shifted away from static rules and built a proactive system. In our lab environment, we run live network sniffing to capture and analyze packet flows in real-time. As this live traffic enters the system, our Machine Learning models—trained to understand what 'normal' looks like—instantly perform anomaly detection. The moment traffic deviates, such as an incoming DDoS or a subtle port scan, the AI catches it and classifies the threat. We don't just leave that data hidden in the background, though. Every single detection is processed, assigned a risk score, and aggregated into our automated Security Reports. This means we instantly translate raw, live network packets into clear, exportable intelligence that security teams can act on immediately."
"""

with open("e:\\NetShield\\Presentation_Script.md", "a", encoding="utf-8") as f:
    f.write(script_content)
