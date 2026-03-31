import React, { useState } from "react";

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
  flex: 1,
  minWidth: 320,
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

const specRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "5px 0",
  borderBottom: "1px solid #161b22",
  fontSize: 12,
};

const piSpecs = [
  { label: "Hardware", value: "Raspberry Pi 4 Model B" },
  { label: "CPU", value: "ARM Cortex-A72 (4 cores, 1.8GHz)" },
  { label: "RAM", value: "4GB LPDDR4" },
  { label: "Storage", value: "32GB SD (ext4 + journaling)" },
  { label: "OS", value: "Raspberry Pi OS (aarch64)" },
  { label: "Node.js", value: "v20.20.0" },
  { label: "Network", value: "WiFi + Cloudflare Tunnel" },
  { label: "Power", value: "~5W idle / ~7W load" },
  { label: "Key Storage", value: "Persistent on disk" },
  { label: "Encryption", value: "Lit Protocol V3 (TEE)" },
  { label: "Receipts", value: "Storacha (IPFS/Filecoin)" },
  { label: "Identity", value: "ERC-8004 Agent #37507" },
];

export default function NodeCard({ nodes }: Props) {
  const [showSpecs, setShowSpecs] = useState(false);

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
            <div style={{ display: "flex", gap: 6 }}>
              {i === 0 && <span style={badgeStyle}>Hardware Node</span>}
              {i === 0 && <span style={{ ...badgeStyle, background: "#00ff8830", color: "#00ff88", border: "1px solid #00ff8850" }}>Pi 4</span>}
            </div>
          </div>

          <a href={node.endpoint} target="_blank" rel="noopener noreferrer"
            style={{ color: "#58a6ff", fontSize: 12, textDecoration: "none" }}>
            {node.endpoint}
          </a>

          <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11 }}>Relays</div>
              <div style={{ color: "#00ff88", fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{node.totalRelays}</div>
            </div>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11 }}>MEV Saved</div>
              <div style={{ color: "#00ffff", fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                {parseFloat(node.totalMevSaved).toFixed(6)} ETH
              </div>
            </div>
            <div>
              <div style={{ color: "#8892a4", fontSize: 11 }}>Status</div>
              <div style={{ color: node.active ? "#00ff88" : "#ff4444", fontSize: 14, fontWeight: 600 }}>
                {node.active ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          </div>

          {i === 0 && (
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => setShowSpecs(!showSpecs)}
                style={{
                  background: "transparent", border: "1px solid #30363d", borderRadius: 6,
                  color: "#8892a4", fontSize: 11, padding: "6px 12px", cursor: "pointer",
                  width: "100%", textAlign: "left",
                }}
              >
                {showSpecs ? "Hide" : "Show"} Node Specs
              </button>

              {showSpecs && (
                <div style={{ marginTop: 10, background: "#161b22", borderRadius: 8, padding: 12 }}>
                  {piSpecs.map((spec) => (
                    <div key={spec.label} style={specRowStyle}>
                      <span style={{ color: "#8892a4" }}>{spec.label}</span>
                      <span style={{ color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace" }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
