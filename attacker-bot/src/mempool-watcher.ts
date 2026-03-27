import { ethers } from "ethers";
import { EventEmitter } from "events";

export interface PendingTx {
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  data: string;
  gasPrice: bigint;
  nonce: number;
  timestamp: number;
}

export class MempoolWatcher extends EventEmitter {
  private provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
  private polling: ReturnType<typeof setInterval> | null = null;
  private seenTxs = new Set<string>();

  constructor(rpcUrl: string) {
    super();
    if (rpcUrl.startsWith("ws")) {
      this.provider = new ethers.WebSocketProvider(rpcUrl);
    } else {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }
  }

  async start(): Promise<void> {
    console.log("[Watcher] Monitoring mempool for targets...");

    if (this.provider instanceof ethers.WebSocketProvider) {
      this.provider.on("pending", async (txHash: string) => {
        if (this.seenTxs.has(txHash)) return;
        this.seenTxs.add(txHash);
        await this.processTx(txHash);
      });
    } else {
      this.polling = setInterval(async () => {
        try {
          const block = await this.provider.getBlock("pending", true);
          if (!block) return;
          for (const txHash of block.transactions) {
            const hash = typeof txHash === "string" ? txHash : txHash;
            if (this.seenTxs.has(hash)) continue;
            this.seenTxs.add(hash);
            await this.processTx(hash);
          }
        } catch {}
      }, 2000);
    }

    if (this.seenTxs.size > 10000) {
      const arr = [...this.seenTxs];
      this.seenTxs = new Set(arr.slice(-5000));
    }
  }

  private async processTx(txHash: string): Promise<void> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return;

      const pendingTx: PendingTx = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        data: tx.data,
        gasPrice: tx.gasPrice || 0n,
        nonce: tx.nonce,
        timestamp: Date.now(),
      };

      this.emit("transaction", pendingTx);
    } catch {}
  }

  stop(): void {
    if (this.polling) clearInterval(this.polling);
    this.provider.removeAllListeners();
  }
}
