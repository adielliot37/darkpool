import React from "react";

interface Props {
  activeNodes: number;
  totalRelays: number;
  totalMevSaved: string;
  loading: boolean;
}

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #0a1628 0%, #1a1a2e 100%)",
  border: "1px solid #00ff8830",
  borderRadius: 12,
  padding: "24px 32px",
  flex: 1,
  minWidth: 200,
};

const labelStyle: React.CSSProperties = {
  color: "#8892a4",
  fontSize: 13,
  fontWeight: 500,
  textTransform: "uppercase" as const,
  letterSpacing: 1.5,
  marginBottom: 8,
};

const valueStyle: React.CSSProperties = {
  color: "#00ff88",
  fontSize: 36,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
};

export default function NetworkStatus({ activeNodes, totalRelays, totalMevSaved, loading }: Props) {
  if (loading) return <div style={{ color: "#8892a4", padding: 40 }}>Loading network stats...</div>;

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={cardStyle}>
        <div style={labelStyle}>Active Nodes</div>
        <div style={valueStyle}>{activeNodes}</div>
      </div>
      <div style={cardStyle}>
        <div style={labelStyle}>Transactions Relayed</div>
        <div style={valueStyle}>{totalRelays}</div>
      </div>
      <div style={{ ...cardStyle, border: "1px solid #00ffff30" }}>
        <div style={labelStyle}>Total MEV Saved</div>
        <div style={{ ...valueStyle, color: "#00ffff" }}>{parseFloat(totalMevSaved).toFixed(4)} ETH</div>
      </div>
    </div>
  );
}
