import * as Client from "@storacha/client";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

async function main() {
  console.log("=".repeat(50));
  console.log("  STORACHA SETUP — One-time email verification");
  console.log("=".repeat(50));
  console.log("");

  console.log("Creating Storacha client...");
  const client = await Client.create();

  const email = await ask("Enter your email for Storacha verification: ");

  console.log(`\nCheck your email (${email}) and click the verification link...`);
  const account = await client.login(email as `${string}@${string}`);
  console.log("Verified!\n");

  console.log("Creating space...");
  try {
    const space = await client.createSpace("darkpool-receipts", {
      account,
      skipGatewayAuthorization: true,
    });
    await space.save();
    await client.setCurrentSpace(space.did());

    console.log(`Space created: ${space.did()}`);
    console.log("\n" + "=".repeat(50));
    console.log("  Add this to your .env file:");
    console.log("=".repeat(50));
    console.log(`\nSTORACHA_SPACE_DID=${space.did()}`);
  } catch (err: any) {
    console.error("\nSpace creation error details:");
    console.error("  Name:", err.name);
    console.error("  Message:", err.message);
    if (err.cause) console.error("  Cause:", err.cause);

    console.log("\nTrying with account provisioning first...");
    const spaces = client.spaces();
    if (spaces.length > 0) {
      const existing = spaces[0];
      await client.setCurrentSpace(existing.did());
      console.log(`\nUsing existing space: ${existing.did()}`);
      console.log("\n" + "=".repeat(50));
      console.log("  Add this to your .env file:");
      console.log("=".repeat(50));
      console.log(`\nSTORACHA_SPACE_DID=${existing.did()}`);
    } else {
      throw err;
    }
  }

  console.log("");
  console.log("Agent credentials saved locally by Storacha.");
  console.log("You won't need to verify again on this machine.");

  rl.close();
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  if (err.cause) console.error("Cause:", err.cause);
  rl.close();
  process.exit(1);
});
