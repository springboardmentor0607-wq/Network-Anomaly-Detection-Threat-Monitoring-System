import matplotlib.pyplot as plt
import seaborn as sns
import os


# Create folder for graphs

GRAPH_DIR = os.path.join(
    os.path.dirname(__file__),
    "graphs"
)

os.makedirs(
    GRAPH_DIR,
    exist_ok=True
)


# -----------------------------
# 1. Accuracy Graph
# -----------------------------

accuracy = 0.8943

plt.figure(figsize=(6,4))

plt.bar(
    ["Random Forest"],
    [accuracy * 100]
)

plt.ylabel("Accuracy (%)")
plt.title("Model Accuracy")

plt.ylim(0,100)

plt.savefig(
    os.path.join(
        GRAPH_DIR,
        "accuracy.png"
    )
)

plt.close()



# -----------------------------
# 2. Attack Distribution
# -----------------------------

normal = 9711
attack = 12833


plt.figure(figsize=(6,4))

plt.bar(
    ["Normal","Attack"],
    [normal,attack]
)

plt.ylabel("Number of Samples")
plt.title("NSL-KDD Attack Distribution")


plt.savefig(
    os.path.join(
        GRAPH_DIR,
        "attack_distribution.png"
    )
)

plt.close()



# -----------------------------
# 3. Confusion Matrix
# -----------------------------

matrix = [
    [7446,2265],
    [117,12716]
]


plt.figure(figsize=(6,4))

sns.heatmap(
    matrix,
    annot=True,
    fmt="d",
    xticklabels=[
        "Normal",
        "Attack"
    ],
    yticklabels=[
        "Normal",
        "Attack"
    ]
)


plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.title(
    "Confusion Matrix"
)


plt.savefig(
    os.path.join(
        GRAPH_DIR,
        "confusion_matrix.png"
    )
)

plt.close()



# -----------------------------
# 4. Risk Score Graph
# -----------------------------

risk_scores = [
    20,
    45,
    70,
    85,
    95
]


plt.figure(figsize=(6,4))


plt.plot(
    risk_scores,
    marker="o"
)


plt.xlabel("Alert Number")
plt.ylabel("Risk Score")

plt.title(
    "Threat Risk Score Trend"
)


plt.savefig(
    os.path.join(
        GRAPH_DIR,
        "risk_score.png"
    )
)

plt.close()



print(
    "All graphs generated successfully!"
)
