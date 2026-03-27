import React from "react";

interface Props {
  totalSaved: string;
  attackerProfit: string;
}

export default function MevSavings({ totalSaved, attackerProfit }: Props) {
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{
        background: "linear-gradient(135deg, #002211 0%, #001a0e 100%)",
        border: "2px solid #00ff88",
        borderRadius: 16,
        padding: "32px 40px",
        flex: 1,
        textAlign: "center",
      }}>
        <div style={{ color: "#00ff88", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
          Protected by Darkpool
        </div>
        <div style={{ color: "#00ff88", fontSize: 48, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {parseFloat(totalSaved).toFixed(4)} ETH
        </div>
        <div style={{ color: "#00ff8880", fontSize: 13, marginTop: 4 }}>MEV savings for users</div>
      </div>
      <div style={{
        background: "linear-gradient(135deg, #220000 0%, #1a0000 100%)",
        border: "2px solid #ff4444",
        borderRadius: 16,
        padding: "32px 40px",
        flex: 1,
        textAlign: "center",
      }}>
        <div style={{ color: "#ff4444", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
          MEV Bot Extraction
        </div>
        <div style={{ color: "#ff4444", fontSize: 48, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {parseFloat(attackerProfit || "0").toFixed(4)} ETH
        </div>
        <div style={{ color: "#ff444480", fontSize: 13, marginTop: 4 }}>Stolen from unprotected users</div>
      </div>
    </div>
  );
}
