import crypto from "crypto";
import { config } from "./config.js";

interface EncryptedTx {
  ciphertext: string;
  iv: string;
  tag: string;
  timestamp: number;
  originalHash: string;
  litEncrypted?: boolean;
  dataToEncryptHash?: string;
}

const LOCAL_KEY = crypto.randomBytes(32);
let litClient: any = null;
let litReady = false;

async function initLit(): Promise<boolean> {
  if (litReady) return true;
  try {
    const { LitNodeClient } = await import("@lit-protocol/lit-node-client");
    const { LIT_NETWORK } = await import("@lit-protocol/constants");
    litClient = new LitNodeClient({
      litNetwork: (config.litNetwork as any) || LIT_NETWORK.DatilDev,
      debug: false,
    });
    await litClient.connect();
    litReady = true;
    console.log("[Encryptor] Lit Protocol connected");
    return true;
  } catch (err: any) {
    console.warn("[Encryptor] Lit Protocol unavailable, using local encryption:", err.message);
    return false;
  }
}

function localEncrypt(rawTx: string): EncryptedTx {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", LOCAL_KEY, iv);
  let ciphertext = cipher.update(rawTx, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return {
    ciphertext,
    iv: iv.toString("hex"),
    tag,
    timestamp: Date.now(),
    originalHash: crypto.createHash("sha256").update(rawTx).digest("hex"),
    litEncrypted: false,
  };
}

function localDecrypt(encrypted: EncryptedTx): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    LOCAL_KEY,
    Buffer.from(encrypted.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "hex"));
  let decrypted = decipher.update(encrypted.ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function encryptTransaction(rawTx: string): Promise<EncryptedTx> {
  const useLit = await initLit();

  if (useLit && litClient) {
    try {
      const accessControlConditions = [
        {
          contractAddress: "",
          standardContractType: "",
          chain: config.network === "base" ? "base" : "ethereum",
          method: "",
          parameters: [":currentActionIpfsId"],
          returnValueTest: {
            comparator: "contains",
            value: "darkpool-relay",
          },
        },
      ];

      const { ciphertext, dataToEncryptHash } = await litClient.encrypt({
        dataToEncrypt: new TextEncoder().encode(rawTx),
        accessControlConditions,
      });

      return {
        ciphertext: Buffer.from(await ciphertext.arrayBuffer?.() || ciphertext).toString("hex"),
        iv: "",
        tag: "",
        timestamp: Date.now(),
        originalHash: crypto.createHash("sha256").update(rawTx).digest("hex"),
        litEncrypted: true,
        dataToEncryptHash,
      };
    } catch (err: any) {
      console.warn("[Encryptor] Lit encrypt failed, falling back to local:", err.message);
    }
  }

  return localEncrypt(rawTx);
}

export async function decryptTransaction(encrypted: EncryptedTx): Promise<string> {
  if (encrypted.litEncrypted && litClient && litReady) {
    try {
      const decrypted = await litClient.decrypt({
        ciphertext: Buffer.from(encrypted.ciphertext, "hex"),
        dataToEncryptHash: encrypted.dataToEncryptHash,
        accessControlConditions: [
          {
            contractAddress: "",
            standardContractType: "",
            chain: config.network === "base" ? "base" : "ethereum",
            method: "",
            parameters: [":currentActionIpfsId"],
            returnValueTest: {
              comparator: "contains",
              value: "darkpool-relay",
            },
          },
        ],
      });
      return new TextDecoder().decode(decrypted);
    } catch (err: any) {
      console.warn("[Encryptor] Lit decrypt failed:", err.message);
      throw err;
    }
  }
  return localDecrypt(encrypted);
}

export type { EncryptedTx };
