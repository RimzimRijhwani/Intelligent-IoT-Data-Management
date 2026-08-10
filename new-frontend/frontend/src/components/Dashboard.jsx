// components/Dashboard.jsx

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const Dashboard = ({
  datasetId,
  data,
  loading,
  error,
  isEmpty,
  isValid,
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner" style={{
          border: "4px solid #e2e8f0",
          borderTop: "4px solid #2563eb",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 1s linear infinite",
          margin: "0 auto 1rem",
        }} />
        <p>Loading sensor data for {datasetId}...</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem", color: "#dc2626" }}>
        <p>⚠️ {error.message || "An unexpected error occurred."}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.5rem",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Invalid data state
  if (!isValid) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem", color: "#dc2626" }}>
        <p>⚠️ The data format is invalid and cannot be displayed.</p>
      </div>
    );
  }

  // Empty data state
  if (isEmpty || !data || !data.rows || data.rows.length === 0) {
    return (
      <div className="dashboard-state" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <p>📭 No sensor records found for this dataset.</p>
      </div>
    );
  }

  // Extract data
  const { rows, metadata, dataset } = data;
  const streamIds = metadata.streams.map(s => s.id);
  const displayName = metadata.display_name || dataset;

  // Prepare chart data
  const chartData = rows.map((row) => {
    const entry = {
      timestamp: new Date(row.created_at).toLocaleString(),
      entry_id: row.entry_id,
    };
    streamIds.forEach((id) => {
      entry[id] = row[id] !== undefined ? row[id] : null;
    });
    return entry;
  });

  // Summary stats from metadata
  const stats = streamIds.map((id) => {
    const stat = metadata.statistics[id] || {};
    return {
      name: id,
      min: stat.min || 0,
      max: stat.max || 0,
      avg: stat.average || 0,
      count: stat.valid_count || 0,
    };
  });

  const colours = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#413ea0", "#d0ed57", "#a4de6c", "#ff6b6b"];

  return (
    <div className="dashboard-container" style={{ padding: "0 1rem" }}>
      {/* Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        {stats.map((stat, index) => (
          <div key={stat.name} style={{
            background: "white",
            border: "1px solid #dbe7f5",
            borderRadius: "14px",
            padding: "1rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}>
            <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>
              {stat.name.toUpperCase()}
            </h4>
            <p style={{ margin: "0.25rem 0", color: "#334155" }}>
              Min: {stat.min} | Max: {stat.max} | Avg: {stat.avg}
            </p>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Count: {stat.count}</span>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div style={{
        background: "white",
        border: "1px solid #dbe7f5",
        borderRadius: "20px",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <h3 style={{ margin: "0 0 1rem", color: "#0f172a" }}>
          Time‑series: {streamIds.join(", ")}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            {streamIds.map((id, index) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                stroke={colours[index % colours.length]}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart - First Stream */}
      {streamIds.length > 0 && (
        <div style={{
          background: "white",
          border: "1px solid #dbe7f5",
          borderRadius: "20px",
          padding: "1.5rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{ margin: "0 0 1rem", color: "#0f172a" }}>
            Bar Chart – {streamIds[0].toUpperCase()}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={streamIds[0]} fill={colours[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: "center",
        color: "#64748b",
        fontSize: "0.9rem",
        padding: "1rem 0"
      }}>
        Dataset: {displayName} | Records: {rows.length}
      </div>
    </div>
  );
};

export default Dashboard;