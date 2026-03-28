import { config } from "./config.js";

const LIT_API = "https://api.dev.litprotocol.com/core/v1";
const LIT_API_KEY = process.env.LIT_API_KEY || "";
const LIT_USAGE_KEY = process.env.LIT_USAGE_KEY || "";
const LIT_PKP_ID = process.env.LIT_PKP_ID || "";

function getKey(): string {
  return LIT_USAGE_KEY || LIT_API_KEY;
}

async function execAction(code: string, jsParams: Record<string, any>): Promise<any> {
  const key = getKey();
  if (!key) return null;
  const res = await fetch(`${LIT_API}/lit_action`, {
    method: "POST",
    headers: { "X-Api-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ code, js_params: jsParams }),
  });
  const text = await res.text();
  let data: any;
  try {
    data = typeof text === "string" && text.startsWith('"') ? JSON.parse(JSON.parse(text)) : JSON.parse(text);
  } catch {
    data = JSON.parse(text);
  }
  if (data.has_error) {
    console.warn("[Lit-Chipotle] Action error:", data.logs);
    return null;
  }
  const response = data.response;
  return typeof response === "string" ? JSON.parse(response) : response;
}

export async function litEncrypt(message: string): Promise<string | null> {
  if (!LIT_PKP_ID) return null;
  const code = `async function main({ pkpId, message }) {
  const ct = await Lit.Actions.Encrypt({ pkpId, message });
  Lit.Actions.setResponse({ response: JSON.stringify({ ciphertext: ct }) });
}`;
  const result = await execAction(code, { pkpId: LIT_PKP_ID, message });
  if (!result) return null;
  console.log("[Lit-Chipotle] Encrypted in TEE");
  return result.ciphertext;
}

export async function litDecrypt(ciphertext: string): Promise<string | null> {
  if (!LIT_PKP_ID) return null;
  const code = `async function main({ pkpId, ciphertext }) {
  const pt = await Lit.Actions.Decrypt({ pkpId, ciphertext });
  Lit.Actions.setResponse({ response: JSON.stringify({ plaintext: pt }) });
}`;
  const result = await execAction(code, { pkpId: LIT_PKP_ID, ciphertext });
  return result?.plaintext ?? null;
}

export async function litSign(message: string): Promise<{ signature: string; address: string } | null> {
  if (!LIT_PKP_ID) return null;
  const code = `async function main({ pkpId, message }) {
  const pk = await Lit.Actions.getPrivateKey({ pkpId });
  const w = new ethers.Wallet(pk);
  Lit.Actions.setResponse({ response: JSON.stringify({ sig: await w.signMessage(message), addr: w.address }) });
}`;
  const result = await execAction(code, { pkpId: LIT_PKP_ID, message });
  if (!result) return null;
  return { signature: result.sig, address: result.addr };
}

export async function litVerifyRelay(receipt: any): Promise<{ verified: boolean; signature?: string; address?: string }> {
  if (!LIT_PKP_ID) return { verified: false };
  const code = `async function main({ pkpId, receiptJson }) {
  const receipt = JSON.parse(receiptJson);
  if (!receipt.nodeId || !receipt.txHashes || !receipt.bundleHash) {
    Lit.Actions.setResponse({ response: JSON.stringify({ verified: false, reason: "missing fields" }) });
    return;
  }
  if (BigInt(receipt.estimatedMevSaved) < 0n) {
    Lit.Actions.setResponse({ response: JSON.stringify({ verified: false, reason: "negative mev" }) });
    return;
  }
  const pk = await Lit.Actions.getPrivateKey({ pkpId });
  const w = new ethers.Wallet(pk);
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(receiptJson));
  const sig = await w.signMessage(hash);
  Lit.Actions.setResponse({ response: JSON.stringify({ verified: true, signature: sig, address: w.address }) });
}`;
  const result = await execAction(code, { pkpId: LIT_PKP_ID, receiptJson: JSON.stringify(receipt) });
  if (!result) return { verified: false };
  return { verified: result.verified, signature: result.signature, address: result.address };
}

export function isLitConfigured(): boolean {
  return !!(getKey() && LIT_PKP_ID);
}
