import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

function getRpcUrl(): string {
  const network = process.env.NETWORK || "base";
  switch (network) {
    case "base": return process.env.BASE_RPC_URL || "https://mainnet.base.org";
    case "baseSepolia": return process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
    case "sepolia": return process.env.SEPOLIA_RPC_URL || "";
    default: return process.env.SEPOLIA_RPC_URL || "";
  }
}

function getWsUrl(): string {
  const network = process.env.NETWORK || "base";
  switch (network) {
    case "base": return process.env.BASE_WS_URL || "";
    case "baseSepolia": return process.env.BASE_SEPOLIA_WS_URL || "";
    case "sepolia": return process.env.SEPOLIA_WS_URL || "";
    default: return process.env.SEPOLIA_WS_URL || "";
  }
}

export const config = {
  port: parseInt(process.env.NODE_PORT || "8545"),
  nodeId: process.env.NODE_ID || "darkpool-node-01",
  network: process.env.NETWORK || "base",
  rpcUrl: getRpcUrl(),
  wsUrl: getWsUrl(),
  registryAddress: process.env.REGISTRY_CONTRACT_ADDRESS || "",
  identityAddress: process.env.AGENT_IDENTITY_CONTRACT_ADDRESS || "",
  litNetwork: process.env.LIT_NETWORK || "datil",
  storachaSpaceDid: process.env.STORACHA_SPACE_DID || "",
  batchSize: 5,
  batchTimeoutMs: 10_000,
  minDelayMs: 500,
  maxDelayMs: 3000,
};
