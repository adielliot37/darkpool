import React, { useState } from "react";

interface Step {
  label: string;
  status: "pending" | "active" | "done" | "danger";
  detail?: string;
}

export default function SideBySideDemo() {
  const [running, setRunning] = useState(false);
  const [publicSteps, setPublicSteps] = useState<Step[]>([
    { label: "Transaction Submitted", status: "pending" },
    { label: "Enters Public Mempool", status: "pending" },
    { label: "MEV Bot Detects Swap", status: "pending" },
    { label: "Front-run Executed", status: "pending" },
    { label: "Your Transaction Executes", status: "pending" },
    { label: "Back-run Executed", status: "pending" },
    { label: "You Lost Money", status: "pending" },
  ]);
  const [darkpoolSteps, setDarkpoolSteps] = useState<Step[]>([
    { label: "Transaction Submitted", status: "pending" },
    { label: "Encrypted by Node", status: "pending" },
    { label: "Added to Private Batch", status: "pending" },
    { label: "Batch Shuffled + Delayed", status: "pending" },
    { label: "Sent to Block Builder", status: "pending" },
    { label: "Included in Block", status: "pending" },
    { label: "Zero MEV Lost", status: "pending" },
  ]);
  const [publicLoss, setPublicLoss] = useState("");
  const [darkpoolLoss, setDarkpoolLoss] = useState("");

  async function runDemo() {
    setRunning(true);
    setPublicLoss("");
    setDarkpoolLoss("");

    const resetSteps = (steps: Step[]) => steps.map(s => ({ ...s, status: "pending" as const }));
    setPublicSteps(resetSteps(publicSteps));
    setDarkpoolSteps(resetSteps(darkpoolSteps));

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    const updatePublic = (idx: number, status: Step["status"], detail?: string) => {
      setPublicSteps(prev => prev.map((s, i) => i === idx ? { ...s, status, detail } : i < idx ? { ...s, status: "done" } : s));
    };
    const updateDarkpool = (idx: number, status: Step["status"], detail?: string) => {
      setDarkpoolSteps(prev => prev.map((s, i) => i === idx ? { ...s, status, detail } : i < idx ? { ...s, status: "done" } : s));
    };

    updatePublic(0, "active"); updateDarkpool(0, "active");
    await delay(800);
    updatePublic(1, "active", "Visible to everyone"); updateDarkpool(1, "active", "AES-256-GCM encrypted");
    await delay(1000);
    updatePublic(2, "danger", "Bot found your swap!"); updateDarkpool(2, "active", "Queued in batch");
    await delay(1000);
    updatePublic(3, "danger", "Bot buys before you"); updateDarkpool(3, "active", "Order randomized");
    await delay(800);
    updatePublic(4, "active", "Worse price for you"); updateDarkpool(4, "active", "Private channel");
    await delay(800);
    updatePublic(5, "danger", "Bot sells after you"); updateDarkpool(5, "active", "Confirmed in block");
    await delay(600);
    updatePublic(6, "danger"); setPublicLoss("0.0847 ETH");
    updateDarkpool(6, "done"); setDarkpoolLoss("0.0000 ETH");

    setPublicSteps(prev => prev.map(s => ({ ...s, status: s.status === "pending" ? "done" : s.status })));
    setDarkpoolSteps(prev => prev.map(s => ({ ...s, status: s.status === "pending" ? "done" : s.status })));

    setRunning(false);
  }

  const columnStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: 12,
    padding: 24,
    minWidth: 300,
  };

  const stepStyle = (status: Step["status"]): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #ffffff10",
    color: status === "danger" ? "#ff4444" : status === "done" ? "#00ff88" : status === "active" ? "#ffd700" : "#555",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    transition: "all 0.3s ease",
  });

  const dotStyle = (status: Step["status"]): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: status === "danger" ? "#ff4444" : status === "done" ? "#00ff88" : status === "active" ? "#ffd700" : "#333",
    flexShrink: 0,
  });

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <button
          onClick={runDemo}
          disabled={running}
          style={{
            background: running ? "#333" : "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)",
            color: running ? "#888" : "#000",
            border: "none",
            borderRadius: 8,
            padding: "14px 40px",
            fontSize: 16,
            fontWeight: 700,
            cursor: running ? "not-allowed" : "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {running ? "Running Demo..." : "Run Side-by-Side Demo"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ ...columnStyle, background: "linear-gradient(180deg, #1a0000 0%, #0d0000 100%)", border: "1px solid #ff444440" }}>
          <div style={{ color: "#ff4444", fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
            Public Mempool
          </div>
          {publicSteps.map((step, i) => (
            <div key={i} style={stepStyle(step.status)}>
              <div style={dotStyle(step.status)} />
              <div>
                <div>{step.label}</div>
                {step.detail && <div style={{ fontSize: 11, opacity: 0.7 }}>{step.detail}</div>}
              </div>
            </div>
          ))}
          {publicLoss && (
            <div style={{ textAlign: "center", marginTop: 20, padding: 16, background: "#ff444420", borderRadius: 8 }}>
              <div style={{ color: "#ff4444", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>MEV Lost</div>
              <div style={{ color: "#ff4444", fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{publicLoss}</div>
            </div>
          )}
        </div>
        <div style={{ ...columnStyle, background: "linear-gradient(180deg, #001a0e 0%, #000d06 100%)", border: "1px solid #00ff8840" }}>
          <div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
            Darkpool Protected
          </div>
          {darkpoolSteps.map((step, i) => (
            <div key={i} style={stepStyle(step.status)}>
              <div style={dotStyle(step.status)} />
              <div>
                <div>{step.label}</div>
                {step.detail && <div style={{ fontSize: 11, opacity: 0.7 }}>{step.detail}</div>}
              </div>
            </div>
          ))}
          {darkpoolLoss && (
            <div style={{ textAlign: "center", marginTop: 20, padding: 16, background: "#00ff8820", borderRadius: 8 }}>
              <div style={{ color: "#00ff88", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>MEV Lost</div>
              <div style={{ color: "#00ff88", fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{darkpoolLoss}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
