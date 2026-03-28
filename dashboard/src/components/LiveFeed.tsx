import React from "react";

interface RelayEvent {
  type: "received" | "encrypted" | "batched" | "relayed" | "confirmed";
  txHash?: string;
  timestamp: number;
  mevEstimate?: {
    estimatedSavings: string;
    attackType: string;
  };
  receipt?: {
    storachaCid?: string;
    litEncrypted?: boolean;
    litVerified?: boolean;
    litPkpAddress?: string;
  };
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

const stepLabels: Record<string, string> = {
  received: "Transaction received from wallet",
  encrypted: "Encrypted via Lit Protocol (TEE)",
  batched: "Added to private batch",
  relayed: "Submitted to block builder",
  confirmed: "Confirmed on Base",
};

export default function LiveFeed({ events }: Props) {
  return (
    <div style={{
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: 10,
      padding: 20,
      maxHeight: 500,
      overflowY: "auto",
    }}>
      {events.length === 0 && (
        <div style={{ color: "#8892a4", textAlign: "center", padding: 40 }}>
          Waiting for transactions... Point MetaMask RPC to https://mev.elliot37.com
        </div>
      )}
      {[...events].reverse().map((event, i) => (
        <div key={i} style={{
          padding: "10px 0",
          borderBottom: "1px solid #21262d",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            <span style={{ color: "#8892a4", fontSize: 11 }}>
              {stepLabels[event.type] || event.type}
            </span>
            <span style={{ color: "#8892a4", fontSize: 11, marginLeft: "auto" }}>
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {event.txHash && (
            <div style={{ marginTop: 6, marginLeft: 92 }}>
              <a
                href={`https://basescan.org/tx/${event.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#58a6ff", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textDecoration: "none" }}
              >
                {event.txHash}
              </a>
            </div>
          )}

          {event.type === "confirmed" && event.mevEstimate && (
            <div style={{ marginTop: 6, marginLeft: 92, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={{ color: "#00ff88", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                MEV Saved: {(Number(event.mevEstimate.estimatedSavings) / 1e18).toFixed(8)} ETH
              </span>
              {event.mevEstimate.attackType !== "none" && (
                <span style={{ color: "#ff6b6b", fontSize: 11 }}>
                  Attack blocked: {event.mevEstimate.attackType}
                </span>
              )}
            </div>
          )}

          {event.type === "confirmed" && event.receipt && (
            <div style={{ marginTop: 4, marginLeft: 92, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {event.receipt.litEncrypted && (
                <span style={{ color: "#ff6b6b", fontSize: 10, background: "#ff6b6b20", padding: "2px 6px", borderRadius: 3 }}>
                  Lit Encrypted
                </span>
              )}
              {event.receipt.litVerified && (
                <span style={{ color: "#00ff88", fontSize: 10, background: "#00ff8820", padding: "2px 6px", borderRadius: 3 }}>
                  Lit Verified
                </span>
              )}
              {event.receipt.storachaCid && (
                <a
                  href={`https://${event.receipt.storachaCid}.ipfs.w3s.link`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#45b7d1", fontSize: 10, background: "#45b7d120", padding: "2px 6px", borderRadius: 3, textDecoration: "none" }}
                >
                  IPFS Receipt
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
