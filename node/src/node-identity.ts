import { ethers } from "ethers";
import { keyManager } from "./key-manager.js";
import { config } from "./config.js";

const ERC8004_IDENTITY_ADDRESS = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const ERC8004_REPUTATION_ADDRESS = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";

const IDENTITY_ABI = [
  "function register(string agentURI) returns (uint256)",
  "function setAgentURI(uint256 agentId, string newURI)",
  "function setMetadata(uint256 agentId, string metadataKey, bytes metadataValue)",
  "function getMetadata(uint256 agentId, string metadataKey) view returns (bytes)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
];

const REPUTATION_ABI = [
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)",
  "function readAllFeedback(uint256 agentId, address[] clientAddresses, string tag1, string tag2, bool includeRevoked) view returns (address[], uint64[], int128[], uint8[], string[], string[], bool[])",
  "function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)",
  "function getClients(uint256 agentId) view returns (address[])",
  "event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, int128 value, uint8 valueDecimals, string indexed indexedTag1, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)",
];

export class NodeIdentity {
  private identityRegistry: ethers.Contract | null = null;
  private reputationRegistry: ethers.Contract | null = null;
  private agentId: bigint = 0n;

  async initialize(): Promise<void> {
    try {
      const wallet = keyManager.getWallet();
      this.identityRegistry = new ethers.Contract(ERC8004_IDENTITY_ADDRESS, IDENTITY_ABI, wallet);
      this.reputationRegistry = new ethers.Contract(ERC8004_REPUTATION_ADDRESS, REPUTATION_ABI, wallet);

      const balance = await this.identityRegistry.balanceOf(wallet.address);
      if (balance > 0n) {
        this.agentId = await this.identityRegistry.tokenOfOwnerByIndex(wallet.address, 0);
        console.log(`[ERC-8004] Existing agent identity: #${this.agentId}`);
      } else {
        console.log("[ERC-8004] No agent registered yet for this wallet");
      }
    } catch (err: any) {
      console.warn("[ERC-8004] Identity initialization failed:", err.message);
    }
  }

  async register(agentURI: string): Promise<bigint> {
    if (!this.identityRegistry) return 0n;
    try {
      const tx = await this.identityRegistry.register(agentURI);
      const receipt = await tx.wait();
      const event = receipt.logs.find((l: any) => {
        try {
          return this.identityRegistry!.interface.parseLog({ topics: l.topics as string[], data: l.data })?.name === "Registered";
        } catch { return false; }
      });
      if (event) {
        const parsed = this.identityRegistry.interface.parseLog({ topics: event.topics as string[], data: event.data });
        this.agentId = parsed!.args.agentId;
      }
      console.log(`[ERC-8004] Agent registered: #${this.agentId} tx: ${receipt.hash}`);
      return this.agentId;
    } catch (err: any) {
      console.error("[ERC-8004] Registration failed:", err.message);
      return 0n;
    }
  }

  async setMetadata(key: string, value: string): Promise<void> {
    if (!this.identityRegistry || this.agentId === 0n) return;
    try {
      const tx = await this.identityRegistry.setMetadata(
        this.agentId,
        key,
        ethers.toUtf8Bytes(value)
      );
      await tx.wait();
      console.log(`[ERC-8004] Metadata set: ${key}`);
    } catch (err: any) {
      console.error("[ERC-8004] setMetadata failed:", err.message);
    }
  }

  async postRelayFeedback(mevSaved: string, txHash: string, receiptCid?: string): Promise<void> {
    if (!this.reputationRegistry || this.agentId === 0n) return;
    try {
      const value = BigInt(Math.floor(parseFloat(mevSaved) * 100));
      const feedbackHash = ethers.keccak256(ethers.toUtf8Bytes(`${txHash}-${Date.now()}`));
      const tx = await this.reputationRegistry.giveFeedback(
        this.agentId,
        value,
        2,
        "mev-protection",
        "relay",
        process.env.PUBLIC_URL || `https://mev.elliot37.com`,
        receiptCid || "",
        feedbackHash
      );
      await tx.wait();
      console.log(`[ERC-8004] Reputation feedback posted for relay`);
    } catch (err: any) {
      console.error("[ERC-8004] Feedback failed:", err.message);
    }
  }

  async getReputation(): Promise<{ count: bigint; value: bigint; decimals: number } | null> {
    if (!this.reputationRegistry || this.agentId === 0n) return null;
    try {
      const clients = await this.reputationRegistry.getClients(this.agentId);
      const summary = await this.reputationRegistry.getSummary(this.agentId, clients, "", "");
      return { count: summary.count, value: summary.summaryValue, decimals: summary.summaryValueDecimals };
    } catch {
      return null;
    }
  }

  getAgentId(): bigint {
    return this.agentId;
  }

  getIdentityAddress(): string {
    return ERC8004_IDENTITY_ADDRESS;
  }

  getReputationAddress(): string {
    return ERC8004_REPUTATION_ADDRESS;
  }
}

export const nodeIdentity = new NodeIdentity();
