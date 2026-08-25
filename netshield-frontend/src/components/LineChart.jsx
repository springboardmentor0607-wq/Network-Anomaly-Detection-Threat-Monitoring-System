import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { networkTrafficTimeline } from "../constants/mockData";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">{`Timestamp: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color, margin: "4px 0" }}>
            <span style={{ fontWeight: 600 }}>{entry.name}:</span>{" "}
            {entry.value.toLocaleString()} packets
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function LineChart({ data = networkTrafficTimeline, height = 320 }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 15, right: 25, left: -5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
          <XAxis dataKey="time" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "0.85rem" }} />
          <Line
            type="monotone"
            dataKey="incoming"
            name="Incoming Traffic"
            stroke="#38bdf8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: "#38bdf8" }}
          />
          <Line
            type="monotone"
            dataKey="outgoing"
            name="Outgoing Traffic"
            stroke="#818cf8"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: "#818cf8" }}
          />
          <Line
            type="monotone"
            dataKey="anomalies"
            name="Anomalies / Threats"
            stroke="#f87171"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#ef4444" }}
            activeDot={{ r: 7, fill: "#ef4444" }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChart;
