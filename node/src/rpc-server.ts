import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import { config } from "./config.js";
import { encryptTransaction } from "./tx-encryptor.js";
import { TxBatcher } from "./tx-batcher.js";
import { PrivateRelay, RelayResult } from "./private-relay.js";
import { estimateMevSavings, MevEstimate } from "./mev-estimator.js";
import { logRelay, RelayReceipt } from "./receipt-logger.js";
import { EventEmitter } from "events";
import { isStarknetMethod, relayStarknetTx, proxyStarknetRpc } from "./starknet-relay.js";

export interface RelayEvent {
  type: "received" | "encrypted" | "batched" | "relayed" | "confirmed";
  txHash?: string;
  timestamp: number;
  mevEstimate?: MevEstimate;
  receipt?: RelayReceipt;
  relayResult?: RelayResult;
}

export const relayEvents = new EventEmitter();
let totalRelayed = 0;
let totalMevSaved = 0n;
const recentEvents: RelayEvent[] = [];

function pushEvent(event: RelayEvent) {
  recentEvents.push(event);
  if (recentEvents.length > 100) recentEvents.shift();
  relayEvents.emit("event", event);
}

export function createRpcServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const privateRelay = new PrivateRelay();

  const batcher = new TxBatcher(async (batch) => {
    const result = await privateRelay.submitBundle(batch);
    pushEvent({ type: "relayed", timestamp: Date.now(), relayResult: result });
  });

  app.post("/", async (req, res) => {
    const { method, params, id, jsonrpc } = req.body;

    if (method === "eth_sendRawTransaction") {
      try {
        const rawTx = params[0];
        pushEvent({ type: "received", timestamp: Date.now() });

        const mevEstimate = estimateMevSavings(rawTx);

        const encrypted = await encryptTransaction(rawTx);
        pushEvent({ type: "encrypted", timestamp: Date.now(), mevEstimate });

        await batcher.add(encrypted);
        pushEvent({ type: "batched", timestamp: Date.now() });

        const { hash } = await privateRelay.submitSingle(rawTx);
        totalRelayed++;
        totalMevSaved += mevEstimate.estimatedSavings;

        const relayResult: RelayResult = {
          bundleHash: ethers.keccak256(ethers.toUtf8Bytes(hash)),
          txHashes: [hash],
          timestamp: Date.now(),
          nodeId: config.nodeId,
          blockNumbers: [],
        };

        const receipt = await logRelay(relayResult, mevEstimate);
        pushEvent({ type: "confirmed", txHash: hash, timestamp: Date.now(), mevEstimate, receipt, relayResult });

        return res.json({ jsonrpc: "2.0", id, result: hash });
      } catch (err: any) {
        console.error("[RPC] Error processing tx:", err.message);
        return res.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32000, message: err.message },
        });
      }
    }

    if (method === "starknet_addInvokeTransaction") {
      try {
        pushEvent({ type: "received", timestamp: Date.now() });
        const result = await relayStarknetTx(params[0]);
        totalRelayed++;
        pushEvent({ type: "confirmed", txHash: result.txHash, timestamp: Date.now() });
        return res.json({ jsonrpc: "2.0", id, result: { transaction_hash: result.txHash } });
      } catch (err: any) {
        return res.json({ jsonrpc: "2.0", id, error: { code: -32000, message: err.message } });
      }
    }

    if (isStarknetMethod(method)) {
      try {
        const result = await proxyStarknetRpc(method, params || []);
        return res.json({ jsonrpc: "2.0", id, result });
      } catch (err: any) {
        return res.json({ jsonrpc: "2.0", id, error: { code: -32000, message: err.message } });
      }
    }

    try {
      const result = await provider.send(method, params || []);
      return res.json({ jsonrpc: "2.0", id, result });
    } catch (err: any) {
      return res.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: err.message || "Proxy error" },
      });
    }
  });

  app.get("/status", (_req, res) => {
    res.json({
      nodeId: config.nodeId,
      network: config.network,
      chains: ["ethereum", "base", "starknet"],
      totalRelayed,
      totalMevSaved: totalMevSaved.toString(),
      pendingBatch: batcher.getPendingCount(),
      uptime: process.uptime(),
    });
  });

  app.get("/events", (_req, res) => {
    res.json(recentEvents);
  });

  app.get("/events/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const handler = (event: RelayEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    relayEvents.on("event", handler);
    req.on("close", () => relayEvents.off("event", handler));
  });

  return app;
}
