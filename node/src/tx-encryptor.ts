import crypto from "crypto";
import { getLitClient, encryptWithLit } from "./lit-actions.js";

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
  const client = await getLitClient();

  if (client) {
    const result = await encryptWithLit(client, rawTx);
    if (result) {
      return {
        ciphertext: result.ciphertext,
        iv: "",
        tag: "",
        timestamp: Date.now(),
        originalHash: crypto.createHash("sha256").update(rawTx).digest("hex"),
        litEncrypted: true,
        dataToEncryptHash: result.dataToEncryptHash,
      };
    }
  }

  return localEncrypt(rawTx);
}

export async function decryptTransaction(encrypted: EncryptedTx): Promise<string> {
  if (!encrypted.litEncrypted) return localDecrypt(encrypted);

  const client = await getLitClient();
  if (client && encrypted.dataToEncryptHash) {
    try {
      const decrypted = await client.decrypt({
        chain: "base",
        ciphertext: encrypted.ciphertext as any,
        dataToEncryptHash: encrypted.dataToEncryptHash!,
        accessControlConditions: [
          {
            contractAddress: "",
            standardContractType: "",
            chain: "base" as const,
            method: "",
            parameters: [":currentActionIpfsId"],
            returnValueTest: {
              comparator: "contains" as const,
              value: "darkpool-relay",
            },
          },
        ],
      });
      return new TextDecoder().decode(decrypted as any);
    } catch (err: any) {
      console.warn("[Encryptor] Lit decrypt failed:", err.message);
    }
  }
  return localDecrypt(encrypted);
}

export type { EncryptedTx };
