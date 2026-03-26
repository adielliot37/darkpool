import { ethers } from "ethers";

const UNISWAP_V2_SWAP_SIG = "0x38ed1739";
const UNISWAP_V3_SWAP_SIG = "0x5ae401dc";
const SWAP_EXACT_TOKENS = "0x38ed1739";
const SWAP_EXACT_ETH = "0x7ff36ab5";
const SWAP_TOKENS_FOR_ETH = "0x18cbafe5";

export interface MevEstimate {
  estimatedSavings: bigint;
  attackType: string;
  details: {
    txValue: bigint;
    slippageTolerance: number;
    vulnerabilityScore: number;
  };
}

function isSwapTransaction(data: string): boolean {
  if (!data || data.length < 10) return false;
  const sig = data.slice(0, 10).toLowerCase();
  return [UNISWAP_V2_SWAP_SIG, UNISWAP_V3_SWAP_SIG, SWAP_EXACT_TOKENS, SWAP_EXACT_ETH, SWAP_TOKENS_FOR_ETH].includes(sig);
}

export function estimateMevSavings(rawTx: string): MevEstimate {
  try {
    const tx = ethers.Transaction.from(rawTx);
    const value = tx.value;
    const data = tx.data || "0x";

    if (!isSwapTransaction(data) && value === 0n) {
      return {
        estimatedSavings: 0n,
        attackType: "none",
        details: { txValue: value, slippageTolerance: 0, vulnerabilityScore: 0 },
      };
    }

    const txValue = value > 0n ? value : ethers.parseEther("0.1");
    const slippageTolerance = 0.005;
    const extractable = (txValue * 30n) / 10000n;
    const vulnerabilityScore = Number(extractable) / Number(txValue || 1n);

    return {
      estimatedSavings: extractable,
      attackType: isSwapTransaction(data) ? "sandwich" : "frontrun",
      details: {
        txValue,
        slippageTolerance,
        vulnerabilityScore,
      },
    };
  } catch {
    return {
      estimatedSavings: 0n,
      attackType: "none",
      details: { txValue: 0n, slippageTolerance: 0, vulnerabilityScore: 0 },
    };
  }
}
