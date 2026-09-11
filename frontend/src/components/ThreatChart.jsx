import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const data = [
  { name: "Critical", value: 5 },
  { name: "High", value: 10 },
  { name: "Medium", value: 18 },
  { name: "Low", value: 30 },
];

const COLORS = [
  "#EF4444",
  "#F97316",
  "#FACC15",
  "#22C55E",
];

function ThreatChart() {
  return (
    <div
      style={{
        background: "#1F2937",
        padding: "20px",
        borderRadius: "10px",
        color: "white",
      }}
    >
      <h2>Threat Distribution</h2>

      <PieChart width={350} height={300}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
          label
        >
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}

export default ThreatChart;