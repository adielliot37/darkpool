import { ethers } from "ethers";
import crypto from "crypto";

class KeyManager {
  private wallet: ethers.Wallet | null = null;

  async initialize(provider?: ethers.Provider): Promise<ethers.Wallet> {
    const randomBytes = crypto.randomBytes(32);
    this.wallet = new ethers.Wallet(ethers.hexlify(randomBytes), provider);
    console.log(`[KeyManager] Node wallet: ${this.wallet.address}`);
    console.log(`[KeyManager] Key exists in RAM only. Restart = new key.`);
    return this.wallet;
  }

  getWallet(): ethers.Wallet {
    if (!this.wallet) throw new Error("KeyManager not initialized");
    return this.wallet;
  }

  getAddress(): string {
    return this.getWallet().address;
  }

  async sign(data: string): Promise<string> {
    return await this.getWallet().signMessage(data);
  }

  destroy(): void {
    this.wallet = null;
  }
}

export const keyManager = new KeyManager();
