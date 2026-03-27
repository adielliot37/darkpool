import { ethers } from "ethers";
import { PendingTx } from "./mempool-watcher.js";

const SWAP_SIGS = [
  "0x38ed1739", // swapExactTokensForTokens
  "0x7ff36ab5", // swapExactETHForTokens
  "0x18cbafe5", // swapTokensForExactETH
  "0x5ae401dc", // multicall (Uniswap V3)
  "0xb6f9de95", // swapExactETHForTokensSupportingFeeOnTransferTokens
];

export interface SandwichOpportunity {
  targetTx: PendingTx;
  estimatedProfit: bigint;
  frontRunGasPrice: bigint;
  backRunGasPrice: bigint;
  targetValue: bigint;
}

export interface SandwichResult {
  target: PendingTx;
  frontRunHash: string;
  backRunHash: string;
  profit: bigint;
  timestamp: number;
}

export function isSwapTransaction(tx: PendingTx): boolean {
  if (!tx.data || tx.data.length < 10) return false;
  const sig = tx.data.slice(0, 10).toLowerCase();
  return SWAP_SIGS.includes(sig);
}

export function analyzeOpportunity(tx: PendingTx): SandwichOpportunity | null {
  if (!isSwapTransaction(tx)) return null;

  const txValue = tx.value > 0n ? tx.value : ethers.parseEther("0.1");
  const minProfitThreshold = ethers.parseEther("0.001");
  const estimatedProfit = (txValue * 30n) / 10000n; // ~0.3% extraction

  if (estimatedProfit < minProfitThreshold) return null;

  return {
    targetTx: tx,
    estimatedProfit,
    frontRunGasPrice: tx.gasPrice + ethers.parseUnits("2", "gwei"),
    backRunGasPrice: tx.gasPrice - 1n,
    targetValue: txValue,
  };
}

export function simulateSandwich(opportunity: SandwichOpportunity): SandwichResult {
  const frontRunHash = "0x" + "f".repeat(64).slice(0, 64);
  const backRunHash = "0x" + "b".repeat(64).slice(0, 64);

  return {
    target: opportunity.targetTx,
    frontRunHash,
    backRunHash,
    profit: opportunity.estimatedProfit,
    timestamp: Date.now(),
  };
}
