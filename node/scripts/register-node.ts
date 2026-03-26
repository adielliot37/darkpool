import { ethers } from "ethers";
import { config } from "../src/config.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

const REGISTRY_ABI = [
  "function registerNode(string endpoint, bytes publicKey) external",
  "function nodes(address) view returns (address owner, string endpoint, bytes publicKey, uint256 totalRelays, uint256 totalMevSaved, uint256 registeredAt, uint256 lastActiveAt, bool active)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(config.sepoliaRpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, wallet);

  const endpoint = `http://localhost:${config.port}`;
  console.log(`Registering node at ${endpoint}...`);

  const tx = await registry.registerNode(endpoint, wallet.address);
  const receipt = await tx.wait();
  console.log(`Node registered! tx: ${receipt.hash}`);

  const node = await registry.nodes(wallet.address);
  console.log("Node data:", {
    owner: node.owner,
    endpoint: node.endpoint,
    active: node.active,
  });
}

main().catch(console.error);
