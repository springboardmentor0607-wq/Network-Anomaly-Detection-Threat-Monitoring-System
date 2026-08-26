// Signature visual: a small monitored network. Every node is "clean" traffic
// except one, which periodically flags amber then red — a live, silent
// demonstration of the product's actual job (spotting the one node behaving
// differently) rather than decoration.
export default function NetworkGlyph({ className = "" }: { className?: string }) {
  const nodes = [
    { id: "n1", x: 60, y: 60 },
    { id: "n2", x: 200, y: 40 },
    { id: "n3", x: 320, y: 90 },
    { id: "n4", x: 120, y: 170 },
    { id: "n5", x: 260, y: 200 },
    { id: "n6", x: 40, y: 250 },
    { id: "n7", x: 340, y: 260 },
    { id: "n8", x: 190, y: 130 }, // hub
  ];

  const edges: [string, string][] = [
    ["n1", "n8"],
    ["n2", "n8"],
    ["n3", "n8"],
    ["n4", "n8"],
    ["n5", "n8"],
    ["n6", "n4"],
    ["n7", "n5"],
    ["n2", "n3"],
  ];

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const anomalyId = "n7";

  return (
    <svg
      viewBox="0 0 380 300"
      className={className}
      role="img"
      aria-label="Diagram of a monitored network, with one flagged host"
    >
      <defs>
        <radialGradient id="anomaly-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-critical)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-critical)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {edges.map(([a, b]) => {
        const from = byId[a];
        const to = byId[b];
        const isFlagged = a === anomalyId || b === anomalyId;
        return (
          <line
            key={`${a}-${b}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isFlagged ? "var(--color-critical)" : "var(--color-border)"}
            strokeWidth={isFlagged ? 1.5 : 1}
            opacity={isFlagged ? 0.7 : 0.6}
          />
        );
      })}

      {nodes.map((n) => {
        const isHub = n.id === "n8";
        const isAnomaly = n.id === anomalyId;
        return (
          <g key={n.id}>
            {isAnomaly && (
              <circle cx={n.x} cy={n.y} r="26" fill="url(#anomaly-glow)">
                <animate
                  attributeName="r"
                  values="16;28;16"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={isHub ? 7 : 5}
              fill={
                isAnomaly
                  ? "var(--color-critical)"
                  : isHub
                  ? "var(--color-text)"
                  : "var(--color-signal)"
              }
            />
            {isAnomaly && (
              <circle
                cx={n.x}
                cy={n.y}
                r="5"
                fill="none"
                stroke="var(--color-critical)"
                strokeWidth="1"
              >
                <animate
                  attributeName="r"
                  values="5;16;5"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.9;0;0.9"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}
