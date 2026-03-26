import { EncryptedTx } from "./tx-encryptor.js";
import { config } from "./config.js";
import crypto from "crypto";

type FlushCallback = (batch: EncryptedTx[]) => Promise<void>;

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomDelay(): Promise<void> {
  const ms = crypto.randomInt(config.minDelayMs, config.maxDelayMs + 1);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TxBatcher {
  private batch: EncryptedTx[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private onFlush: FlushCallback;
  private batchCount = 0;

  constructor(onFlush: FlushCallback) {
    this.onFlush = onFlush;
  }

  async add(tx: EncryptedTx): Promise<number> {
    await randomDelay();
    this.batch.push(tx);
    const batchId = this.batchCount;

    if (this.batch.length >= config.batchSize) {
      await this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), config.batchTimeoutMs);
    }

    return batchId;
  }

  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.batch.length === 0) return;

    const bundle = shuffleArray([...this.batch]);
    this.batch = [];
    this.batchCount++;

    console.log(`[Batcher] Flushing batch #${this.batchCount} with ${bundle.length} transactions`);
    await this.onFlush(bundle);
  }

  getPendingCount(): number {
    return this.batch.length;
  }

  destroy(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.batch = [];
  }
}
