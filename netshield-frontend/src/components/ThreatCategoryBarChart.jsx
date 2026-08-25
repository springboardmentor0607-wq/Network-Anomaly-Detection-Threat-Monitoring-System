import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { threatDistributionCategories } from "../constants/mockData";

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">{`Category: ${data.payload.category}`}</p>
        <p style={{ color: data.payload.color, margin: 0, fontWeight: 600 }}>
          {`Packet Count: ${data.value.toLocaleString()}`}
        </p>
      </div>
    );
  }
  return null;
}

function ThreatCategoryBarChart({ data = threatDistributionCategories, height = 300 }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
          <XAxis dataKey="category" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "0.85rem" }} />
          <Bar
            dataKey="count"
            name="Traffic Flow Count"
            radius={[6, 6, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ThreatCategoryBarChart;
