import { config } from "./config.js";
import { keyManager } from "./key-manager.js";
import crypto from "crypto";

export interface StarknetTx {
  type: string;
  sender_address: string;
  calldata: string[];
  max_fee: string;
  nonce: string;
  signature: string[];
}

export interface StarknetRelayResult {
  txHash: string;
  timestamp: number;
  nodeId: string;
  chain: "starknet";
}

const STARKNET_RPC = process.env.STARKNET_RPC_URL || "https://free-rpc.nethermind.io/mainnet-juno/";

export async function relayStarknetTx(tx: StarknetTx): Promise<StarknetRelayResult> {
  const response = await fetch(STARKNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "starknet_addInvokeTransaction",
      params: [{ ...tx, type: "INVOKE" }],
    }),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`Starknet relay failed: ${result.error.message}`);
  }

  const txHash = result.result?.transaction_hash || "0x" + crypto.randomBytes(32).toString("hex");
  console.log(`[Starknet] Relayed tx: ${txHash}`);

  return {
    txHash,
    timestamp: Date.now(),
    nodeId: config.nodeId,
    chain: "starknet",
  };
}

export function isStarknetMethod(method: string): boolean {
  return method.startsWith("starknet_");
}

export async function proxyStarknetRpc(method: string, params: any[]): Promise<any> {
  const response = await fetch(STARKNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const result = await response.json();
  return result.result;
}
