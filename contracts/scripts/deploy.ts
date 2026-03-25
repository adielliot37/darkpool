import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Registry = await ethers.getContractFactory("DarkpoolRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("DarkpoolRegistry:", registryAddr);

  const Identity = await ethers.getContractFactory("AgentIdentity8004");
  const identity = await Identity.deploy();
  await identity.waitForDeployment();
  const identityAddr = await identity.getAddress();
  console.log("AgentIdentity8004:", identityAddr);

  console.log("\nAdd to .env:");
  console.log(`REGISTRY_CONTRACT_ADDRESS=${registryAddr}`);
  console.log(`AGENT_IDENTITY_CONTRACT_ADDRESS=${identityAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
