import React from "react";

interface NodeInfo {
  address: string;
  endpoint: string;
  totalRelays: number;
  totalMevSaved: string;
  lastActiveAt: number;
  active: boolean;
}

interface Props {
  nodes: NodeInfo[];
}

const cardStyle: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid #30363d",
  borderRadius: 10,
  padding: 20,
  minWidth: 280,
};

const badgeStyle: React.CSSProperties = {
  background: "#ff4444",
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 4,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
};

export default function NodeCard({ nodes }: Props) {
  if (nodes.length === 0) {
    return (
      <div style={{ color: "#8892a4", padding: 20 }}>
        No registered nodes yet. Deploy contracts and register nodes to see them here.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {nodes.map((node, i) => (
        <div key={node.address} style={{ ...cardStyle, border: i === 0 ? "1px solid #ff4444" : "1px solid #30363d" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              {node.address.slice(0, 6)}...{node.address.slice(-4)}
            </span>
            {i === 0 && <span style={badgeStyle}>Hardware Node</span>}
          </div>
          <div style={{ color: "#8892a4", fontSize: 12, marginBottom: 6 }}>{node.endpoint}</div>
          <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11 }}>Relays</div>
              <div style={{ color: "#00ff88", fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{node.totalRelays}</div>
            </div>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11 }}>MEV Saved</div>
              <div style={{ color: "#00ffff", fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{parseFloat(node.totalMevSaved).toFixed(4)}</div>
            </div>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11 }}>Status</div>
              <div style={{ color: node.active ? "#00ff88" : "#ff4444", fontSize: 14, fontWeight: 600 }}>
                {node.active ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
