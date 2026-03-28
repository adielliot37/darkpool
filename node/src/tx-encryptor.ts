import crypto from "crypto";
import { litEncrypt, litDecrypt, isLitConfigured } from "./lit-chipotle.js";

interface EncryptedTx {
  ciphertext: string;
  iv: string;
  tag: string;
  timestamp: number;
  originalHash: string;
  litEncrypted: boolean;
}

const LOCAL_KEY = crypto.randomBytes(32);

function localEncrypt(rawTx: string): EncryptedTx {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", LOCAL_KEY, iv);
  let ciphertext = cipher.update(rawTx, "utf8", "hex");
  ciphertext += cipher.final("hex");
  return {
    ciphertext,
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
    timestamp: Date.now(),
    originalHash: crypto.createHash("sha256").update(rawTx).digest("hex"),
    litEncrypted: false,
  };
}

function localDecrypt(encrypted: EncryptedTx): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", LOCAL_KEY, Buffer.from(encrypted.iv, "hex"));
  decipher.setAuthTag(Buffer.from(encrypted.tag, "hex"));
  let decrypted = decipher.update(encrypted.ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function encryptTransaction(rawTx: string): Promise<EncryptedTx> {
  if (isLitConfigured()) {
    const ciphertext = await litEncrypt(rawTx);
    if (ciphertext) {
      return {
        ciphertext,
        iv: "",
        tag: "",
        timestamp: Date.now(),
        originalHash: crypto.createHash("sha256").update(rawTx).digest("hex"),
        litEncrypted: true,
      };
    }
  }
  return localEncrypt(rawTx);
}

export async function decryptTransaction(encrypted: EncryptedTx): Promise<string> {
  if (encrypted.litEncrypted && isLitConfigured()) {
    const plaintext = await litDecrypt(encrypted.ciphertext);
    if (plaintext) return plaintext;
  }
  return localDecrypt(encrypted);
}

export type { EncryptedTx };
