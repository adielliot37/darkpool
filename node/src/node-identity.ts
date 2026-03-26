import { ethers } from "ethers";
import { keyManager } from "./key-manager.js";
import { config } from "./config.js";

const AGENT_IDENTITY_ABI = [
  "function registerAgent(string name, string agentType, string endpoint) returns (uint256)",
  "function setAttribute(uint256 tokenId, string key, string value)",
  "function getAttribute(uint256 tokenId, string key) view returns (string)",
  "function getAgent(uint256 tokenId) view returns (string name, string agentType, string endpoint, uint256 createdAt)",
  "function agentTokenId(address) view returns (uint256)",
];

export class NodeIdentity {
  private contract: ethers.Contract | null = null;
  private tokenId: bigint = 0n;

  async initialize(): Promise<void> {
    if (!config.identityAddress) {
      console.log("[Identity] No identity contract configured, skipping");
      return;
    }

    const wallet = keyManager.getWallet();
    this.contract = new ethers.Contract(config.identityAddress, AGENT_IDENTITY_ABI, wallet);

    const existing = await this.contract.agentTokenId(wallet.address);
    if (existing > 0n) {
      this.tokenId = existing;
      console.log(`[Identity] Existing agent identity: token #${this.tokenId}`);
    }
  }

  async register(endpoint: string): Promise<bigint> {
    if (!this.contract) return 0n;

    try {
      const tx = await this.contract.registerAgent(
        config.nodeId,
        "darkpool-relay",
        endpoint
      );
      const receipt = await tx.wait();
      console.log(`[Identity] Registered agent identity, tx: ${receipt.hash}`);

      this.tokenId = await this.contract.agentTokenId(keyManager.getAddress());
      return this.tokenId;
    } catch (err: any) {
      console.error(`[Identity] Registration failed:`, err.message);
      return 0n;
    }
  }

  async updateAttribute(key: string, value: string): Promise<void> {
    if (!this.contract || this.tokenId === 0n) return;
    try {
      const tx = await this.contract.setAttribute(this.tokenId, key, value);
      await tx.wait();
    } catch (err: any) {
      console.error(`[Identity] setAttribute failed:`, err.message);
    }
  }

  getTokenId(): bigint {
    return this.tokenId;
  }
}

export const nodeIdentity = new NodeIdentity();
