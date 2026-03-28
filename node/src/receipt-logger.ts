import { keyManager } from "./key-manager.js";
import { config } from "./config.js";
import { RelayResult } from "./private-relay.js";
import { MevEstimate } from "./mev-estimator.js";
import { litVerifyRelay, litSign, isLitConfigured } from "./lit-chipotle.js";
import { ethers } from "ethers";
import fs from "fs/promises";
import path from "path";

export interface RelayReceipt {
  nodeId: string;
  timestamp: number;
  txHashes: string[];
  bundleHash: string;
  estimatedMevSaved: string;
  nodeSignature: string;
  storachaCid?: string;
  litEncrypted: boolean;
  litVerified?: boolean;
  litSignature?: string;
  litPkpAddress?: string;
}

const RECEIPTS_DIR = path.join(process.cwd(), "receipts");
let storachaClient: any = null;
let storachaReady = false;

async function ensureReceiptsDir() {
  try { await fs.mkdir(RECEIPTS_DIR, { recursive: true }); } catch {}
}

async function initStoracha(): Promise<boolean> {
  if (storachaReady) return true;
  if (!config.storachaSpaceDid) return false;
  try {
    const Client = await import("@storacha/client");
    storachaClient = await Client.create();
    await storachaClient.setCurrentSpace(config.storachaSpaceDid as `did:${string}:${string}`);
    storachaReady = true;
    console.log(`[Receipt] Storacha connected to space ${config.storachaSpaceDid}`);
    return true;
  } catch (err: any) {
    console.warn("[Receipt] Storacha unavailable, using local storage:", err.message);
    return false;
  }
}

async function uploadToStoracha(data: string): Promise<string | null> {
  if (!storachaClient || !storachaReady) return null;
  try {
    const blob = new Blob([data], { type: "application/json" });
    const cid = await storachaClient.uploadFile(blob);
    console.log(`[Receipt] Uploaded to Storacha: ${cid}`);
    return cid.toString();
  } catch (err: any) {
    console.warn("[Receipt] Storacha upload failed:", err.message);
    return null;
  }
}

export async function logRelay(
  relayResult: RelayResult,
  mevEstimate: MevEstimate
): Promise<RelayReceipt> {
  await initStoracha();

  const receiptData = {
    nodeId: config.nodeId,
    timestamp: Date.now(),
    txHashes: relayResult.txHashes,
    bundleHash: relayResult.bundleHash,
    estimatedMevSaved: mevEstimate.estimatedSavings.toString(),
  };

  const signature = await keyManager.sign(JSON.stringify(receiptData));
  const receipt: RelayReceipt = {
    ...receiptData,
    nodeSignature: signature,
    litEncrypted: isLitConfigured(),
  };

  if (isLitConfigured()) {
    const verification = await litVerifyRelay(receiptData);
    receipt.litVerified = verification.verified;
    if (verification.signature) receipt.litSignature = verification.signature;
    if (verification.address) receipt.litPkpAddress = verification.address;
    console.log(`[Receipt] Lit Chipotle verification: ${verification.verified ? "PASSED" : "SKIPPED"}`);
  }

  const receiptJson = JSON.stringify(receipt, null, 2);

  const cid = await uploadToStoracha(receiptJson);
  if (cid) receipt.storachaCid = cid;

  await ensureReceiptsDir();
  const filename = `receipt_${receipt.timestamp}_${receipt.bundleHash.slice(0, 10)}.json`;
  await fs.writeFile(path.join(RECEIPTS_DIR, filename), receiptJson);

  console.log(`[Receipt] Logged: ${filename}${cid ? ` (IPFS: ${cid})` : " (local only)"}`);
  console.log(`[Receipt] MEV saved: ${ethers.formatEther(mevEstimate.estimatedSavings)} ETH`);

  return receipt;
}
