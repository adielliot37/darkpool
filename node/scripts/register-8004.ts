import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import fs from "fs";

const ERC8004_IDENTITY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const IDENTITY_ABI = [
  "function register(string agentURI) returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org");
  const pk = process.env.PRIVATE_KEY!.startsWith("0x") ? process.env.PRIVATE_KEY! : `0x${process.env.PRIVATE_KEY}`;
  const wallet = new ethers.Wallet(pk, provider);
  const registry = new ethers.Contract(ERC8004_IDENTITY, IDENTITY_ABI, wallet);

  console.log("Wallet:", wallet.address);

  const balance = await registry.balanceOf(wallet.address);
  if (balance > 0n) {
    const tokenId = await registry.tokenOfOwnerByIndex(wallet.address, 0);
    console.log(`Already registered as agent #${tokenId}`);
    return;
  }

  const agentJson = JSON.parse(fs.readFileSync("../agent.json", "utf-8"));
  const agentURI = `https://raw.githubusercontent.com/adielliot37/darkpool/main/agent.json`;

  console.log("Registering on ERC-8004 Identity Registry...");
  console.log("Agent URI:", agentURI);

  const tx = await registry.register(agentURI);
  const receipt = await tx.wait();
  console.log("Registered! tx:", receipt.hash);

  const agentId = await registry.tokenOfOwnerByIndex(wallet.address, 0);
  console.log("Agent ID:", agentId.toString());

  agentJson.registrations = [{
    agentId: Number(agentId),
    agentRegistry: `eip155:8453:${ERC8004_IDENTITY}`
  }];
  fs.writeFileSync("../agent.json", JSON.stringify(agentJson, null, 2));
  console.log("Updated agent.json with registration");

  const agentLog = JSON.parse(fs.readFileSync("../../agent_log.json", "utf-8"));
  agentLog.transactions.push({
    type: "register",
    txHash: receipt.hash,
    agentId: Number(agentId),
    registry: ERC8004_IDENTITY,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync("../../agent_log.json", JSON.stringify(agentLog, null, 2));
  console.log("Updated agent_log.json");
}

main().catch(console.error);
