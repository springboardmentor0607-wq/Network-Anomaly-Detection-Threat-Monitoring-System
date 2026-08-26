from app.ai.classifier import classify_attack
from app.ai.risk_score import calculate_risk


sample_packet = [
    0,1,20,9,5000,10000,
    0,0,0,0,0,1,
    0,0,0,0,0,0,
    0,0,0,0,
    50,50,
    0,0,0,0,
    1,0,0,
    200,100,
    0.5,0.2,0.1,
    0,0,0,0,0
]


result = classify_attack(sample_packet)

result["risk_score"] = calculate_risk(
    result["severity"]
)


print(result)