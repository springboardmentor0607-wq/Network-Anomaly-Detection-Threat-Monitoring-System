function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#1F2937",
        color: "white",
        padding: "20px",
        borderRadius: "10px",
        width: "200px",
        textAlign: "center",
      }}
    >
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>
  );
}

export default StatCard;