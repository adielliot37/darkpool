import { ethers } from "ethers";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const KEY_FILE = path.join(process.cwd(), ".node-key");

class KeyManager {
  private wallet: ethers.Wallet | null = null;

  async initialize(provider?: ethers.Provider): Promise<ethers.Wallet> {
    let privateKey: string;

    if (fs.existsSync(KEY_FILE)) {
      privateKey = fs.readFileSync(KEY_FILE, "utf-8").trim();
      console.log("[KeyManager] Loaded persistent node key");
    } else {
      privateKey = ethers.hexlify(crypto.randomBytes(32));
      fs.writeFileSync(KEY_FILE, privateKey, { mode: 0o600 });
      console.log("[KeyManager] Generated new node key (saved to disk)");
    }

    this.wallet = new ethers.Wallet(privateKey, provider);
    console.log(`[KeyManager] Node wallet: ${this.wallet.address}`);
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
