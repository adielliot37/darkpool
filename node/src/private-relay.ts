import { ethers } from "ethers";
import { EncryptedTx, decryptTransaction } from "./tx-encryptor.js";
import { config } from "./config.js";

export interface RelayResult {
  bundleHash: string;
  txHashes: string[];
  timestamp: number;
  nodeId: string;
  blockNumbers: (number | null)[];
}

export class PrivateRelay {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  async submitBundle(txs: EncryptedTx[]): Promise<RelayResult> {
    const txHashes: string[] = [];
    const blockNumbers: (number | null)[] = [];

    for (const tx of txs) {
      try {
        const rawTx = await decryptTransaction(tx);
        const hash = await this.provider.send("eth_sendRawTransaction", [rawTx]);
        txHashes.push(hash);
        console.log(`[Relay] Submitted tx: ${hash}`);

        const receipt = await this.provider.waitForTransaction(hash, 1, 30_000);
        blockNumbers.push(receipt?.blockNumber ?? null);
      } catch (err: any) {
        console.error(`[Relay] Failed to submit tx:`, err.message);
        txHashes.push("0x" + tx.originalHash);
        blockNumbers.push(null);
      }
    }

    const bundleHash = ethers.keccak256(
      ethers.toUtf8Bytes(txHashes.join(","))
    );

    return {
      bundleHash,
      txHashes,
      timestamp: Date.now(),
      nodeId: config.nodeId,
      blockNumbers,
    };
  }

  async submitSingle(rawTx: string): Promise<{ hash: string; blockNumber: number | null }> {
    try {
      const hash = await this.provider.send("eth_sendRawTransaction", [rawTx]);
      console.log(`[Relay] Submitted single tx: ${hash}`);
      const receipt = await this.provider.waitForTransaction(hash, 1, 30_000);
      return { hash, blockNumber: receipt?.blockNumber ?? null };
    } catch (err: any) {
      console.error(`[Relay] Single submit failed:`, err.message);
      throw err;
    }
  }
}
