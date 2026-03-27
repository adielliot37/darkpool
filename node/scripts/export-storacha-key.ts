import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_PATHS = [
  path.join(os.homedir(), "AppData", "Roaming", "w3access", "Config", "w3up-client.json"),
  path.join(os.homedir(), ".config", "storacha", "w3up-client.json"),
  path.join(os.homedir(), ".config", "w3access", "w3up-client.json"),
];

function findConfig(): string | null {
  for (const p of CONFIG_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const configPath = findConfig();
  if (!configPath) {
    console.error("No Storacha config found. Run setup-storacha.ts first.");
    process.exit(1);
  }

  const outDir = path.resolve(process.cwd(), "..");
  const outFile = path.join(outDir, "storacha-credentials.json");
  fs.copyFileSync(configPath, outFile);

  console.log("=".repeat(50));
  console.log("  STORACHA CREDENTIALS EXPORTED");
  console.log("=".repeat(50));
  console.log("");
  console.log(`Saved to: ${outFile}`);
  console.log("");
  console.log("To deploy to Pi:");
  console.log(`  scp ${outFile} pi:~/.config/w3access/Config/w3up-client.json`);
  console.log("");
  console.log("The Pi node will auto-detect and use these credentials.");
}

main().catch(console.error);
