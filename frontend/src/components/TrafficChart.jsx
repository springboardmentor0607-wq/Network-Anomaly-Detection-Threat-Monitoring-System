import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { time: "10 AM", packets: 120 },
  { time: "11 AM", packets: 300 },
  { time: "12 PM", packets: 220 },
  { time: "1 PM", packets: 500 },
  { time: "2 PM", packets: 420 },
  { time: "3 PM", packets: 650 },
];

function TrafficChart() {
  return (
    <div
      style={{
        background: "#1F2937",
        padding: 20,
        borderRadius: 10,
        marginTop: 25,
      }}
    >
      <h3 style={{ color: "white" }}>Network Traffic</h3>

      <LineChart width={700} height={300} data={data}>
        <Line
          type="monotone"
          dataKey="packets"
          stroke="#3B82F6"
          strokeWidth={3}
        />

        <CartesianGrid stroke="#444" />

        <XAxis dataKey="time" />

        <YAxis />

        <Tooltip />
      </LineChart>
    </div>
  );
}

export default TrafficChart;