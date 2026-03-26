import * as Client from "@web3-storage/w3up-client";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

async function main() {
  console.log("=".repeat(50));
  console.log("  STORACHA SETUP — One-time email verification");
  console.log("=".repeat(50));
  console.log("");

  const client = await Client.create();

  const email = await ask("Enter your email for Storacha verification: ");
  console.log(`\nSending verification email to ${email}...`);

  const account = await client.login(email as `${string}@${string}`);
  console.log("\nCheck your email and click the verification link.");
  console.log("Waiting for verification...");

  await account.plan.wait();
  console.log("Email verified!");

  const space = await client.createSpace("darkpool-receipts", { account });
  await space.save();
  console.log(`\nSpace created: ${space.did()}`);

  console.log("\n" + "=".repeat(50));
  console.log("  Add this to your .env file:");
  console.log("=".repeat(50));
  console.log(`\nSTORACHA_SPACE_DID=${space.did()}`);
  console.log("");
  console.log("The agent credentials are saved locally.");
  console.log("Run this script once — you won't need to verify again.");

  rl.close();
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
