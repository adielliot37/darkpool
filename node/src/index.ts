import { config } from "./config.js";
import { keyManager } from "./key-manager.js";
import { nodeIdentity } from "./node-identity.js";
import { createRpcServer } from "./rpc-server.js";
import { ethers } from "ethers";

async function main() {
  console.log("=".repeat(50));
  console.log("  DARKPOOL — MEV Protection Relay Node");
  console.log("=".repeat(50));
  console.log(`  Node ID:  ${config.nodeId}`);
  console.log(`  Network:  ${config.network}`);
  console.log(`  Port:     ${config.port}`);
  console.log("=".repeat(50));

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  await keyManager.initialize(provider);

  await nodeIdentity.initialize();

  const app = createRpcServer();
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`\n[Node] RPC server listening on http://0.0.0.0:${config.port}`);
    console.log(`[Node] Point your wallet RPC to: http://localhost:${config.port}`);
    console.log(`[Node] Status: http://localhost:${config.port}/status`);
    console.log(`[Node] Events: http://localhost:${config.port}/events/stream`);
  });

  process.on("SIGINT", () => {
    console.log("\n[Node] Shutting down...");
    keyManager.destroy();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    keyManager.destroy();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
