import React, { useState } from "react";

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "10px 20px",
  background: active ? "#00ff8820" : "transparent",
  border: active ? "1px solid #00ff88" : "1px solid #30363d",
  borderRadius: 6,
  color: active ? "#00ff88" : "#8892a4",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});

const codeBlockStyle: React.CSSProperties = {
  background: "#161b22",
  border: "1px solid #30363d",
  borderRadius: 8,
  padding: 16,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  color: "#e6edf3",
  overflowX: "auto",
  lineHeight: 1.6,
  position: "relative",
};

const stepStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginBottom: 16,
};

const stepNumStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#00ff8820",
  border: "1px solid #00ff88",
  color: "#00ff88",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  flexShrink: 0,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        position: "absolute", top: 8, right: 8,
        background: copied ? "#00ff8830" : "#21262d",
        border: "1px solid #30363d",
        borderRadius: 4, padding: "4px 10px",
        color: copied ? "#00ff88" : "#8892a4",
        fontSize: 11, cursor: "pointer",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function HowToUse() {
  const [tab, setTab] = useState<"use" | "node">("use");

  return (
    <div style={{
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: 10,
      padding: 24,
    }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <div style={tabStyle(tab === "use")} onClick={() => setTab("use")}>
          Protect Your Transactions
        </div>
        <div style={tabStyle(tab === "node")} onClick={() => setTab("node")}>
          Run Your Own Node
        </div>
      </div>

      {tab === "use" && (
        <div>
          <p style={{ color: "#8892a4", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Point your wallet at a Darkpool node instead of a public RPC. Your transactions get encrypted and privately submitted. Bots never see them.
          </p>

          <div style={stepStyle}>
            <div style={stepNumStyle}>1</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 4 }}>Open MetaMask Settings</div>
              <div style={{ color: "#8892a4", fontSize: 13 }}>Settings &gt; Networks &gt; Add Network &gt; Add a network manually</div>
            </div>
          </div>

          <div style={stepStyle}>
            <div style={stepNumStyle}>2</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 8 }}>Enter these details</div>
              <div style={{ ...codeBlockStyle }}>
                <CopyButton text="https://mev.elliot37.com" />
                <div><span style={{ color: "#8892a4" }}>Network Name:</span> Darkpool (Base)</div>
                <div><span style={{ color: "#8892a4" }}>RPC URL:</span> <span style={{ color: "#00ff88" }}>https://mev.elliot37.com</span></div>
                <div><span style={{ color: "#8892a4" }}>Chain ID:</span> 8453</div>
                <div><span style={{ color: "#8892a4" }}>Currency:</span> ETH</div>
                <div><span style={{ color: "#8892a4" }}>Explorer:</span> https://basescan.org</div>
              </div>
            </div>
          </div>

          <div style={stepStyle}>
            <div style={stepNumStyle}>3</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 4 }}>Send any transaction</div>
              <div style={{ color: "#8892a4", fontSize: 13 }}>
                Swaps, transfers, anything. It goes through the Darkpool relay instead of the public mempool. Watch it appear in the Live Feed above.
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 20, padding: 14,
            background: "#00ff8810", border: "1px solid #00ff8830", borderRadius: 8,
          }}>
            <div style={{ color: "#00ff88", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>What happens to your transaction</div>
            <div style={{ color: "#8892a4", fontSize: 12, lineHeight: 1.7 }}>
              Encrypted in Lit Protocol TEE &gt; Batched with timing randomization &gt; Privately submitted to Base &gt; Signed receipt stored on IPFS via Storacha &gt; MEV savings logged on-chain
            </div>
          </div>
        </div>
      )}

      {tab === "node" && (
        <div>
          <p style={{ color: "#8892a4", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Run your own Darkpool relay node on any machine. Every node strengthens the network. More nodes = more geographic distribution = harder to censor.
          </p>

          <div style={stepStyle}>
            <div style={stepNumStyle}>1</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 8 }}>Clone and install</div>
              <div style={codeBlockStyle}>
                <CopyButton text="git clone https://github.com/adielliot37/darkpool.git\ncd darkpool/node\ncp ../.env.example ../.env\nnpm install && npm run build" />
                <div>git clone https://github.com/adielliot37/darkpool.git</div>
                <div>cd darkpool/node</div>
                <div>cp ../.env.example ../.env</div>
                <div>npm install && npm run build</div>
              </div>
            </div>
          </div>

          <div style={stepStyle}>
            <div style={stepNumStyle}>2</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 8 }}>Configure .env</div>
              <div style={codeBlockStyle}>
                <CopyButton text="NETWORK=base\nBASE_RPC_URL=https://mainnet.base.org\nLIT_API_KEY=your_key\nLIT_USAGE_KEY=your_usage_key\nLIT_PKP_ID=your_pkp_address\nSTORACHA_SPACE_DID=your_space_did" />
                <div><span style={{ color: "#8892a4" }}># Get Lit keys from</span> dashboard.dev.litprotocol.com</div>
                <div><span style={{ color: "#8892a4" }}># Get Storacha space from</span> npm run setup:storacha</div>
                <div>NETWORK=base</div>
                <div>BASE_RPC_URL=https://mainnet.base.org</div>
                <div>LIT_API_KEY=your_key</div>
                <div>LIT_USAGE_KEY=your_usage_key</div>
                <div>LIT_PKP_ID=your_pkp_address</div>
                <div>STORACHA_SPACE_DID=your_space_did</div>
              </div>
            </div>
          </div>

          <div style={stepStyle}>
            <div style={stepNumStyle}>3</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: 8 }}>Start the node</div>
              <div style={codeBlockStyle}>
                <CopyButton text="npm start" />
                <div>npm start</div>
                <div style={{ color: "#8892a4" }}># Node runs on port 8545</div>
                <div style={{ color: "#8892a4" }}># Point wallets to http://your-ip:8545</div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 20, padding: 14,
            background: "#45b7d110", border: "1px solid #45b7d130", borderRadius: 8,
          }}>
            <div style={{ color: "#45b7d1", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Raspberry Pi?</div>
            <div style={{ color: "#8892a4", fontSize: 12, lineHeight: 1.7 }}>
              Works great on Pi 4 (4GB+). Use a Cloudflare Tunnel to expose it publicly. See node/scripts/setup-pi.sh for the full setup script.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
