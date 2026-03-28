import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LitAbility } from "@lit-protocol/auth-helpers";
import { LitActionResource, LitPKPResource } from "@lit-protocol/auth-helpers";
import { config } from "./config.js";
import { ethers } from "ethers";

let litClient: LitNodeClient | null = null;
let litReady = false;

export async function getLitClient(): Promise<LitNodeClient | null> {
  if (litReady && litClient) return litClient;
  try {
    litClient = new LitNodeClient({
      litNetwork: (config.litNetwork as any) || "datil",
      debug: false,
    });
    await litClient.connect();
    litReady = true;
    console.log("[Lit] Connected to", config.litNetwork);
    return litClient;
  } catch (err: any) {
    console.warn("[Lit] Connection failed:", err.message);
    return null;
  }
}

export async function getSessionSigs(client: LitNodeClient, authSig: any) {
  return client.getSessionSigs({
    chain: "base",
    resourceAbilityRequests: [
      { resource: new LitPKPResource("*"), ability: LitAbility.PKPSigning },
      { resource: new LitActionResource("*"), ability: LitAbility.LitActionExecution },
    ],
    authNeededCallback: async (params: any) => authSig,
  });
}

const RELAY_VERIFICATION_ACTION = `
(async () => {
  const receipt = JSON.parse(receiptJson);

  // Verify receipt has required fields
  if (!receipt.nodeId || !receipt.txHashes || !receipt.bundleHash || !receipt.estimatedMevSaved) {
    Lit.Actions.setResponse({ response: JSON.stringify({ verified: false, reason: "missing fields" }) });
    return;
  }

  // Verify timestamp is recent (within last hour)
  const now = Date.now();
  if (Math.abs(now - receipt.timestamp) > 3600000) {
    Lit.Actions.setResponse({ response: JSON.stringify({ verified: false, reason: "stale timestamp" }) });
    return;
  }

  // Verify MEV savings is non-negative
  if (BigInt(receipt.estimatedMevSaved) < 0n) {
    Lit.Actions.setResponse({ response: JSON.stringify({ verified: false, reason: "negative mev" }) });
    return;
  }

  // Sign the receipt hash with PKP
  const receiptHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(receipt)));
  const sigShare = await Lit.Actions.signEcdsa({
    toSign: ethers.utils.arrayify(receiptHash),
    publicKey: pkpPublicKey,
    sigName: "relayReceipt",
  });

  Lit.Actions.setResponse({
    response: JSON.stringify({
      verified: true,
      receiptHash,
      nodeId: receipt.nodeId,
      mevSaved: receipt.estimatedMevSaved,
      txCount: receipt.txHashes.length,
    }),
  });
})();
`;

export async function verifyRelayWithLitAction(
  client: LitNodeClient,
  receipt: any,
  sessionSigs: any,
  pkpPublicKey: string
): Promise<{ verified: boolean; signature?: string; reason?: string }> {
  try {
    const result = await client.executeJs({
      sessionSigs,
      code: RELAY_VERIFICATION_ACTION,
      jsParams: {
        receiptJson: JSON.stringify(receipt),
        pkpPublicKey,
      },
    });

    const response = JSON.parse(result.response as string);
    const signature = result.signatures?.relayReceipt?.signature;

    return {
      verified: response.verified,
      signature,
      reason: response.reason,
    };
  } catch (err: any) {
    console.warn("[Lit] Action execution failed:", err.message);
    return { verified: false, reason: err.message };
  }
}

export async function encryptWithLit(
  client: LitNodeClient,
  data: string
): Promise<{ ciphertext: string; dataToEncryptHash: string } | null> {
  try {
    const accessControlConditions = [
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
    ];

    const { ciphertext, dataToEncryptHash } = await client.encrypt({
      dataToEncrypt: new TextEncoder().encode(data),
      accessControlConditions,
    });

    return {
      ciphertext: Buffer.from(ciphertext as any).toString("hex"),
      dataToEncryptHash,
    };
  } catch (err: any) {
    console.warn("[Lit] Encryption failed:", err.message);
    return null;
  }
}

export async function pkpSignMessage(
  client: LitNodeClient,
  sessionSigs: any,
  pkpPublicKey: string,
  message: string
): Promise<string | null> {
  try {
    const msgHash = ethers.hashMessage(message);
    const result = await client.pkpSign({
      sessionSigs,
      pubKey: pkpPublicKey,
      toSign: ethers.getBytes(msgHash),
    });
    return result.signature;
  } catch (err: any) {
    console.warn("[Lit] PKP signing failed:", err.message);
    return null;
  }
}

export { RELAY_VERIFICATION_ACTION };
