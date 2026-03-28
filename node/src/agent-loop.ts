import { ethers } from "ethers";
import { config } from "./config.js";
import { nodeIdentity } from "./node-identity.js";
import { keyManager } from "./key-manager.js";

interface AgentState {
  phase: "idle" | "planning" | "executing" | "verifying" | "reporting";
  totalRelayed: number;
  totalMevSaved: bigint;
  lastVerification: number;
  consecutiveFailures: number;
}

const state: AgentState = {
  phase: "idle",
  totalRelayed: 0,
  totalMevSaved: 0n,
  lastVerification: 0,
  consecutiveFailures: 0,
};

const REGISTRY_ABI = [
  "function recordRelay(bytes32 bundleHash, uint256 mevSaved, string storachaCid)",
  "function nodes(address) view returns (address,string,bytes,uint256,uint256,uint256,uint256,bool)",
];

export function getAgentState() {
  return {
    ...state,
    totalMevSaved: state.totalMevSaved.toString(),
  };
}

export function recordRelay(mevSaved: bigint) {
  state.totalRelayed++;
  state.totalMevSaved += mevSaved;
}

export async function runAgentLoop() {
  const intervalMs = 60_000;
  console.log("[Agent] Autonomous decision loop started (60s cycle)");

  setInterval(async () => {
    try {
      await plan();
      await execute();
      await verify();
    } catch (err: any) {
      state.consecutiveFailures++;
      console.error("[Agent] Loop error:", err.message);
      if (state.consecutiveFailures > 5) {
        console.warn("[Agent] Too many failures, backing off");
      }
    }
  }, intervalMs);
}

async function plan() {
  state.phase = "planning";
  const now = Date.now();
  const timeSinceLastVerify = now - state.lastVerification;

  if (state.totalRelayed === 0) {
    console.log("[Agent] Plan: idle, waiting for transactions");
    return;
  }

  if (timeSinceLastVerify < 300_000) {
    return;
  }

  console.log(`[Agent] Plan: ${state.totalRelayed} relays pending verification, ${ethers.formatEther(state.totalMevSaved)} ETH saved`);
}

async function execute() {
  state.phase = "executing";

  if (!config.registryAddress || state.totalRelayed === 0) return;

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = keyManager.getWallet().connect(provider);
  const balance = await provider.getBalance(wallet.address);

  if (balance === 0n) {
    return;
  }

  try {
    const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, wallet);
    const bundleHash = ethers.keccak256(
      ethers.toUtf8Bytes(`relay-batch-${Date.now()}-${state.totalRelayed}`)
    );
    const tx = await registry.recordRelay(bundleHash, state.totalMevSaved, "");
    await tx.wait();
    console.log(`[Agent] Recorded ${state.totalRelayed} relays on-chain`);
    state.consecutiveFailures = 0;
  } catch (err: any) {
    if (!err.message.includes("insufficient funds")) {
      console.error("[Agent] Execute failed:", err.message);
    }
  }
}

async function verify() {
  state.phase = "verifying";

  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const block = await provider.getBlockNumber();
    const network = await provider.getNetwork();

    const agentId = nodeIdentity.getAgentId();

    console.log(
      `[Agent] Verify: block=${block} chain=${network.chainId} agent=#${agentId} relays=${state.totalRelayed}`
    );

    state.lastVerification = Date.now();
    state.phase = "idle";
  } catch (err: any) {
    console.error("[Agent] Verify failed:", err.message);
  }
}
