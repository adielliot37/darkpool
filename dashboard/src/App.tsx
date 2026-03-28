import React from "react";
import NetworkStatus from "./components/NetworkStatus.js";
import NodeCard from "./components/NodeCard.js";
import LiveFeed from "./components/LiveFeed.js";
import MevSavings from "./components/MevSavings.js";
import SideBySideDemo from "./components/SideBySideDemo.js";
import { useNetworkStats } from "./hooks/useContract.js";
import { useNodeStatus, useRelayEvents, useAttackerStatus } from "./hooks/useNodeStats.js";

const NODE_URL = "https://mev.elliot37.com";
const ATTACKER_URL = "http://localhost:9000";

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

const headingStyle: React.CSSProperties = {
  color: "#e6edf3",
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 16,
  fontFamily: "'Inter', sans-serif",
  borderBottom: "1px solid #21262d",
  paddingBottom: 8,
};

export default function App() {
  const { stats, nodes, loading } = useNetworkStats();
  const nodeStatus = useNodeStatus(NODE_URL);
  const events = useRelayEvents(NODE_URL);
  const attackerStatus = useAttackerStatus(ATTACKER_URL);

  const displayNodes = nodes.length > 0 ? nodes : nodeStatus ? [{
    address: "0x" + "0".repeat(40),
    endpoint: `http://localhost:${nodeStatus.network === "sepolia" ? "8545" : "8545"}`,
    totalRelays: nodeStatus.totalRelayed,
    totalMevSaved: nodeStatus.totalMevSaved,
    lastActiveAt: Date.now() / 1000,
    active: true,
  }] : [];

  const totalSaved = stats.totalMevSaved !== "0" ? stats.totalMevSaved : nodeStatus ? (Number(nodeStatus.totalMevSaved) / 1e18).toFixed(6) : "0";
  const attackerProfit = attackerStatus?.totalProfitEth || "0";

  return (
    <div style={{
      background: "#010409",
      color: "#e6edf3",
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif",
      padding: "0 24px 40px",
    }}>
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 0",
        borderBottom: "1px solid #21262d",
        marginBottom: 32,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "linear-gradient(135deg, #00ff88 0%, #00ccff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 20,
            color: "#000",
          }}>D</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>DARKPOOL</div>
            <div style={{ fontSize: 12, color: "#8892a4" }}>Decentralized MEV Protection Network</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: nodeStatus ? "#00ff88" : "#ff4444" }} />
          <span style={{ color: "#8892a4", fontSize: 13 }}>
            {nodeStatus ? `Node: ${nodeStatus.nodeId}` : "Node Offline"}
          </span>
        </div>
      </header>

      <div style={sectionStyle}>
        <div style={headingStyle}>Network Overview</div>
        <NetworkStatus
          activeNodes={stats.activeNodes || displayNodes.length}
          totalRelays={stats.totalRelays || (nodeStatus?.totalRelayed ?? 0)}
          totalMevSaved={totalSaved}
          loading={loading && !nodeStatus}
        />
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>MEV Protection vs Extraction</div>
        <MevSavings totalSaved={totalSaved} attackerProfit={attackerProfit} />
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Side-by-Side Demo</div>
        <SideBySideDemo />
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Relay Nodes</div>
        <NodeCard nodes={displayNodes} />
      </div>

      <div style={sectionStyle}>
        <div style={headingStyle}>Live Transaction Feed</div>
        <LiveFeed events={events} />
      </div>
    </div>
  );
}
