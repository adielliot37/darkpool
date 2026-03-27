import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "";
const DEPLOYER_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [DEPLOYER_KEY],
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [DEPLOYER_KEY],
    },
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: [DEPLOYER_KEY],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || "",
  },
};

export default config;
