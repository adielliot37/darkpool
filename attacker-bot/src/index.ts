import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { MempoolWatcher, PendingTx } from "./mempool-watcher.js";
import { isSwapTransaction, analyzeOpportunity, simulateSandwich, SandwichResult } from "./sandwich.js";
import { ethers } from "ethers";
import http from "http";

const RPC_URL = process.env.SEPOLIA_RPC_URL || process.env.SEPOLIA_WS_URL || "";
const PORT = parseInt(process.env.ATTACKER_PORT || "9000");

let totalScanned = 0;
let totalAttacks = 0;
let totalProfit = 0n;
const attacks: SandwichResult[] = [];

async function main() {
  console.log("=".repeat(50));
  console.log("  MEV SANDWICH BOT (SIMULATOR)");
  console.log("  For Darkpool demo purposes only");
  console.log("=".repeat(50));

  const watcher = new MempoolWatcher(RPC_URL);

  watcher.on("transaction", (tx: PendingTx) => {
    totalScanned++;

    if (!isSwapTransaction(tx)) return;

    console.log(`\n[BOT] Swap detected: ${tx.hash}`);
    console.log(`  From: ${tx.from}`);
    console.log(`  Value: ${ethers.formatEther(tx.value)} ETH`);

    const opportunity = analyzeOpportunity(tx);
    if (!opportunity) {
      console.log("  Verdict: Not profitable enough, skipping");
      return;
    }

    console.log(`  Estimated profit: ${ethers.formatEther(opportunity.estimatedProfit)} ETH`);
    console.log("  Executing sandwich attack...");

    const result = simulateSandwich(opportunity);
    attacks.push(result);
    totalAttacks++;
    totalProfit += result.profit;

    console.log(`  Front-run tx: ${result.frontRunHash.slice(0, 18)}...`);
    console.log(`  Back-run tx: ${result.backRunHash.slice(0, 18)}...`);
    console.log(`  Profit: ${ethers.formatEther(result.profit)} ETH`);
    console.log(`  Total attacks: ${totalAttacks} | Total profit: ${ethers.formatEther(totalProfit)} ETH`);
  });

  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.url === "/status") {
      res.end(JSON.stringify({
        totalScanned,
        totalAttacks,
        totalProfit: totalProfit.toString(),
        totalProfitEth: ethers.formatEther(totalProfit),
        recentAttacks: attacks.slice(-10).map((a) => ({
          targetHash: a.target.hash,
          profit: ethers.formatEther(a.profit),
          timestamp: a.timestamp,
        })),
      }));
    } else if (req.url === "/events") {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const handler = (tx: PendingTx) => {
        const opportunity = analyzeOpportunity(tx);
        if (opportunity) {
          const result = simulateSandwich(opportunity);
          res.write(`data: ${JSON.stringify({
            type: "attack",
            targetHash: tx.hash,
            profit: ethers.formatEther(result.profit),
            value: ethers.formatEther(tx.value),
            timestamp: Date.now(),
          })}\n\n`);
        }
      };

      watcher.on("transaction", handler);
      req.on("close", () => watcher.off("transaction", handler));
    } else {
      res.end(JSON.stringify({ service: "darkpool-attacker-bot", status: "running" }));
    }
  });

  server.listen(PORT, () => {
    console.log(`\n[BOT] Status API: http://localhost:${PORT}/status`);
    console.log(`[BOT] Events stream: http://localhost:${PORT}/events`);
  });

  await watcher.start();
  console.log("[BOT] Watching mempool...\n");
}

main().catch(console.error);
