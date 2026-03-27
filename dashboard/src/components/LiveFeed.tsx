import React from "react";

interface RelayEvent {
  type: "received" | "encrypted" | "batched" | "relayed" | "confirmed";
  txHash?: string;
  timestamp: number;
}

interface Props {
  events: RelayEvent[];
}

const typeColors: Record<string, string> = {
  received: "#ffd700",
  encrypted: "#ff6b6b",
  batched: "#4ecdc4",
  relayed: "#45b7d1",
  confirmed: "#00ff88",
};

export default function LiveFeed({ events }: Props) {
  return (
    <div style={{
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: 10,
      padding: 20,
      maxHeight: 400,
      overflowY: "auto",
    }}>
      {events.length === 0 && (
        <div style={{ color: "#8892a4", textAlign: "center", padding: 40 }}>
          Waiting for transactions...
        </div>
      )}
      {[...events].reverse().map((event, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 0",
          borderBottom: "1px solid #21262d",
        }}>
          <span style={{
            background: typeColors[event.type] || "#888",
            color: "#000",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 4,
            textTransform: "uppercase" as const,
            minWidth: 80,
            textAlign: "center",
          }}>
            {event.type}
          </span>
          <span style={{ color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            {event.txHash ? `${event.txHash.slice(0, 18)}...` : "---"}
          </span>
          <span style={{ color: "#8892a4", fontSize: 11, marginLeft: "auto" }}>
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}
